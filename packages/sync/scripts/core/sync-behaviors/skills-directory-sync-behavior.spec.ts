import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SyncManifestEntry } from '../../common/sync-manifest.js';
import { SkillsDirectorySyncBehavior } from './skills-directory-sync-behavior.js';
import type { SyncBehaviorContext } from './sync-behavior-base.js';

function makeContext(overrides: Partial<SyncBehaviorContext>): SyncBehaviorContext {
  return {
    agentConfig: { name: overrides.agentName ?? 'claude' },
    agentName: overrides.agentName ?? 'claude',
    currentBehaviorManifestKey: 'skillsDirectorySync',
    currentBehaviorOptionsForManifest: {},
    enabled: true,
    marketplaces: [],
    outputRoot: overrides.outputRoot ?? '',
    registerContentToMmaappssSyncManifest:
      overrides.registerContentToMmaappssSyncManifest ?? (() => {}),
    repoRoot: overrides.repoRoot ?? '',
    sharedState: new Map(),
    tsConfig: overrides.tsConfig ?? null,
    ...overrides,
  };
}

describe('SkillsDirectorySyncBehavior', () => {
  it('no-op when resolved path equals native path (codex)', () => {
    const registered: Record<string, Record<string, SyncManifestEntry>> = {};
    const register = (agent: string, key: string, entry: SyncManifestEntry) => {
      if (!registered[agent]) registered[agent] = {};
      registered[agent][key] = entry;
    };
    const ctx = makeContext({
      agentName: 'codex',
      repoRoot: '/repo',
      outputRoot: '/repo',
      registerContentToMmaappssSyncManifest: register,
      tsConfig: null,
    });
    const behavior = new SkillsDirectorySyncBehavior();
    const result = behavior.syncRunEnabled(ctx);
    expect(result.isOk()).toBe(true);
    expect(registered.codex?.skillsDirectorySync).toBeDefined();
    const entry = registered.codex!.skillsDirectorySync as { symlinks?: string[] };
    expect(Array.isArray(entry.symlinks)).toBe(true);
    expect(entry.symlinks).toHaveLength(0);
  });

  it('registers empty symlinks when no skills dirs exist (claude)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-sync-'));
    try {
      const registered: Record<string, Record<string, SyncManifestEntry>> = {};
      const register = (agent: string, key: string, entry: SyncManifestEntry) => {
        if (!registered[agent]) registered[agent] = {};
        registered[agent][key] = entry;
      };
      const ctx = makeContext({
        agentName: 'claude',
        repoRoot: dir,
        outputRoot: dir,
        registerContentToMmaappssSyncManifest: register,
        tsConfig: null,
      });
      const behavior = new SkillsDirectorySyncBehavior();
      const result = behavior.syncRunEnabled(ctx);
      expect(result.isOk()).toBe(true);
      const entry = registered.claude!.skillsDirectorySync as { symlinks?: string[] };
      expect(entry.symlinks).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('syncs skill dir to native path and registers symlink (claude)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-sync-'));
    try {
      const skillsRoot = path.join(dir, '.agents', 'skills');
      const skillDir = path.join(skillsRoot, 'foo');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: foo\n---\n');

      const registered: Record<string, Record<string, SyncManifestEntry>> = {};
      const register = (agent: string, key: string, entry: SyncManifestEntry) => {
        if (!registered[agent]) registered[agent] = {};
        registered[agent][key] = entry;
      };
      const ctx = makeContext({
        agentName: 'claude',
        repoRoot: dir,
        outputRoot: dir,
        registerContentToMmaappssSyncManifest: register,
        tsConfig: null,
      });
      const behavior = new SkillsDirectorySyncBehavior();
      const result = behavior.syncRunEnabled(ctx);
      expect(result.isOk()).toBe(true);

      const nativeSkill = path.join(dir, '.claude', 'skills', 'foo');
      expect(fs.existsSync(nativeSkill)).toBe(true);
      expect(fs.readlinkSync(nativeSkill)).toBeDefined();

      const entry = registered.claude!.skillsDirectorySync as { symlinks?: string[] };
      expect(entry.symlinks).toContain('.claude/skills/foo');

      behavior.clearRun({ ...ctx, manifestContent: registered.claude!.skillsDirectorySync });
      expect(fs.existsSync(nativeSkill)).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
