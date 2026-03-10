import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileAssertions } from './file-assertions.js';

describe('fileAssertions.collectManifestRelativePaths', () => {
  it('returns empty array for empty manifest', () => {
    expect(fileAssertions.collectManifestRelativePaths({})).toEqual([]);
  });

  it('collects symlinks from all agents and behaviors', () => {
    const manifest = {
      claude: {
        agentsMdSymlink: { symlinks: ['CLAUDE.md'] },
        rulesSymlink: { symlinks: ['.claude/rules/foo/bar.md'] },
      },
      cursor: {
        localPluginsContentSync: {
          symlinks: ['.cursor/commands/a.md'],
          fsAutoRemoval: ['.cursor/rules/b.md'],
        },
      },
    };
    const result = fileAssertions.collectManifestRelativePaths(manifest);
    expect(result).toContain('CLAUDE.md');
    expect(result).toContain('.claude/rules/foo/bar.md');
    expect(result).toContain('.cursor/commands/a.md');
    expect(result).toContain('.cursor/rules/b.md');
    expect(result.length).toBe(4);
  });

  it('deduplicates paths', () => {
    const manifest = {
      a: { x: { symlinks: ['p.md'] } },
      b: { y: { symlinks: ['p.md'] } },
    };
    const result = fileAssertions.collectManifestRelativePaths(manifest);
    expect(result).toEqual(['p.md']);
  });

  it('skips entries that are true or non-object', () => {
    const manifest = {
      claude: {
        a: true,
        b: { symlinks: ['only.md'] },
      },
    };
    const result = fileAssertions.collectManifestRelativePaths(manifest);
    expect(result).toEqual(['only.md']);
  });

  it('collects fsAutoRemoval and fsManualRemoval', () => {
    const manifest = {
      claude: {
        settingsSync: {
          fsManualRemoval: ['.claude/settings.json'],
        },
        localMarketplaceSync: {
          fsAutoRemoval: ['.claude-plugin/marketplace.json'],
        },
      },
    };
    const result = fileAssertions.collectManifestRelativePaths(manifest);
    expect(result).toContain('.claude/settings.json');
    expect(result).toContain('.claude-plugin/marketplace.json');
    expect(result.length).toBe(2);
  });
});

describe('fileAssertions.assertSandboxPaths', () => {
  let tmpDir: string;
  let sandboxRoot: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mmaappss-file-assert-'));
    sandboxRoot = path.join(tmpDir, 'sandbox');
    fs.mkdirSync(sandboxRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('reports match for manifest paths that exist and missing for those that do not', () => {
    fs.mkdirSync(path.join(sandboxRoot, 'a'), { recursive: true });
    fs.writeFileSync(path.join(sandboxRoot, 'a', 'f.md'), '');
    fs.writeFileSync(path.join(sandboxRoot, 'b.md'), '');

    const manifestPaths = ['a/f.md', 'b.md', 'missing.md'];
    const result = fileAssertions.assertSandboxPaths(sandboxRoot, manifestPaths);

    expect(result.match).toContain('a/f.md');
    expect(result.match).toContain('b.md');
    expect(result.missing).toContain('missing.md');
    expect(result.match.length).toBe(2);
    expect(result.missing.length).toBe(1);
  });

  it('reports extra for paths in sandbox not in manifest, excluding .mmaappss/', () => {
    fs.mkdirSync(path.join(sandboxRoot, '.mmaappss'), { recursive: true });
    fs.writeFileSync(path.join(sandboxRoot, '.mmaappss', 'sync-manifest.json'), '{}');
    fs.writeFileSync(path.join(sandboxRoot, 'only-in-sandbox.md'), '');

    const result = fileAssertions.assertSandboxPaths(sandboxRoot, []);

    expect(result.extra).not.toContain('.mmaappss');
    expect(result.extra).not.toContain('.mmaappss/sync-manifest.json');
    expect(result.extra).toContain('only-in-sandbox.md');
  });

  it('excludes template paths from extra when templateRoot is provided', () => {
    const templateRoot = path.join(tmpDir, 'template');
    fs.mkdirSync(path.join(templateRoot, 'from-template'), { recursive: true });
    fs.writeFileSync(path.join(templateRoot, 'from-template', 'file.md'), '');
    fs.cpSync(templateRoot, sandboxRoot, { recursive: true });
    fs.writeFileSync(path.join(sandboxRoot, 'extra-only.md'), '');

    const result = fileAssertions.assertSandboxPaths(sandboxRoot, [], {
      templateRoot,
    });

    expect(result.extra).not.toContain('from-template');
    expect(result.extra).not.toContain('from-template/file.md');
    expect(result.extra).toContain('extra-only.md');
  });

  it('excludes paths matching excludeExtraPrefixes from extra', () => {
    fs.writeFileSync(path.join(sandboxRoot, '.gitignore'), '');
    fs.mkdirSync(path.join(sandboxRoot, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(sandboxRoot, '.claude', 'settings.json'), '{}');

    const result = fileAssertions.assertSandboxPaths(sandboxRoot, [], {
      excludeExtraPrefixes: ['.gitignore', '.claude/settings.json'],
    });

    expect(result.extra).not.toContain('.gitignore');
    expect(result.extra).not.toContain('.claude');
    expect(result.extra).not.toContain('.claude/settings.json');
  });

  it('does not report parent dirs of manifest paths as extra', () => {
    fs.mkdirSync(path.join(sandboxRoot, 'dir', 'sub'), { recursive: true });
    fs.writeFileSync(path.join(sandboxRoot, 'dir', 'sub', 'f.md'), '');

    const result = fileAssertions.assertSandboxPaths(sandboxRoot, ['dir/sub/f.md']);

    expect(result.match).toContain('dir/sub/f.md');
    expect(result.extra).not.toContain('dir');
    expect(result.extra).not.toContain('dir/sub');
  });
});
