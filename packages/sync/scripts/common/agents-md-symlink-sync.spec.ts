import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { agentsMdSymlinkSync, type AgentsMdSymlinkOptions } from './agents-md-symlink-sync.js';

const CLAUDE_STYLE_OPTIONS: AgentsMdSymlinkOptions = {
  sourceFile: 'AGENTS.md',
  targetFile: 'CLAUDE.md',
  manifestPath: '.claude/.mmaappss-claude-md-sync.json',
  gitignoreComment: '\n# mmaappss: symlinked from AGENTS.md for Claude\n',
  gitignoreEntry: 'CLAUDE.md',
};

describe('agents-md-symlink-sync', () => {
  let tmpDir: string;
  let repoRoot: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mmaappss-agents-md-'));
    repoRoot = path.join(tmpDir, 'repo');
    fs.mkdirSync(repoRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  describe('findAgentsMdDirs', () => {
    it('returns root when AGENTS.md is at root', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Agents');
      expect(agentsMdSymlinkSync.findAgentsMdDirs(repoRoot, null, CLAUDE_STYLE_OPTIONS)).toEqual([
        '',
      ]);
    });

    it('returns root and nested dirs that contain AGENTS.md', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const pkg = path.join(repoRoot, 'packages', 'foo');
      fs.mkdirSync(pkg, { recursive: true });
      fs.writeFileSync(path.join(pkg, 'AGENTS.md'), '# Foo');
      expect(
        agentsMdSymlinkSync.findAgentsMdDirs(repoRoot, null, CLAUDE_STYLE_OPTIONS).sort()
      ).toEqual(['', 'packages/foo']);
    });

    it('respects excluded', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const inNodeModules = path.join(repoRoot, 'node_modules', 'pkg');
      fs.mkdirSync(inNodeModules, { recursive: true });
      fs.writeFileSync(path.join(inNodeModules, 'AGENTS.md'), '# Pkg');
      expect(agentsMdSymlinkSync.findAgentsMdDirs(repoRoot, null, CLAUDE_STYLE_OPTIONS)).toEqual([
        '',
      ]);
      expect(
        agentsMdSymlinkSync.findAgentsMdDirs(
          repoRoot,
          { excluded: ['packages'] },
          CLAUDE_STYLE_OPTIONS
        )
      ).toEqual(['']);
      fs.mkdirSync(path.join(repoRoot, 'packages', 'bar'), { recursive: true });
      fs.writeFileSync(path.join(repoRoot, 'packages', 'bar', 'AGENTS.md'), '# Bar');
      expect(
        agentsMdSymlinkSync.findAgentsMdDirs(
          repoRoot,
          { excluded: ['packages'] },
          CLAUDE_STYLE_OPTIONS
        )
      ).toEqual(['']);
    });
  });

  describe('syncAgentsMdSymlinks', () => {
    it('creates CLAUDE.md symlinks and returns paths (caller registers to unified manifest)', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const result = agentsMdSymlinkSync.sync(repoRoot, null, CLAUDE_STYLE_OPTIONS);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('CLAUDE.md');
      }
      const claudePath = path.join(repoRoot, 'CLAUDE.md');
      expect(fs.existsSync(claudePath)).toBe(true);
      expect(fs.lstatSync(claudePath).isSymbolicLink()).toBe(true);
      expect(fs.readlinkSync(claudePath)).toBe('AGENTS.md');
    });

    it('skips directories where CLAUDE.md is a regular file', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      fs.writeFileSync(path.join(repoRoot, 'CLAUDE.md'), '# Custom');
      const result = agentsMdSymlinkSync.sync(repoRoot, null, CLAUDE_STYLE_OPTIONS);
      expect(result.isOk()).toBe(true);
      expect(fs.readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8')).toBe('# Custom');
      expect(fs.lstatSync(path.join(repoRoot, 'CLAUDE.md')).isSymbolicLink()).toBe(false);
    });

    it('adds CLAUDE.md to .gitignore if missing', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      fs.writeFileSync(path.join(repoRoot, '.gitignore'), 'node_modules\n');
      agentsMdSymlinkSync.sync(repoRoot, null, CLAUDE_STYLE_OPTIONS);
      const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
      expect(gitignore).toMatch(/CLAUDE\.md/);
    });

    it('is idempotent', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const r1 = agentsMdSymlinkSync.sync(repoRoot, null, CLAUDE_STYLE_OPTIONS);
      const r2 = agentsMdSymlinkSync.sync(repoRoot, null, CLAUDE_STYLE_OPTIONS);
      expect(r1.isOk() && r2.isOk()).toBe(true);
      expect(fs.readlinkSync(path.join(repoRoot, 'CLAUDE.md'))).toBe('AGENTS.md');
    });
  });

  describe('clearFromContents', () => {
    it('removes symlinks using stored contents', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      const syncResult = agentsMdSymlinkSync.sync(repoRoot, null, CLAUDE_STYLE_OPTIONS);
      expect(syncResult.isOk()).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, 'CLAUDE.md'))).toBe(true);
      const result = agentsMdSymlinkSync.clearFromContents(repoRoot, {
        paths: syncResult.isOk() ? syncResult.value : [],
      });
      expect(result.isOk()).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, 'CLAUDE.md'))).toBe(false);
    });

    it('does not remove regular CLAUDE.md files', () => {
      fs.writeFileSync(path.join(repoRoot, 'AGENTS.md'), '# Root');
      fs.writeFileSync(path.join(repoRoot, 'CLAUDE.md'), '# Custom');
      agentsMdSymlinkSync.clearFromContents(repoRoot, { paths: ['CLAUDE.md'] });
      expect(fs.readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8')).toBe('# Custom');
    });

    it('is idempotent when contents.paths is empty', () => {
      const result = agentsMdSymlinkSync.clearFromContents(repoRoot, {});
      expect(result.isOk()).toBe(true);
    });
  });
});
