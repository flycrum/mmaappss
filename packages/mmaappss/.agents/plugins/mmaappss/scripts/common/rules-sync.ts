/**
 * Symlink plugin rules/ into .claude/rules/ and .cursor/rules/.
 * Tracks created paths in a manifest for idempotent teardown.
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
   * Remove rules symlinks and empty dirs using manifest. Idempotent.
   */
  clearRules(repoRoot: string, rulesTargetDir: string, manifestPath: string): Result<void, Error> {
    try {
      const manifestResult = syncFs.readJsonManifest<RulesSyncManifest>(manifestPath);
      if (manifestResult.isErr()) {
        if (manifestResult.error.message.includes('file not found')) return ok(undefined);
        return err(manifestResult.error);
      }
      const rulePaths = manifestResult.value.rules ?? [];

      syncFs.unlinkPaths(repoRoot, rulePaths);
      syncFs.pruneEmptySubdirsThenParent(rulesTargetDir);
      syncFs.unlinkIfExists(manifestPath);

      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Symlink each plugin's rules/*.md into rulesTargetDir/<pluginName>/.
   * Returns paths relative to repoRoot for manifest.
   */
  syncRules(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[],
    rulesTargetDir: string,
    manifestPath: string
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

      if (created.length > 0) {
        syncFs.writeJsonManifest(manifestPath, { rules: created } satisfies RulesSyncManifest);
      } else {
        syncFs.unlinkIfExists(manifestPath);
      }

      return ok(created);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
};
