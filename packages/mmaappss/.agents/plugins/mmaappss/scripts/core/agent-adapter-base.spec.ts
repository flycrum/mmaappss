/**
 * Unit tests for AgentAdapterBase: buildMarketplacePluginEntries, buildMarketplaceJson, config flow.
 */

import { ok, Result } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { pathHelpers } from '../common/path-helpers.js';
import type { DiscoveredMarketplace, DiscoveredPlugin } from '../common/types.js';
import {
  AdapterAgentConfig,
  AgentAdapterBase,
  type MarketplaceJson,
  type MarketplacePluginEntry,
} from './agent-adapter-base.js';

/** Test subclass that exposes protected methods for unit testing. */
class TestAdapter extends AgentAdapterBase {
  constructor(config: AdapterAgentConfig) {
    super(config);
  }

  public exposeBuildPluginEntries(m: DiscoveredMarketplace[]): MarketplacePluginEntry[] {
    return this.buildMarketplacePluginEntries(m);
  }

  public exposeBuildMarketplaceJson(m: DiscoveredMarketplace[]): MarketplaceJson {
    return this.buildMarketplaceJson(m);
  }
}

function mockPlugin(overrides: Partial<DiscoveredPlugin>): DiscoveredPlugin {
  const base = {
    description: 'Test',
    hasClaudeManifest: true,
    hasCodexManifest: false,
    hasCursorManifest: true,
    name: 'test-plugin',
    path: '/repo/.agents/plugins/test-plugin',
    relativePath: '.agents/plugins/test-plugin',
    version: '1.0.0',
  };
  const merged = { ...base, ...overrides };
  return { ...merged, manifestName: overrides.manifestName ?? merged.name };
}

function mockMarketplace(
  plugins: DiscoveredPlugin[],
  relativePath = '.agents/plugins'
): DiscoveredMarketplace {
  return {
    label: relativePath === '.agents/plugins' ? 'Root marketplace' : `${relativePath} marketplace`,
    plugins,
    pluginsDir: '/repo/' + relativePath,
    relativePath,
  };
}

