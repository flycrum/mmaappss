import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rulesSync } from './rules-sync.js';
import type { DiscoveredMarketplace, DiscoveredPlugin } from './types.js';

function createPlugin(repoRoot: string, name: string, hasRules = true): DiscoveredPlugin {
  const pluginDir = path.join(repoRoot, '.agents', 'plugins', name);
  fs.mkdirSync(pluginDir, { recursive: true });
  if (hasRules) {
    const rulesDir = path.join(pluginDir, 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    fs.writeFileSync(path.join(rulesDir, 'foo.md'), '# Foo');
    fs.writeFileSync(path.join(rulesDir, 'bar.mdc'), '# Bar');
  }
  return {
    name,
    path: pluginDir,
    relativePath: `.agents/plugins/${name}`,
    hasClaudeManifest: false,
    hasCursorManifest: false,
  };
}

describe('rulesSync', () => {
  let tmpDir: string;
  let repoRoot: string;
  let rulesTargetDir: string;
  let manifestPath: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mmaappss-rules-'));
    repoRoot = path.join(tmpDir, 'repo');
    rulesTargetDir = path.join(repoRoot, '.claude', 'rules');
    manifestPath = path.join(repoRoot, '.claude', '.mmaappss-claude-sync.json');
    fs.mkdirSync(repoRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  describe('syncRules', () => {
    it('creates symlinks and manifest for plugins with rules', () => {
      const plugin = createPlugin(repoRoot, 'myplugin');
      const marketplaces: DiscoveredMarketplace[] = [
        {
          pluginsDir: path.join(repoRoot, '.agents', 'plugins'),
          relativePath: '.agents/plugins',
          label: 'Root',
          plugins: [plugin],
        },
      ];

      const result = rulesSync.syncRules(repoRoot, marketplaces, rulesTargetDir, manifestPath);

      expect(result.isOk()).toBe(true);
      const created = result._unsafeUnwrap();
      expect(created.length).toBe(2); // foo.md + bar.mdc

      const linkPath = path.join(rulesTargetDir, 'myplugin', 'foo.md');
      expect(fs.existsSync(linkPath)).toBe(true);
      expect(fs.readlinkSync(linkPath)).toBeDefined();

      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.rules).toEqual(created);
    });

    it('skips plugins without rules dir', () => {
      const plugin = createPlugin(repoRoot, 'norules', false);
      const marketplaces: DiscoveredMarketplace[] = [
        {
          pluginsDir: path.join(repoRoot, '.agents', 'plugins'),
          relativePath: '.agents/plugins',
          label: 'Root',
          plugins: [plugin],
        },
      ];

      const result = rulesSync.syncRules(repoRoot, marketplaces, rulesTargetDir, manifestPath);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
      expect(fs.existsSync(manifestPath)).toBe(false);
    });
  });

  describe('clearRules', () => {
    it('removes symlinks and manifest', () => {
      const plugin = createPlugin(repoRoot, 'myplugin');
      const marketplaces: DiscoveredMarketplace[] = [
        {
          pluginsDir: path.join(repoRoot, '.agents', 'plugins'),
          relativePath: '.agents/plugins',
          label: 'Root',
          plugins: [plugin],
        },
      ];

      rulesSync.syncRules(repoRoot, marketplaces, rulesTargetDir, manifestPath);
      expect(fs.existsSync(manifestPath)).toBe(true);

      const result = rulesSync.clearRules(repoRoot, rulesTargetDir, manifestPath);

      expect(result.isOk()).toBe(true);
      expect(fs.existsSync(manifestPath)).toBe(false);
      expect(fs.existsSync(path.join(rulesTargetDir, 'myplugin'))).toBe(false);
    });

    it('is idempotent when manifest missing', () => {
      const result = rulesSync.clearRules(repoRoot, rulesTargetDir, manifestPath);

      expect(result.isOk()).toBe(true);
    });
  });
});
