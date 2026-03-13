/**
 * Skills directory sync: when resolved skills path (e.g. .agents/skills) differs from an agent's
 * native skills path, syncs skill dirs from source to native so the agent discovers them.
 * If resolved === native, no-op. Supports symlink (default) or clone-directories mode.
 */

import fse from 'fs-extra';
import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';
import { isExcluded } from '../../common/excluded-patterns.js';
import { getLogger } from '../../common/logger.js';
import { syncFs } from '../../common/sync-fs.js';
import { syncManifest } from '../../common/sync-manifest.js';
import {
  getResolvedSkillsPath,
  type BasePresetOptionsOverride,
} from '../presets/agent-presets/mmaappss-base-preset-options.js';
import { getNativeSkillsDirForAgent } from '../presets/agent-presets/preset-manifest-paths.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

const DEFAULT_EXCLUDE = ['node_modules', 'dist', '.git', '.turbo', '.next'];

/** Sync mode: symlink skill dirs or copy (clone) them. */
export type SkillsDirectorySyncMode = 'symlink' | 'clone-directories';

export interface SkillsDirectorySyncBehaviorOptions {
  /** When to sync: `symlink` (default) or `clone-directories`. */
  mode?: SkillsDirectorySyncMode;
}

function normalizePathForCompare(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+$/, '') || '/';
}

/** Discover all skills roots (root + nested) and collect skill names per root. */
function discoverSkillsRoots(
  repoRoot: string,
  resolvedSkillsPath: string,
  excluded: string[] | undefined
): Array<{ absoluteRoot: string; relativeRoot: string; skillNames: string[] }> {
  const walkPatterns = [...DEFAULT_EXCLUDE, ...(excluded ?? [])];
  const segments = resolvedSkillsPath.split('/').filter(Boolean);
  const results: Array<{ absoluteRoot: string; relativeRoot: string; skillNames: string[] }> = [];

  function collect(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const fullPath = path.join(dir, ent.name);
      const relativePath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
      if (isExcluded(relativePath, walkPatterns) || isExcluded(ent.name, walkPatterns)) continue;
      const skillsPath = path.join(fullPath, ...segments);
      if (fs.existsSync(skillsPath) && fs.statSync(skillsPath).isDirectory()) {
        const relativeSkills = path.relative(repoRoot, skillsPath).replace(/\\/g, '/');
        if (isExcluded(relativeSkills, excluded)) continue;
        const skillNames = syncFs.listSubdirsWhere(skillsPath, (sub) =>
          syncFs.isFile(path.join(sub, 'SKILL.md'))
        );
        if (skillNames.length > 0) {
          results.push({
            absoluteRoot: skillsPath,
            relativeRoot: relativeSkills,
            skillNames,
          });
        }
      }
      if (
        segments.length >= 2 &&
        ent.name === segments[segments.length - 1] &&
        path.basename(dir) === segments[segments.length - 2]
      ) {
        continue;
      }
      collect(fullPath);
    }
  }

  const rootSkills = path.join(repoRoot, ...segments);
  if (fs.existsSync(rootSkills) && fs.statSync(rootSkills).isDirectory()) {
    const relativeRoot = path.relative(repoRoot, rootSkills).replace(/\\/g, '/');
    if (!isExcluded(relativeRoot, excluded)) {
      const skillNames = syncFs.listSubdirsWhere(rootSkills, (sub) =>
        syncFs.isFile(path.join(sub, 'SKILL.md'))
      );
      if (skillNames.length > 0) {
        results.unshift({
          absoluteRoot: rootSkills,
          relativeRoot,
          skillNames,
        });
      }
    }
  }
  collect(repoRoot);
  return results;
}

/** Flatten to unique skill entries (name -> source absolute path). Last wins for duplicate names. */
function flattenSkillSources(
  roots: Array<{ absoluteRoot: string; relativeRoot: string; skillNames: string[] }>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of roots) {
    for (const name of r.skillNames) {
      map.set(name, path.join(r.absoluteRoot, name));
    }
  }
  return map;
}

export class SkillsDirectorySyncBehavior extends SyncBehaviorBase<SkillsDirectorySyncBehaviorOptions> {
  constructor(options?: SkillsDirectorySyncBehaviorOptions) {
    super(options);
  }

  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const basePresetOptions: BasePresetOptionsOverride | null | undefined =
      context.tsConfig?.basePresetOptions;
    const resolvedPath = getResolvedSkillsPath(basePresetOptions);
    const nativePath = getNativeSkillsDirForAgent(context.agentName);
    const resolvedNorm = normalizePathForCompare(resolvedPath);
    const nativeNorm = normalizePathForCompare(nativePath);

    if (!nativePath || resolvedNorm === nativeNorm) {
      const key = context.currentBehaviorManifestKey ?? 'skillsDirectorySync';
      context.registerContentToMmaappssSyncManifest(context.agentName, key, {
        options: context.currentBehaviorOptionsForManifest,
        symlinks: [],
      });
      return ok(undefined);
    }

    const excluded = context.tsConfig?.excluded;
    const roots = discoverSkillsRoots(context.repoRoot, resolvedPath, excluded);
    const skillsMap = flattenSkillSources(roots);
    if (skillsMap.size === 0) {
      const key = context.currentBehaviorManifestKey ?? 'skillsDirectorySync';
      context.registerContentToMmaappssSyncManifest(context.agentName, key, {
        options: context.currentBehaviorOptionsForManifest,
        symlinks: [],
      });
      return ok(undefined);
    }

    const mode = this.options?.mode ?? 'symlink';
    const targetBase = path.join(context.outputRoot, nativePath);
    syncFs.ensureDir(targetBase);
    const createdRel: string[] = [];

    try {
      for (const [skillName, sourceAbsolute] of skillsMap) {
        const destPath = path.join(targetBase, skillName);
        const rel = path.relative(context.outputRoot, destPath).replace(/\\/g, '/');
        if (isExcluded(rel, excluded)) continue;
        if (mode === 'symlink') {
          syncFs.symlinkRelative(sourceAbsolute, destPath);
          createdRel.push(rel);
        } else {
          if (syncFs.pathExists(destPath)) syncFs.rmSync(destPath, { recursive: true, force: true });
          fse.copySync(sourceAbsolute, destPath);
          createdRel.push(rel);
        }
      }
    } catch (e) {
      getLogger().error(
        { agent: context.agentName, mode, err: e instanceof Error ? e.message : String(e) },
        'skills-directory-sync: failed'
      );
      return err(e instanceof Error ? e : new Error(String(e)));
    }

    const key = context.currentBehaviorManifestKey ?? 'skillsDirectorySync';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      ...(mode === 'symlink' ? { symlinks: createdRel } : { fsAutoRemoval: createdRel }),
    });
    return ok(undefined);
  }

  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') {
      syncManifest.teardownEntry(context.outputRoot, entry);
    }
    return ok(undefined);
  }

  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') {
      syncManifest.teardownEntry(context.outputRoot, entry);
    }
    return ok(undefined);
  }
}
