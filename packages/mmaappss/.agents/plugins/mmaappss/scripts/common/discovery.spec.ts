import { describe, expect, it } from 'vitest';
import { discoverMarketplaces } from './discovery.js';
import { pathHelpers } from './path-helpers.js';

describe('discoverMarketplaces', () => {
  it('finds marketplaces and mmaappss plugin', () => {
    const repoRoot = pathHelpers.repoRoot;
    const result = discoverMarketplaces(repoRoot, null);

    expect(result.length).toBeGreaterThanOrEqual(1);
    const withMmaappss = result.find((m) => m.plugins.some((p) => p.name === 'mmaappss'));
    expect(withMmaappss).toBeDefined();
  });

  it('respects excludeDirectories', () => {
    const repoRoot = pathHelpers.repoRoot;
    const result = discoverMarketplaces(repoRoot, {
      excludeDirectories: ['packages'],
    });

    const hasNested = result.some((m) => m.relativePath.includes('packages/'));
    expect(hasNested).toBe(false);
  });
});
