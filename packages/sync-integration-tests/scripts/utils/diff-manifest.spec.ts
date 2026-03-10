import { describe, expect, it } from 'vitest';
import { diffManifest } from './diff-manifest.js';

describe('diffManifest.diff', () => {
  it('returns empty diff when expected and actual match', () => {
    const manifest = {
      claude: { agentsMdSymlink: true, rulesSymlink: true },
      cursor: { localPluginsContentSync: true },
    };
    const result = diffManifest.diff(manifest, { ...manifest });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('reports added when actual has extra agent', () => {
    const expected = { claude: { rulesSymlink: true } };
    const actual = {
      claude: { rulesSymlink: true },
      cursor: { localPluginsContentSync: true },
    };
    const result = diffManifest.diff(expected, actual);
    expect(result.added).toContain('cursor');
    expect(result.removed).toEqual([]);
  });

  it('reports removed when actual is missing agent', () => {
    const expected = {
      claude: { rulesSymlink: true },
      cursor: { localPluginsContentSync: true },
    };
    const actual = { claude: { rulesSymlink: true } };
    const result = diffManifest.diff(expected, actual);
    expect(result.removed).toContain('cursor');
    expect(result.added).toEqual([]);
  });

  it('reports added when actual has extra behavior on same agent', () => {
    const expected = { claude: { agentsMdSymlink: true } };
    const actual = {
      claude: { agentsMdSymlink: true, rulesSymlink: true },
    };
    const result = diffManifest.diff(expected, actual);
    expect(result.added).toContain('claude.rulesSymlink');
    expect(result.removed).toEqual([]);
  });

  it('reports removed when actual is missing behavior on same agent', () => {
    const expected = {
      claude: { agentsMdSymlink: true, rulesSymlink: true },
    };
    const actual = { claude: { agentsMdSymlink: true } };
    const result = diffManifest.diff(expected, actual);
    expect(result.removed).toContain('claude.rulesSymlink');
    expect(result.added).toEqual([]);
  });

  it('reports both added and removed for mixed diff', () => {
    const expected = {
      claude: { a: true, b: true },
      cursor: { x: true },
    };
    const actual = {
      claude: { a: true, c: true },
      codex: { y: true },
    };
    const result = diffManifest.diff(expected, actual);
    expect(result.added).toContain('codex');
    expect(result.added).toContain('claude.c');
    expect(result.removed).toContain('cursor');
    expect(result.removed).toContain('claude.b');
  });

  it('handles empty expected and actual', () => {
    const result = diffManifest.diff({}, {});
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('handles empty expected with non-empty actual', () => {
    const actual = { claude: { rulesSymlink: true } };
    const result = diffManifest.diff({}, actual);
    expect(result.added).toContain('claude');
    expect(result.removed).toEqual([]);
  });

  it('handles non-empty expected with empty actual', () => {
    const expected = { claude: { rulesSymlink: true } };
    const result = diffManifest.diff(expected, {});
    expect(result.added).toEqual([]);
    expect(result.removed).toContain('claude');
  });
});
