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
    manifests: {},
    name,
    path: pluginDir,
    relativePath: `.agents/plugins/${name}`,
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
      const expectedSourcePath = path.join(plugin.path, 'rules', 'foo.md');
      expect(fs.existsSync(linkPath)).toBe(true);
      expect(fs.readlinkSync(linkPath)).toBe(
        path.relative(path.dirname(linkPath), expectedSourcePath)
      );

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

    it('single marketplace with multiple plugins: creates symlinks for both and manifest lists all', () => {
      const plugin1 = createPlugin(repoRoot, 'plugin-a');
      const plugin2 = createPlugin(repoRoot, 'plugin-b');
      const marketplaces: DiscoveredMarketplace[] = [
        {
          pluginsDir: path.join(repoRoot, '.agents', 'plugins'),
          relativePath: '.agents/plugins',
          label: 'Root',
          plugins: [plugin1, plugin2],
        },
      ];

      const result = rulesSync.syncRules(repoRoot, marketplaces, rulesTargetDir, manifestPath);

      expect(result.isOk()).toBe(true);
      const created = result._unsafeUnwrap();
      expect(created.length).toBe(4); // 2 files × 2 plugins

      const linkA = path.join(rulesTargetDir, 'plugin-a', 'foo.md');
      const linkB = path.join(rulesTargetDir, 'plugin-b', 'foo.md');
      expect(fs.existsSync(linkA)).toBe(true);
      expect(fs.existsSync(linkB)).toBe(true);
      expect(fs.readlinkSync(linkA)).toBe(
        path.relative(path.dirname(linkA), path.join(plugin1.path, 'rules', 'foo.md'))
      );
      expect(fs.readlinkSync(linkB)).toBe(
        path.relative(path.dirname(linkB), path.join(plugin2.path, 'rules', 'foo.md'))
      );

      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.rules).toEqual(created);
    });

    it('multiple marketplaces: creates symlinks from all and manifest includes all', () => {
      const pluginsDirRoot = path.join(repoRoot, '.agents', 'plugins');
      const plugin1 = createPlugin(repoRoot, 'p1');
      const plugin2 = createPlugin(repoRoot, 'p2');
      const nestedPluginsDir = path.join(repoRoot, 'packages', 'pkg', '.agents', 'plugins');
      fs.mkdirSync(nestedPluginsDir, { recursive: true });
      const rulesDirNested = path.join(nestedPluginsDir, 'nested', 'rules');
      fs.mkdirSync(rulesDirNested, { recursive: true });
      fs.writeFileSync(path.join(rulesDirNested, 'baz.md'), '# Baz');
      const pluginNested: DiscoveredPlugin = {
        manifests: {},
        name: 'nested',
        path: path.join(nestedPluginsDir, 'nested'),
        relativePath: 'packages/pkg/.agents/plugins/nested',
      };
      const marketplaces: DiscoveredMarketplace[] = [
        {
          pluginsDir: pluginsDirRoot,
          relativePath: '.agents/plugins',
          label: 'Root',
          plugins: [plugin1, plugin2],
        },
        {
          pluginsDir: nestedPluginsDir,
          relativePath: 'packages/pkg/.agents/plugins',
          label: 'Nested',
          plugins: [pluginNested],
        },
      ];

      const result = rulesSync.syncRules(repoRoot, marketplaces, rulesTargetDir, manifestPath);

      expect(result.isOk()).toBe(true);
      const created = result._unsafeUnwrap();
      expect(created.length).toBe(5); // 2×2 from p1,p2 + 1 from nested

      expect(fs.existsSync(path.join(rulesTargetDir, 'p1', 'foo.md'))).toBe(true);
      expect(fs.existsSync(path.join(rulesTargetDir, 'p2', 'foo.md'))).toBe(true);
      expect(fs.existsSync(path.join(rulesTargetDir, 'nested', 'baz.md'))).toBe(true);

      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.rules).toEqual(created);
    });

    it('handles pre-existing rulesTargetDir and manifest: overwrites symlinks and manifest', () => {
      fs.mkdirSync(path.join(rulesTargetDir, 'myplugin'), { recursive: true });
      fs.writeFileSync(manifestPath, JSON.stringify({ rules: ['.claude/rules/old/link.md'] }));

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
      expect(created.length).toBe(2);

      const linkPath = path.join(rulesTargetDir, 'myplugin', 'foo.md');
      const expectedSourcePath = path.join(plugin.path, 'rules', 'foo.md');
      expect(fs.existsSync(linkPath)).toBe(true);
      expect(fs.readlinkSync(linkPath)).toBe(
        path.relative(path.dirname(linkPath), expectedSourcePath)
      );

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.rules).toEqual(created);
    });
  });

  describe('clearRulesFromContents', () => {
    it('removes symlinks and prunes empty dirs', () => {
      const plugin = createPlugin(repoRoot, 'myplugin');
      const marketplaces: DiscoveredMarketplace[] = [
        {
          pluginsDir: path.join(repoRoot, '.agents', 'plugins'),
          relativePath: '.agents/plugins',
          label: 'Root',
          plugins: [plugin],
        },
      ];

      const syncResult = rulesSync.syncRules(
        repoRoot,
        marketplaces,
        rulesTargetDir,
        manifestPath,
        true
      );
      expect(syncResult.isOk()).toBe(true);
      expect(fs.existsSync(path.join(rulesTargetDir, 'myplugin'))).toBe(true);

      const result = rulesSync.clearRulesFromContents(repoRoot, rulesTargetDir, {
        rules: syncResult.isOk() ? syncResult.value : [],
      });

      expect(result.isOk()).toBe(true);
      expect(fs.existsSync(path.join(rulesTargetDir, 'myplugin'))).toBe(false);
    });

    it('is idempotent when contents.rules is empty', () => {
      const result = rulesSync.clearRulesFromContents(repoRoot, rulesTargetDir, {});

      expect(result.isOk()).toBe(true);
    });
  });
});
