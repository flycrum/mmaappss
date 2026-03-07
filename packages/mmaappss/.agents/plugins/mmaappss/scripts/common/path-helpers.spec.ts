import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pathHelpers } from './path-helpers.js';

describe('pathHelpers', () => {
  it('scriptDir is absolute and contains common', () => {
    expect(path.isAbsolute(pathHelpers.scriptDir)).toBe(true);
    expect(pathHelpers.scriptDir).toContain('common');
  });

  it('packageRoot is absolute and contains mmaappss', () => {
    expect(path.isAbsolute(pathHelpers.packageRoot)).toBe(true);
    expect(pathHelpers.packageRoot).toContain('mmaappss');
  });

  // Assumes pathHelpers.packageRoot is exactly two dirs below pathHelpers.repoRoot (e.g. repo/packages/mmaappss); update if monorepo depth changes.
  it('repoRoot is absolute and is parent of packageRoot', () => {
    expect(path.isAbsolute(pathHelpers.repoRoot)).toBe(true);
    expect(pathHelpers.repoRoot).toBe(path.resolve(pathHelpers.packageRoot, '../..'));
  });
});
