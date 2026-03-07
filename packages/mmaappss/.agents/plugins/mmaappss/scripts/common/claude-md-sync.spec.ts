import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claudeMdSync } from './claude-md-sync.js';

describe('claude-md-sync', () => {
  let tmpDir: string;
  let repoRoot: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mmaappss-claude-md-'));
    repoRoot = path.join(tmpDir, 'repo');
    fs.mkdirSync(repoRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  describe('findAgentsMdDirs', () => {
    it('returns root when AGENTS.md is at root', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Agents');
      expect(claudeMdSync.findAgentsMdDirs(repoRoot, null)).toEqual(['']);
    });

    it('returns root and nested dirs that contain AGENTS.md', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const pkg = path.join(repoRoot, 'packages', 'foo');
      fs.mkdirSync(pkg, { recursive: true });
      fs.writeFileSync(path.join(pkg, 'AGENTS.md'), '# Foo');
      expect(claudeMdSync.findAgentsMdDirs(repoRoot, null).sort()).toEqual(['', 'packages/foo']);
    });

    it('respects excluded', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const inNodeModules = path.join(repoRoot, 'node_modules', 'pkg');
      fs.mkdirSync(inNodeModules, { recursive: true });
      fs.writeFileSync(path.join(inNodeModules, 'AGENTS.md'), '# Pkg');
      expect(claudeMdSync.findAgentsMdDirs(repoRoot, null)).toEqual(['']);
      expect(claudeMdSync.findAgentsMdDirs(repoRoot, { excluded: ['packages'] })).toEqual(['']);
      fs.mkdirSync(path.join(repoRoot, 'packages', 'bar'), { recursive: true });
      fs.writeFileSync(path.join(repoRoot, 'packages', 'bar', 'AGENTS.md'), '# Bar');
      expect(claudeMdSync.findAgentsMdDirs(repoRoot, { excluded: ['packages'] })).toEqual(['']);
    });
  });

  describe('syncClaudeMd', () => {
    it('creates CLAUDE.md symlinks and manifest', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const result = claudeMdSync.syncClaudeMd(repoRoot, null);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('CLAUDE.md');
      }
      const claudePath = path.join(repoRoot, 'CLAUDE.md');
      expect(fs.existsSync(claudePath)).toBe(true);
      expect(fs.lstatSync(claudePath).isSymbolicLink()).toBe(true);
      expect(fs.readlinkSync(claudePath)).toBe('AGENTS.md');
      const manifestPath = path.join(repoRoot, '.claude', '.mmaappss-claude-md-sync.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.claudeMdPaths).toContain('CLAUDE.md');
    });

    it('skips directories where CLAUDE.md is a regular file', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      fs.writeFileSync(path.join(repoRoot, 'CLAUDE.md'), '# Custom');
      const result = claudeMdSync.syncClaudeMd(repoRoot, null);
      expect(result.isOk()).toBe(true);
      expect(fs.readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8')).toBe('# Custom');
      expect(fs.lstatSync(path.join(repoRoot, 'CLAUDE.md')).isSymbolicLink()).toBe(false);
    });

    it('adds CLAUDE.md to .gitignore if missing', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      fs.writeFileSync(path.join(repoRoot, '.gitignore'), 'node_modules\n');
      claudeMdSync.syncClaudeMd(repoRoot, null);
      const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
      expect(gitignore).toMatch(/CLAUDE\.md/);
    });

    it('is idempotent', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const r1 = claudeMdSync.syncClaudeMd(repoRoot, null);
      const r2 = claudeMdSync.syncClaudeMd(repoRoot, null);
      expect(r1.isOk() && r2.isOk()).toBe(true);
      expect(fs.readlinkSync(path.join(repoRoot, 'CLAUDE.md'))).toBe('AGENTS.md');
    });
  });

  describe('clearClaudeMd', () => {
    it('removes symlinks and manifest', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      claudeMdSync.syncClaudeMd(repoRoot, null);
      expect(fs.existsSync(path.join(repoRoot, 'CLAUDE.md'))).toBe(true);
      const result = claudeMdSync.clearClaudeMd(repoRoot);
      expect(result.isOk()).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, 'CLAUDE.md'))).toBe(false);
      expect(fs.existsSync(path.join(repoRoot, '.claude', '.mmaappss-claude-md-sync.json'))).toBe(
        false
      );
    });

    it('does not remove regular CLAUDE.md files', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      fs.writeFileSync(path.join(repoRoot, 'CLAUDE.md'), '# Custom');
      fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
      fs.writeFileSync(
        path.join(repoRoot, '.claude', '.mmaappss-claude-md-sync.json'),
        JSON.stringify({ claudeMdPaths: ['CLAUDE.md'] })
      );
      claudeMdSync.clearClaudeMd(repoRoot);
      expect(fs.readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8')).toBe('# Custom');
    });

    it('is idempotent when manifest is missing', () => {
      const result = claudeMdSync.clearClaudeMd(repoRoot);
      expect(result.isOk()).toBe(true);
    });
  });
});
