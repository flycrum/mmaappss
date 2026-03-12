/**
 * Generic symlink sync: create targetFile symlinks from sourceFile (e.g. AGENTS.md → CLAUDE.md).
 * Agent-agnostic; all paths, manifest location, and gitignore text come from options.
 * Tracks created paths in a manifest for teardown.
 */

import { err, ok, Result } from 'neverthrow';
import path from 'node:path';
import type { MmaappssConfig } from './config-helpers.js';
import { isExcluded as isExcludedByPatterns } from './excluded-patterns.js';
import { getLogger } from './logger.js';
import { syncFs } from './sync-fs.js';

/** Default segments to exclude from walk (match discovery). */
const DEFAULT_EXCLUDE = ['node_modules', 'dist', '.git', '.turbo', '.next'];

/** Manifest shape: list of created symlink paths (relative to repo root). */
export interface AgentsMdSymlinkManifest {
  paths: string[];
}

/** Options for generic agents-md symlink sync (supplied by sync behavior / agent preset). */
export interface AgentsMdSymlinkOptions {
  /** Source file name to symlink from (e.g. AGENTS.md). */
  sourceFile: string;
  /** Target file name to create as symlink (e.g. CLAUDE.md). */
  targetFile: string;
  /** Extra exclude dir names for walk (merged with config.excluded). Omit to use default. */
  defaultExclude?: string[];
  /** Comment line(s) to add above gitignoreEntry when ensuring .gitignore. Omit to skip .gitignore. */
  gitignoreComment?: string;
  /** Line to append to .gitignore (e.g. CLAUDE.md). Requires gitignoreComment if present. */
  gitignoreEntry?: string;
}

function getExcludePatterns(
  options: AgentsMdSymlinkOptions,
  config: MmaappssConfig | null
): string[] {
  const base = options.defaultExclude ?? DEFAULT_EXCLUDE;
  return [...base, ...(config?.excluded ?? [])];
}

function isExcluded(dirName: string, patterns: string[]): boolean {
  return isExcludedByPatterns(dirName, patterns);
}

/**
 * Ensure root .gitignore contains gitignoreEntry with optional comment. Idempotent.
 */
function ensureGitignore(repoRoot: string, options: AgentsMdSymlinkOptions): Result<void, Error> {
  if (!options.gitignoreEntry || options.gitignoreComment === undefined) return ok(undefined);
  const gitignorePath = path.join(repoRoot, '.gitignore');
  const comment = options.gitignoreComment;
  const entry = options.gitignoreEntry;
  const lineToMatch = new RegExp(`^\\s*${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  try {
    if (!syncFs.pathExists(gitignorePath)) {
      syncFs.writeFileUtf8(gitignorePath, `${comment}${entry}\n`);
      return ok(undefined);
    }
    const content = syncFs.readFileUtf8(gitignorePath);
    if (lineToMatch.test(content)) return ok(undefined);
    const appended = content.trimEnd() + `\n\n${comment}${entry}\n`;
    syncFs.writeFileUtf8(gitignorePath, appended);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Sync and clear API for agents-md symlink (e.g. AGENTS.md → CLAUDE.md).
 */
export const agentsMdSymlinkSync = {
  /**
   * Find all directories under repoRoot that contain sourceFile (respecting exclusions).
   * Returns paths relative to repoRoot (directory of sourceFile).
   */
  findAgentsMdDirs(
    repoRoot: string,
    config: MmaappssConfig | null,
    options: AgentsMdSymlinkOptions
  ): string[] {
    const patterns = getExcludePatterns(options, config);
    const found: string[] = [];
    const walk = (dir: string): void => {
      const entries = syncFs.readdirWithTypes(dir);
      const hasSource = entries.some((e) => !e.isDirectory && e.name === options.sourceFile);
      if (hasSource) found.push(path.relative(repoRoot, dir));
      for (const ent of entries) {
        if (!ent.isDirectory) continue;
        if (isExcluded(ent.name, patterns)) continue;
        walk(path.join(dir, ent.name));
      }
    };
    walk(repoRoot);
    return found.sort();
  },

  /**
   * Remove managed target symlinks using stored manifest content (e.g. from unified sync manifest).
   * Only removes paths that are symlinks; does not touch regular files.
   * When outputRoot is set, paths are resolved under outputRoot.
   */
  clearFromContents(
    repoRoot: string,
    contents: { paths?: string[] },
    outputRoot?: string
  ): Result<void, Error> {
    const root = outputRoot ?? repoRoot;
    const paths = contents.paths ?? [];
    try {
      for (const rel of paths) {
        const full = path.join(root, rel);
        try {
          if (syncFs.pathExists(full) && syncFs.isSymlink(full)) {
            syncFs.unlinkIfExists(full);
          }
        } catch (e) {
          getLogger().debug({ err: e, path: full }, 'agentsMdSymlink: unlink failed');
        }
      }
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Create targetFile symlinks for every directory that has sourceFile.
   * Skips directories where targetFile already exists as a regular file.
   * Returns created paths for caller to register to unified manifest.
   * When outputRoot is set, walk and writes are under outputRoot (paths returned relative to outputRoot).
   *
   * **Clean slate:** This function overwrites the manifest with only the paths created this run. To avoid orphaned symlinks (e.g. from dirs now excluded or without sourceFile), callers must call `clearFromContents(repoRoot, { paths: storedPaths }, outputRoot)` with the previously stored manifest paths before calling `sync`, then register the new `created` paths to the manifest after sync.
   */
  sync(
    repoRoot: string,
    config: MmaappssConfig | null,
    options: AgentsMdSymlinkOptions,
    outputRoot?: string
  ): Result<string[], Error> {
    const root = outputRoot ?? repoRoot;
    const created: string[] = [];
    try {
      const ensureGit = ensureGitignore(root, options);
      if (ensureGit.isErr()) return err(ensureGit.error);

      const dirs = agentsMdSymlinkSync.findAgentsMdDirs(root, config, options);
      for (const relDir of dirs) {
        const dir = path.join(root, relDir);
        const sourcePath = path.join(dir, options.sourceFile);
        const targetPath = path.join(dir, options.targetFile);
        const relTarget = path.join(relDir, options.targetFile).replace(/\\/g, '/');

        if (!syncFs.pathExists(sourcePath)) continue;

        if (syncFs.pathExists(targetPath)) {
          if (!syncFs.isSymlink(targetPath)) continue;
          const target = syncFs.readlink(targetPath);
          const expected = path.relative(path.dirname(targetPath), sourcePath);
          if (
            target === expected ||
            path.resolve(path.dirname(targetPath), target) === sourcePath
          ) {
            created.push(relTarget);
            continue;
          }
          syncFs.unlinkIfExists(targetPath);
        }

        syncFs.symlinkRelative(sourcePath, targetPath);
        created.push(relTarget);
      }

      return ok(created);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
};
