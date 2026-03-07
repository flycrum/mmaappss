/**
 * Symlink CLAUDE.md from AGENTS.md (root and nested) so Claude sees the same instructions.
 * Only runs when Claude marketplace is enabled. Tracks created paths in a manifest for teardown.
 */

import { err, ok, Result } from 'neverthrow';
import path from 'node:path';
import type { MmaappssConfig } from './config-helpers.js';
import { syncFs } from './sync-fs.js';

const AGENTS_MD = 'AGENTS.md';
const CLAUDE_MD = 'CLAUDE.md';

/** Default directories to exclude from scanning (match discovery.ts). */
const DEFAULT_EXCLUDE = ['node_modules', 'dist', '.git', '.turbo', '.next'];

const CLAUDE_MD_SYNC_MANIFEST = '.claude/.mmaappss-claude-md-sync.json';

export interface ClaudeMdSyncManifest {
  claudeMdPaths: string[];
}

function isExcluded(dirName: string, config: MmaappssConfig | null): boolean {
  const exclude = [...DEFAULT_EXCLUDE, ...(config?.excludeDirectories ?? [])];
  return exclude.some((e) => dirName === e);
}

/**
 * Ensure root .gitignore contains an entry for CLAUDE.md so symlinked files are not committed.
 * Idempotent: only appends if no line already matches.
 */
function ensureGitignoreClaudeMd(repoRoot: string): Result<void, Error> {
  const gitignorePath = path.join(repoRoot, '.gitignore');
  try {
    if (!syncFs.pathExists(gitignorePath)) {
      syncFs.writeFileUtf8(
        gitignorePath,
        '\n# mmaappss: symlinked from AGENTS.md for Claude\nCLAUDE.md\n'
      );
      return ok(undefined);
    }
    const content = syncFs.readFileUtf8(gitignorePath);
    if (/^CLAUDE\.md$/m.test(content) || /^\s*CLAUDE\.md\s*$/m.test(content)) {
      return ok(undefined);
    }
    const appended =
      content.trimEnd() + '\n\n# mmaappss: symlinked from AGENTS.md for Claude\nCLAUDE.md\n';
    syncFs.writeFileUtf8(gitignorePath, appended);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Single export: CLAUDE.md symlink sync/clear and discovery.
 */
export const claudeMdSync = {
  /**
   * Remove CLAUDE.md symlinks created by sync (using manifest). Idempotent.
   * Only removes paths that are symlinks; does not touch regular files.
   */
  clearClaudeMd(repoRoot: string): Result<void, Error> {
    const manifestPath = path.join(repoRoot, CLAUDE_MD_SYNC_MANIFEST);
    try {
      const manifestResult = syncFs.readJsonManifest<ClaudeMdSyncManifest>(manifestPath);
      if (manifestResult.isErr()) {
        if (manifestResult.error.message.includes('file not found')) return ok(undefined);
        return err(manifestResult.error);
      }
      const paths = manifestResult.value.claudeMdPaths ?? [];

      for (const rel of paths) {
        const full = path.join(repoRoot, rel);
        try {
          if (syncFs.pathExists(full) && syncFs.isSymlink(full)) {
            syncFs.unlinkIfExists(full);
          }
        } catch {
          // ignore
        }
      }

      syncFs.unlinkIfExists(manifestPath);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Find all directories under repoRoot that contain AGENTS.md (respecting exclusions).
   * Returns paths relative to repoRoot (directory of AGENTS.md, not the file path).
   */
  findAgentsMdDirs(repoRoot: string, config: MmaappssConfig | null): string[] {
    const found: string[] = [];

    const walk = (dir: string): void => {
      const entries = syncFs.readdirWithTypes(dir);
      const hasAgentsMd = entries.some((e) => !e.isDirectory && e.name === AGENTS_MD);
      if (hasAgentsMd) {
        found.push(path.relative(repoRoot, dir));
      }
      for (const ent of entries) {
        if (!ent.isDirectory) continue;
        if (isExcluded(ent.name, config)) continue;
        walk(path.join(dir, ent.name));
      }
    };

    walk(repoRoot);
    return found.sort();
  },

  /**
   * Create CLAUDE.md symlinks for every directory that has AGENTS.md.
   * Skips directories where CLAUDE.md already exists as a regular file (do not overwrite).
   * Writes manifest for idempotent clear.
   */
  syncClaudeMd(repoRoot: string, config: MmaappssConfig | null): Result<string[], Error> {
    const created: string[] = [];
    try {
      const ensureGit = ensureGitignoreClaudeMd(repoRoot);
      if (ensureGit.isErr()) return err(ensureGit.error);

      const dirs = this.findAgentsMdDirs(repoRoot, config);
      for (const relDir of dirs) {
        const dir = path.join(repoRoot, relDir);
        const agentsPath = path.join(dir, AGENTS_MD);
        const claudePath = path.join(dir, CLAUDE_MD);
        const relClaude = path.join(relDir, CLAUDE_MD).replace(/\\/g, '/');

        if (!syncFs.pathExists(agentsPath)) continue;

        if (syncFs.pathExists(claudePath)) {
          if (!syncFs.isSymlink(claudePath)) continue; // leave user-created CLAUDE.md alone
          const target = syncFs.readlink(claudePath);
          const expected = path.relative(path.dirname(claudePath), agentsPath);
          if (
            target === expected ||
            path.resolve(path.dirname(claudePath), target) === agentsPath
          ) {
            created.push(relClaude);
            continue;
          }
          syncFs.unlinkIfExists(claudePath);
        }

        syncFs.symlinkRelative(agentsPath, claudePath);
        created.push(relClaude);
      }

      const manifestPath = path.join(repoRoot, CLAUDE_MD_SYNC_MANIFEST);
      if (created.length > 0) {
        syncFs.ensureDir(path.dirname(manifestPath));
        syncFs.writeJsonManifest(manifestPath, {
          claudeMdPaths: created,
        } satisfies ClaudeMdSyncManifest);
      } else {
        syncFs.unlinkIfExists(manifestPath);
      }

      return ok(created);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
};
