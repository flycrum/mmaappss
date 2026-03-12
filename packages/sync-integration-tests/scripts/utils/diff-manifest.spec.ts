import { describe, expect, it } from 'vitest';
import { diffManifest } from './diff-manifest.js';

describe('diffManifest.run', () => {
  it('returns empty diff when expected and actual match (shallow)', () => {
    const manifest = { claude: { a: true }, cursor: { b: true } };
    const result = diffManifest.run(manifest, { ...manifest });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('returns empty diff when objects have same keys/values in different key order', () => {
    const expected = { a: 1, b: 2, c: 3 };
    const actual = { c: 3, a: 1, b: 2 };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('returns empty diff for deeply nested objects with different key order', () => {
    const expected = {
      claude: {
        agentsMdSymlink: {
          options: { sourceFile: 'AGENTS.md', targetFile: 'CLAUDE.md' },
          symlinks: ['CLAUDE.md'],
        },
      },
    };
    const actual = {
      claude: {
        agentsMdSymlink: {
          symlinks: ['CLAUDE.md'],
          options: { targetFile: 'CLAUDE.md', sourceFile: 'AGENTS.md' },
        },
      },
    };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('reports added at root when actual has extra top-level key', () => {
    const expected = { claude: {} };
    const actual = { claude: {}, cursor: { x: true } };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toContain('cursor');
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('reports removed at root when actual is missing top-level key', () => {
    const expected = { claude: {}, cursor: {} };
    const actual = { claude: {} };
    const result = diffManifest.run(expected, actual);
    expect(result.removed).toContain('cursor');
    expect(result.added).toEqual([]);
  });

  it('reports added at nested depth (one level at a time)', () => {
    const expected = { claude: { options: { a: 1 } } };
    const actual = { claude: { options: { a: 1, b: 2 } } };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toContain('claude.options.b');
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('reports removed at nested depth', () => {
    const expected = { claude: { options: { a: 1, b: 2 } } };
    const actual = { claude: { options: { a: 1 } } };
    const result = diffManifest.run(expected, actual);
    expect(result.removed).toContain('claude.options.b');
    expect(result.added).toEqual([]);
  });

  it('reports modified for primitive value change', () => {
    const expected = { claude: { options: { sourceFile: 'AGENTS.md' } } };
    const actual = { claude: { options: { sourceFile: 'OTHER.md' } } };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toContain('claude.options.sourceFile');
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('reports modified for boolean vs object at same path', () => {
    const expected = { claude: { agentsMdSymlink: true } };
    const actual = {
      claude: { agentsMdSymlink: { options: {}, symlinks: [] } },
    };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toContain('claude.agentsMdSymlink');
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('reports modified for array length mismatch', () => {
    const expected = { claude: { symlinks: ['a.md', 'b.md'] } };
    const actual = { claude: { symlinks: ['a.md'] } };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toContain('claude.symlinks');
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('reports modified for array element primitive mismatch', () => {
    const expected = { claude: { symlinks: ['a.md', 'b.md'] } };
    const actual = { claude: { symlinks: ['a.md', 'c.md'] } };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toContain('claude.symlinks[1]');
  });

  it('returns empty diff for array of strings in same order', () => {
    const expected = { symlinks: ['.cursor/commands/a.md', '.cursor/commands/b.md'] };
    const actual = { symlinks: ['.cursor/commands/a.md', '.cursor/commands/b.md'] };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('treats array of primitives as order-insensitive (same set = equal)', () => {
    const expected = { symlinks: ['a.md', 'b.md'] };
    const actual = { symlinks: ['b.md', 'a.md'] };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toEqual([]);
  });

  it('returns empty diff for array of objects with same content, different key order', () => {
    const expected = {
      plugins: [
        { name: 'a', source: './a', version: '0.1.0' },
        { name: 'b', source: './b', version: '0.1.0' },
      ],
    };
    const actual = {
      plugins: [
        { source: './a', version: '0.1.0', name: 'a' },
        { source: './b', version: '0.1.0', name: 'b' },
      ],
    };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('reports modified at array index when object element differs', () => {
    const expected = {
      plugins: [
        { name: 'a', version: '0.1.0' },
        { name: 'b', version: '0.1.0' },
      ],
    };
    const actual = {
      plugins: [
        { name: 'a', version: '0.1.0' },
        { name: 'b', version: '0.2.0' },
      ],
    };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toContain('plugins[1].version');
  });

  it('reports added/removed inside nested object (manifest-like)', () => {
    const expected = {
      claude: {
        localMarketplaceSync: {
          options: { manifestKey: 'claude' },
          customData: { plugins: [] },
        },
      },
    };
    const actual = {
      claude: {
        localMarketplaceSync: {
          options: { manifestKey: 'claude', marketplaceFile: '.claude-plugin/marketplace.json' },
          customData: { plugins: [] },
        },
      },
    };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toContain('claude.localMarketplaceSync.options.marketplaceFile');
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('does not recurse under added key (reports single path)', () => {
    const expected = {};
    const actual = {
      cursor: {
        localPluginsContentSync: {
          options: { targetRoot: '.cursor' },
          symlinks: ['.cursor/commands/a.md'],
        },
      },
    };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toEqual(['cursor']);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('does not recurse under removed key (reports single path)', () => {
    const expected = {
      cursor: {
        localPluginsContentSync: { options: {}, symlinks: [] },
      },
    };
    const actual = {};
    const result = diffManifest.run(expected, actual);
    expect(result.removed).toEqual(['cursor']);
    expect(result.added).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('handles empty expected and actual', () => {
    const result = diffManifest.run({}, {});
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('handles empty expected with non-empty actual', () => {
    const actual = { claude: { rulesSymlink: true } };
    const result = diffManifest.run({}, actual);
    expect(result.added).toContain('claude');
    expect(result.removed).toEqual([]);
  });

  it('handles non-empty expected with empty actual', () => {
    const expected = { claude: { rulesSymlink: true } };
    const result = diffManifest.run(expected, {});
    expect(result.added).toEqual([]);
    expect(result.removed).toContain('claude');
  });

  it('reports multiple added/removed/modified at same depth', () => {
    const expected = {
      claude: { a: 1, b: 2, c: 3 },
      codex: { x: true },
    };
    const actual = {
      claude: { a: 1, b: 99, d: 4 },
      cursor: { y: true },
    };
    const result = diffManifest.run(expected, actual);
    expect(result.added).toContain('cursor');
    expect(result.added).toContain('claude.d');
    expect(result.removed).toContain('codex');
    expect(result.removed).toContain('claude.c');
    expect(result.modified).toContain('claude.b');
  });

  it('deep path: options.legacyHeadingsToRemove array', () => {
    const expected = {
      codex: {
        markdownSectionSync: {
          options: {
            agentsFile: 'AGENTS.override.md',
            legacyHeadingsToRemove: ['Codex Marketplace'],
            sectionHeading: 'packages (generated by mmaappss)',
          },
        },
      },
    };
    const actual = {
      codex: {
        markdownSectionSync: {
          options: {
            agentsFile: 'AGENTS.override.md',
            legacyHeadingsToRemove: ['Other Heading'],
            sectionHeading: 'packages (generated by mmaappss)',
          },
        },
      },
    };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toContain(
      'codex.markdownSectionSync.options.legacyHeadingsToRemove[0]'
    );
  });

  it('structureOnly: reports added/removed only, never modified', () => {
    const expected = { claude: { agentsMdSymlink: true, rulesSymlink: true } };
    const actual = {
      claude: {
        agentsMdSymlink: { options: {}, symlinks: ['CLAUDE.md'] },
        rulesSymlink: { options: {}, symlinks: [] },
        settingsSync: { options: {} },
      },
    };
    const result = diffManifest.run(expected, actual, { structureOnly: true });
    expect(result.added).toContain('claude.settingsSync');
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('structureOnly: returns empty diff when keys match at all depths (values may differ)', () => {
    const expected = {
      claude: { agentsMdSymlink: true, rulesSymlink: true },
      cursor: { localPluginsContentSync: true },
    };
    const actual = {
      claude: {
        agentsMdSymlink: { options: {}, symlinks: ['a.md'] },
        rulesSymlink: { options: {}, symlinks: ['b.md'] },
      },
      cursor: { localPluginsContentSync: { options: {}, symlinks: [] } },
    };
    const result = diffManifest.run(expected, actual, { structureOnly: true });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it('deep path: plugins array object with multiple keys', () => {
    const expected = {
      claude: {
        localMarketplaceSync: {
          customData: {
            plugins: [
              { name: 'pino-logger', source: './pino', description: 'Logging', version: '0.1.0' },
            ],
          },
        },
      },
    };
    const actual = {
      claude: {
        localMarketplaceSync: {
          customData: {
            plugins: [
              { name: 'pino-logger', source: './pino', description: 'Logging', version: '0.2.0' },
            ],
          },
        },
      },
    };
    const result = diffManifest.run(expected, actual);
    expect(result.modified).toContain('claude.localMarketplaceSync.customData.plugins[0].version');
  });
});