describe('AgentAdapterBase', () => {
  describe('buildMarketplacePluginEntries', () => {
    it('filters by manifestFilter claude', () => {
      const adapter = new TestAdapter({
        agent: 'claude',
        manifestFilter: 'claude',
        sourceFormat: 'prefixed',
      });
      const p1 = mockPlugin({ name: 'a', hasClaudeManifest: true, hasCursorManifest: false });
      const p2 = mockPlugin({ name: 'b', hasClaudeManifest: false, hasCursorManifest: true });
      const m = mockMarketplace([p1, p2]);
      const entries = adapter.exposeBuildPluginEntries([m]);
      expect(entries).toHaveLength(1);
      expect(entries[0]!.name).toBe('a');
    });

    it('filters by manifestFilter cursor', () => {
      const adapter = new TestAdapter({
        agent: 'cursor',
        manifestFilter: 'cursor',
        sourceFormat: 'relative',
      });
      const p1 = mockPlugin({ name: 'a', hasClaudeManifest: false, hasCursorManifest: true });
      const p2 = mockPlugin({ name: 'b', hasClaudeManifest: true, hasCursorManifest: false });
      const m = mockMarketplace([p1, p2]);
      const entries = adapter.exposeBuildPluginEntries([m]);
      expect(entries).toHaveLength(1);
      expect(entries[0]!.name).toBe('a');
    });

    it('uses sourceFormat prefixed for Claude', () => {
      const adapter = new TestAdapter({
        agent: 'claude',
        manifestFilter: 'claude',
        sourceFormat: 'prefixed',
      });
      const p = mockPlugin({ relativePath: '.agents/plugins/foo' });
      const m = mockMarketplace([p]);
      const entries = adapter.exposeBuildPluginEntries([m]);
      expect(entries[0]!.source).toBe('./.agents/plugins/foo');
    });

    it('uses sourceFormat relative for Cursor', () => {
      const adapter = new TestAdapter({
        agent: 'cursor',
        manifestFilter: 'cursor',
        sourceFormat: 'relative',
      });
      const p = mockPlugin({ relativePath: 'packages/pkg/.agents/plugins/foo' });
      const m = mockMarketplace([p], 'packages/pkg/.agents/plugins');
      const entries = adapter.exposeBuildPluginEntries([m]);
      expect(entries[0]!.source).toBe('packages/pkg/.agents/plugins/foo');
    });

    it('deduplicates by marketplace:plugin key', () => {
      const adapter = new TestAdapter({
        agent: 'claude',
        manifestFilter: 'claude',
        sourceFormat: 'prefixed',
      });
      const p = mockPlugin({ name: 'same' });
      const m1 = mockMarketplace([p], '.agents/plugins');
      const m2 = mockMarketplace([{ ...p }], 'packages/foo/.agents/plugins');
      const entries = adapter.exposeBuildPluginEntries([m1, m2]);
      expect(entries).toHaveLength(2);
    });

    it('returns empty when manifestFilter not set', () => {
      const adapter = new TestAdapter({ agent: 'codex' });
      const m = mockMarketplace([mockPlugin({})]);
      const entries = adapter.exposeBuildPluginEntries([m]);
      expect(entries).toHaveLength(0);
    });
  });

  describe('buildMarketplaceJson', () => {
    it('produces canonical shape with owner and plugins', () => {
      const adapter = new TestAdapter({
        agent: 'claude',
        manifestFilter: 'claude',
        sourceFormat: 'prefixed',
        marketplaceName: 'my-plugins',
      });
      const p = mockPlugin({ name: 'foo', manifestName: 'foo' });
      const m = mockMarketplace([p]);
      const json = adapter.exposeBuildMarketplaceJson([m]);
      expect(json.name).toBe('my-plugins');
      expect(json.owner).toEqual({ name: 'mmaappss' });
      expect(json.plugins).toHaveLength(1);
      expect(json.plugins[0]!.name).toBe('foo');
    });

    it('defaults marketplaceName to mmaappss-plugins', () => {
      const adapter = new TestAdapter({
        agent: 'cursor',
        manifestFilter: 'cursor',
        sourceFormat: 'relative',
      });
      const json = adapter.exposeBuildMarketplaceJson([]);
      expect(json.name).toBe('mmaappss-plugins');
    });
  });

  describe('Codex buildMarkdownSectionContent', () => {
    it('produces markdown list per marketplace', () => {
      class TestCodex extends AgentAdapterBase {
        constructor() {
          super({
            agent: 'codex',
            usesMarkdownSection: true,
            agentsFile: 'AGENTS.override.md',
            sectionHeading: 'Codex Marketplace',
          });
        }

        public exposeBuildMarkdownSectionContent(m: DiscoveredMarketplace[]): string {
          return this.buildMarkdownSectionContent(m);
        }

        protected override buildMarkdownSectionContent(
          marketplaces: DiscoveredMarketplace[]
        ): string {
          const lines: string[] = [];
          for (const m of marketplaces) {
            if (m.plugins.length === 0) continue;
            lines.push(`### ${m.label}`, '');
            for (const p of m.plugins) {
              lines.push(`- [${p.manifestName ?? p.name}](./${p.relativePath})`);
            }
            lines.push('');
          }
          return lines.join('\n').trim();
        }
      }
      const adapter = new TestCodex();
      const p1 = mockPlugin({
        name: 'foo',
        manifestName: 'foo',
        relativePath: '.agents/plugins/foo',
      });
      const p2 = mockPlugin({
        name: 'bar',
        manifestName: 'bar',
        relativePath: 'pkg/.agents/plugins/bar',
      });
      const m1 = mockMarketplace([p1], '.agents/plugins');
      const m2 = mockMarketplace([p2], 'pkg/.agents/plugins');
      const content = adapter.exposeBuildMarkdownSectionContent([m1, m2]);
      expect(content).toContain('### Root marketplace');
      expect(content).toContain('- [foo](./.agents/plugins/foo)');
      expect(content).toContain('### pkg/.agents/plugins marketplace');
      expect(content).toContain('- [bar](./pkg/.agents/plugins/bar)');
    });
  });

  describe('hooks', () => {
    it('calls beforeTeardown and afterTeardown when overridden', () => {
      const calls: string[] = [];
      class HookedAdapter extends AgentAdapterBase {
        constructor() {
          super({
            agent: 'codex',
            usesMarkdownSection: true,
            agentsFile: 'AGENTS.override.md',
            sectionHeading: 'Codex Marketplace',
          });
        }

        protected override beforeTeardown(repoRoot: string): Result<void, Error> {
          calls.push(`beforeTeardown:${repoRoot}`);
          return ok(undefined);
        }

        protected override afterTeardown(repoRoot: string): Result<void, Error> {
          calls.push(`afterTeardown:${repoRoot}`);
          return ok(undefined);
        }
      }
      const adapter = new HookedAdapter();
      const repoRoot = pathHelpers.repoRoot;
      const result = adapter.run(repoRoot, {
        marketplacesEnabled: { claude: false, cursor: false, codex: false },
      });
      expect(result.isOk()).toBe(true);
      expect(calls).toContain(`beforeTeardown:${repoRoot}`);
      expect(calls).toContain(`afterTeardown:${repoRoot}`);
    });
  });
});
