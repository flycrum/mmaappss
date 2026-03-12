import { describe, expect, it } from 'vitest';
import { discoverMarketplaces } from './discovery.js';
import { pathHelpers } from './path-helpers.js';

describe('discoverMarketplaces', () => {
  it('finds marketplaces and mmaappss-sync plugin', () => {
    const repoRoot = pathHelpers.repoRoot;
    const result = discoverMarketplaces(repoRoot, null);

    expect(result.length).toBeGreaterThanOrEqual(1);
    const withMmaappssSync = result.find((m) => m.plugins.some((p) => p.name === 'mmaappss-sync'));
    expect(withMmaappssSync).toBeDefined();
  });

  it('respects excluded (walk: segment names)', () => {
    const repoRoot = pathHelpers.repoRoot;
    const baseline = discoverMarketplaces(repoRoot, null);
    expect(baseline.length).toBeGreaterThan(0);

    const result = discoverMarketplaces(repoRoot, {
      excluded: ['packages'],
    });
    const hasNested = result.some((m) => m.relativePath.includes('packages/'));
    expect(hasNested).toBe(false);
  });

  const skipExcludePluginTest = (() => {
    const baseline = discoverMarketplaces(pathHelpers.repoRoot, null);
    const rootMarket = baseline.find((m) => m.relativePath === '.agents/plugins');
    return !rootMarket?.plugins.some((p) => p.name === 'git');
  })();
  it.skipIf(skipExcludePluginTest)(
    'excludes plugin by path (.agents/plugins/git) and by segment (git)',
    () => {
      const repoRoot = pathHelpers.repoRoot;
      const baseline = discoverMarketplaces(repoRoot, null);
      const rootMarket = baseline.find((m) => m.relativePath === '.agents/plugins');
      const hasGit = rootMarket?.plugins.some((p) => p.name === 'git');
      expect(rootMarket).toBeDefined();
      expect(hasGit).toBe(true);

      const byPath = discoverMarketplaces(repoRoot, {
        excluded: ['.agents/plugins/git'],
      });
      const rootByPath = byPath.find((m) => m.relativePath === '.agents/plugins');
      expect(rootByPath).toBeDefined();
      expect((rootByPath?.plugins ?? []).some((p) => p.name === 'git')).toBe(false);

      const bySegment = discoverMarketplaces(repoRoot, {
        excluded: ['git'],
      });
      const rootBySegment = bySegment.find((m) => m.relativePath === '.agents/plugins');
      expect(rootBySegment).toBeDefined();
      expect((rootBySegment?.plugins ?? []).some((p) => p.name === 'git')).toBe(false);
    }
  );
});
