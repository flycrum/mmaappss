import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pathHelpers } from './path-helpers.js';

describe('pathHelpers', () => {
  it('scriptDir is absolute and contains common', () => {
    expect(path.isAbsolute(pathHelpers.scriptDir)).toBe(true);
    expect(pathHelpers.scriptDir).toContain('common');
  });

  it('packageRoot is absolute and contains sync', () => {
    expect(path.isAbsolute(pathHelpers.packageRoot)).toBe(true);
    expect(pathHelpers.packageRoot).toContain('sync');
  });

  // Assumes pathHelpers.packageRoot is exactly two dirs below pathHelpers.repoRoot (e.g. repo/packages/sync); update if monorepo depth changes.
  it('repoRoot is absolute and is parent of packageRoot', () => {
    expect(path.isAbsolute(pathHelpers.repoRoot)).toBe(true);
    expect(pathHelpers.repoRoot).toBe(path.resolve(pathHelpers.packageRoot, '../..'));
  });
});

describe('pathHelpers.resolveRepoRootFromPackageRoot', () => {
  it('when path contains node_modules, returns directory that contains that node_modules', () => {
    const consumerRoot = path.resolve('/home/user/my-project');
    const packageRoot = path.join(consumerRoot, 'node_modules', '@mmaappss', 'sync');
    expect(pathHelpers.resolveRepoRootFromPackageRoot(packageRoot)).toBe(consumerRoot);
  });

  it('when path does not contain node_modules, returns packageRoot/../..', () => {
    const repoRoot = path.resolve('/repo');
    const packageRoot = path.join(repoRoot, 'packages', 'sync');
    expect(pathHelpers.resolveRepoRootFromPackageRoot(packageRoot)).toBe(repoRoot);
  });
});
