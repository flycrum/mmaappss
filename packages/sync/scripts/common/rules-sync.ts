/**
 * Symlink plugin rules into a target directory. Target dir and manifest path are supplied by the caller (e.g. agent presets).
 * Tracks created paths in a manifest for idempotent teardown.
 *
 * Call sequence: callers should invoke clearRules before syncRules (remove stale symlinks, then recreate). syncRules assumes clearRules has been run so the run is idempotent.
 */

import { err, ok, Result } from 'neverthrow';
import path from 'node:path';
import { syncFs } from './sync-fs.js';
import type { DiscoveredMarketplace } from './types.js';

const RULES_SUBDIR = 'rules';
const RULE_EXT = /\.(md|mdc|markdown)$/i;

export interface RulesSyncManifest {
  rules: string[];
}

/**
 * Symlink plugin rules into target dirs and clear by manifest.
 */
export const rulesSync = {
  /**
   * Remove rules symlinks and empty dirs using stored content (e.g. from unified sync manifest).
   */
  clearRulesFromContents(
    repoRoot: string,
    rulesTargetDir: string,
    contents: { rules?: string[] }
  ): Result<void, Error> {
    try {
      const rulePaths = contents.rules ?? [];
      syncFs.unlinkPaths(repoRoot, rulePaths);
      syncFs.pruneEmptySubdirsThenParent(rulesTargetDir);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Remove rules symlinks and empty dirs using manifest file. Idempotent.
   * @deprecated Prefer unified sync manifest and clearRulesFromContents.
   */
  clearRules(repoRoot: string, rulesTargetDir: string, manifestPath: string): Result<void, Error> {
    try {
      const manifestResult = syncFs.readJsonManifest<RulesSyncManifest>(manifestPath);
      if (manifestResult.isErr()) {
        const e = manifestResult.error as Error & { code?: string };
        if (e.code === 'ENOENT') return ok(undefined);
        return err(manifestResult.error);
      }
      const result = rulesSync.clearRulesFromContents(
        repoRoot,
        rulesTargetDir,
        manifestResult.value
      );
      if (result.isErr()) return result;
      syncFs.unlinkIfExists(manifestPath);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Symlink each plugin's rules/*.md into rulesTargetDir/<pluginName>/.
   * Returns paths relative to repoRoot. When skipManifestWrite is true, does not write manifestPath.
   */
  syncRules(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[],
    rulesTargetDir: string,
    manifestPath: string,
    skipManifestWrite?: boolean
  ): Result<string[], Error> {
    const created: string[] = [];

    try {
      syncFs.ensureDir(rulesTargetDir);

      for (const m of marketplaces) {
        for (const plugin of m.plugins) {
          const rulesDir = path.join(plugin.path, RULES_SUBDIR);
          const files = syncFs.listFiles(rulesDir, RULE_EXT);
          if (files.length === 0) continue;

          const pluginRulesDir = path.join(rulesTargetDir, plugin.name);
          syncFs.ensureDir(pluginRulesDir);

          for (const file of files) {
            const targetPath = path.join(rulesDir, file);
            const linkPath = path.join(pluginRulesDir, file);
            syncFs.symlinkRelative(targetPath, linkPath);
            created.push(path.relative(repoRoot, linkPath));
          }
        }
      }

      if (!skipManifestWrite) {
        if (created.length > 0) {
          syncFs.writeJsonManifest(manifestPath, { rules: created } satisfies RulesSyncManifest);
        } else {
          syncFs.unlinkIfExists(manifestPath);
        }
      }

      return ok(created);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
};
