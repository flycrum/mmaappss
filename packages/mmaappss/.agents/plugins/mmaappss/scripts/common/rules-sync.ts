/**
 * Symlink plugin rules/ into .claude/rules/ and .cursor/rules/.
 * Tracks created paths in a manifest for idempotent teardown.
 */

import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';
import type { DiscoveredMarketplace } from './types.js';

const RULES_SUBDIR = 'rules';

export interface RulesSyncManifest {
  rules: string[];
}

/**
 * Symlink plugin rules into target dirs and clear by manifest.
 */
export const rulesSync = {
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
      if (!fs.existsSync(rulesTargetDir)) {
        fs.mkdirSync(rulesTargetDir, { recursive: true });
      }

      for (const m of marketplaces) {
        for (const plugin of m.plugins) {
          const rulesDir = path.join(plugin.path, RULES_SUBDIR);
          if (!fs.existsSync(rulesDir)) continue;

          const files = fs.readdirSync(rulesDir).filter((f) => /\.(md|mdc|markdown)$/i.test(f));
          if (files.length === 0) continue;

          const pluginRulesDir = path.join(rulesTargetDir, plugin.name);
          if (!fs.existsSync(pluginRulesDir)) {
            fs.mkdirSync(pluginRulesDir, { recursive: true });
          }

          for (const file of files) {
            const targetPath = path.join(rulesDir, file);
            const linkPath = path.join(pluginRulesDir, file);
            const relativeTarget = path.relative(path.dirname(linkPath), targetPath);

            if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
            fs.symlinkSync(relativeTarget, linkPath);
            created.push(path.relative(repoRoot, linkPath));
          }
        }
      }

      if (created.length > 0) {
        const manifestDir = path.dirname(manifestPath);
        if (!fs.existsSync(manifestDir)) fs.mkdirSync(manifestDir, { recursive: true });
        fs.writeFileSync(
          manifestPath,
          JSON.stringify({ rules: created } satisfies RulesSyncManifest, null, 2)
        );
      } else if (fs.existsSync(manifestPath)) {
        fs.unlinkSync(manifestPath);
      }

      return ok(created);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Remove rules symlinks and empty dirs using manifest. Idempotent.
   */
  clearRules(repoRoot: string, rulesTargetDir: string, manifestPath: string): Result<void, Error> {
    try {
      if (!fs.existsSync(manifestPath)) return ok(undefined);

      const raw = fs.readFileSync(manifestPath, 'utf8');
      let manifest: RulesSyncManifest;
      try {
        manifest = JSON.parse(raw) as RulesSyncManifest;
      } catch (e) {
        return err(new Error(`${manifestPath}: ${e instanceof Error ? e.message : String(e)}`));
      }
      const rulePaths = manifest.rules ?? [];

      for (const rel of rulePaths) {
        const full = path.join(repoRoot, rel);
        try {
          if (fs.existsSync(full)) fs.unlinkSync(full);
        } catch {
          // ignore
        }
      }

      if (fs.existsSync(rulesTargetDir)) {
        const pluginDirs = fs.readdirSync(rulesTargetDir, { withFileTypes: true });
        for (const d of pluginDirs) {
          if (d.isDirectory()) {
            const sub = path.join(rulesTargetDir, d.name);
            const entries = fs.readdirSync(sub);
            if (entries.length === 0) fs.rmdirSync(sub);
          }
        }
        const remaining = fs.readdirSync(rulesTargetDir);
        if (remaining.length === 0) fs.rmdirSync(rulesTargetDir);
      }

      fs.unlinkSync(manifestPath);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
};
