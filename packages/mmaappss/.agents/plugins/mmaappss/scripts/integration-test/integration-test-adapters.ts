/**
 * Integration test adapters: class-based, colocated.
 * Each adapter defines paths, assertions, and optional step overrides.
 * Not part of vitest. Run via mmaappss-marketplaces-sync-integration-test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { configHelpers } from '../common/config-helpers.js';
import { markdownSection } from '../common/markdown-section.js';
import { pathHelpers } from '../common/path-helpers.js';
import type { Agent } from '../common/types.js';
import { runSync } from '../core/sync-runner.js';

/** Suffix for temporary backup paths used during integration tests. */
const BACKUP_SUFFIX = '-testing-123';

/** Path constants for integration test backup dirs and assertions (relative to repo root). */
const PATHS = {
  CLAUDE_PLUGIN_DIR: '.claude-plugin',
  CLAUDE_DIR: '.claude',
  CURSOR_PLUGIN_DIR: '.cursor-plugin',
  CURSOR_DIR: '.cursor',
  CODEX_AGENTS_FILE: 'AGENTS.override.md',
  CONFIG_FILE: 'mmaappss.config.ts',
  CONFIG_BACKUP_FILE: 'mmaappss.config.ts.testing-backup',
  MARKETPLACE_JSON: 'marketplace.json',
  SETTINGS_JSON: 'settings.json',
  CLAUDE_SYNC_MANIFEST: '.mmaappss-claude-sync.json',
  CURSOR_SYNC_MANIFEST: '.cursor/.mmaappss-cursor-sync.json',
  MMAAPPSS_PLUGINS_NAME: 'mmaappss-plugins',
} as const;

export type IntegrationTestMode = 'enabled' | 'disabled';

export interface IntegrationTestStep {
  mode: IntegrationTestMode;
  label: string;
  /** Optional config override (backup mmaappss.config.ts, write override, run, restore). */
  configOverride?: Record<string, unknown>;
  /** When true, only assert runSync succeeded (skip strict filesystem asserts; used for excludeDirectories etc). */
  relaxAssertions?: boolean;
}

const DEFAULT_STEPS: IntegrationTestStep[] = [
  { mode: 'disabled', label: 'clean slate' },
  { mode: 'enabled', label: 'create files' },
  { mode: 'disabled', label: 'remove' },
  { mode: 'enabled', label: 'recreate' },
  { mode: 'enabled', label: 'idempotent: enabled again (no changes)' },
  { mode: 'disabled', label: 'remove again' },
  { mode: 'disabled', label: 'idempotent: disabled again (no-op)' },
  { mode: 'enabled', label: 'final create' },
  {
    mode: 'enabled',
    label: 'enabled with excludeDirectories: [packages]',
    configOverride: { excludeDirectories: ['packages'] },
    relaxAssertions: true,
  },
  { mode: 'enabled', label: 'restore full set (no excludeDirectories)' },
];

/**
 * Remove path if it exists (recursive for dirs). Idempotent; ignores errors.
 * Exported for use by clear integration test.
 */
export function removeIfExists(p: string): void {
  try {
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true });
  } catch {
    // ignore
  }
}

/**
 * Rename from -> to if from exists. Removes to first if it exists.
 */
function renameIfExists(from: string, to: string): void {
  if (fs.existsSync(from)) {
    if (fs.existsSync(to)) fs.rmSync(to, { recursive: true });
    fs.renameSync(from, to);
  }
}

export abstract class IntegrationTestAdapterBase {
  abstract readonly agent: Agent;
  abstract readonly envVar: string;
  abstract readonly backupPaths: Array<{ from: string; to: string }>;
  readonly steps: IntegrationTestStep[] = DEFAULT_STEPS;

  abstract assertEnabled(root: string): string[];
  abstract assertDisabled(root: string): string[];

  protected setEnv(mode: IntegrationTestMode): void {
    const VARS = configHelpers.env.VARS;
    process.env[VARS.ENV_ALL] = 'true';
    process.env[this.envVar] = mode === 'enabled' ? 'true' : 'false';
  }

  async runSingleCondition(root: string, mode: IntegrationTestMode): Promise<boolean> {
    this.setEnv(mode);
    const result = await runSync([this.agent]);
    if (!result.isOk()) {
      console.error('runSync failed:', result.error.message);
      return false;
    }
    const errors = mode === 'enabled' ? this.assertEnabled(root) : this.assertDisabled(root);
    if (errors.length > 0) {
      console.error(`Assertions failed (${mode}):`, errors);
      return false;
    }
    return true;
  }

  async runAllConditions(root: string): Promise<number> {
    // Start clean: remove any leftover backup dirs from a previous run
    for (const { to } of this.backupPaths) {
      removeIfExists(to);
    }

    try {
      for (const { from, to } of this.backupPaths) {
        removeIfExists(to);
        renameIfExists(from, to);
      }
    } catch (e) {
      console.error('Backup failed:', (e as Error).message);
      for (const { from, to } of this.backupPaths) renameIfExists(to, from);
      return 1;
    }

    const results: { step: IntegrationTestStep; passed: boolean }[] = [];
    let allPassed = true;

    const configPath = path.join(root, PATHS.CONFIG_FILE);
    const configBackupPath = path.join(root, PATHS.CONFIG_BACKUP_FILE);

    const runStep = async (step: IntegrationTestStep): Promise<boolean> => {
      if (step.configOverride) {
        try {
          if (fs.existsSync(configPath)) fs.renameSync(configPath, configBackupPath);
          const fullConfig = {
            marketplacesEnabled: {
              claude: true,
              cursor: true,
              codex: true,
            },
            ...step.configOverride,
          };
          fs.writeFileSync(
            configPath,
            `export default ${JSON.stringify(fullConfig, null, 2)} as const;\n`
          );
        } catch (e) {
          console.error('Config override failed:', (e as Error).message);
          if (fs.existsSync(configBackupPath)) fs.renameSync(configBackupPath, configPath);
          return false;
        }
      }
      let passed: boolean;
      if (step.relaxAssertions) {
        this.setEnv(step.mode);
        const result = await runSync([this.agent]);
        passed = result.isOk();
        if (!passed) console.error('runSync failed:', result.isErr() ? result.error.message : '');
      } else {
        passed = await this.runSingleCondition(root, step.mode);
      }
      if (step.configOverride) {
        try {
          removeIfExists(configPath);
          if (fs.existsSync(configBackupPath)) fs.renameSync(configBackupPath, configPath);
        } catch (e) {
          console.error('Config restore failed:', (e as Error).message);
        }
      }
      return passed;
    };

    try {
      for (const step of this.steps) {
        const passed = await runStep(step);
        results.push({ step, passed });
        if (!passed) allPassed = false;
      }
    } finally {
      for (const { from, to } of this.backupPaths) {
        removeIfExists(from);
        renameIfExists(to, from);
        removeIfExists(to);
      }
    }

    for (const { step, passed } of results) {
      console.log(passed ? 'PASS' : 'FAIL', step.label, `(${step.mode})`);
    }
    return allPassed ? 0 : 1;
  }
}

function withRoot(relativePath: string): string {
  return path.join(pathHelpers.repoRoot, relativePath);
}

export class ClaudeIntegrationAdapter extends IntegrationTestAdapterBase {
  readonly agent = 'claude' as const;
  readonly envVar = configHelpers.env.VARS.ENV_CLAUDE;
  readonly backupPaths = [
    {
      from: withRoot(PATHS.CLAUDE_PLUGIN_DIR),
      to: withRoot(PATHS.CLAUDE_PLUGIN_DIR + BACKUP_SUFFIX),
    },
    { from: withRoot(PATHS.CLAUDE_DIR), to: withRoot(PATHS.CLAUDE_DIR + BACKUP_SUFFIX) },
  ];

  assertEnabled(root: string): string[] {
    const errors: string[] = [];
    const marketplace = path.join(root, PATHS.CLAUDE_PLUGIN_DIR, PATHS.MARKETPLACE_JSON);
    const settings = path.join(root, PATHS.CLAUDE_DIR, PATHS.SETTINGS_JSON);
    if (!fs.existsSync(marketplace))
      errors.push(`${PATHS.CLAUDE_PLUGIN_DIR}/${PATHS.MARKETPLACE_JSON} missing`);
    if (!fs.existsSync(settings)) errors.push(`${PATHS.CLAUDE_DIR}/${PATHS.SETTINGS_JSON} missing`);
    if (fs.existsSync(settings)) {
      const s = JSON.parse(fs.readFileSync(settings, 'utf8')) as Record<string, unknown>;
      const ek = s.extraKnownMarketplaces as Record<string, unknown> | undefined;
      if (!ek?.[PATHS.MMAAPPSS_PLUGINS_NAME])
        errors.push(`settings.json missing extraKnownMarketplaces.${PATHS.MMAAPPSS_PLUGINS_NAME}`);
    }
    return errors;
  }

  assertDisabled(root: string): string[] {
    const errors: string[] = [];
    const manifest = path.join(root, PATHS.CLAUDE_DIR, PATHS.CLAUDE_SYNC_MANIFEST);
    const marketplace = path.join(root, PATHS.CLAUDE_PLUGIN_DIR, PATHS.MARKETPLACE_JSON);
    const settings = path.join(root, PATHS.CLAUDE_DIR, PATHS.SETTINGS_JSON);
    if (fs.existsSync(manifest)) {
      errors.push(
        `${PATHS.CLAUDE_DIR}/${PATHS.CLAUDE_SYNC_MANIFEST} should not exist when disabled`
      );
    }
    if (fs.existsSync(marketplace)) {
      const m = JSON.parse(fs.readFileSync(marketplace, 'utf8')) as { name?: string };
      if (m.name === PATHS.MMAAPPSS_PLUGINS_NAME)
        errors.push('marketplace.json should be removed or stripped when disabled');
    }
    if (fs.existsSync(settings)) {
      const s = JSON.parse(fs.readFileSync(settings, 'utf8')) as Record<string, unknown>;
      const ek = s.extraKnownMarketplaces as Record<string, unknown> | undefined;
      if (ek?.[PATHS.MMAAPPSS_PLUGINS_NAME])
        errors.push(`settings.json should not have ${PATHS.MMAAPPSS_PLUGINS_NAME} when disabled`);
    }
    return errors;
  }
}

export class CursorIntegrationAdapter extends IntegrationTestAdapterBase {
  readonly agent = 'cursor' as const;
  readonly envVar = configHelpers.env.VARS.ENV_CURSOR;
  readonly backupPaths = [
    {
      from: withRoot(PATHS.CURSOR_PLUGIN_DIR),
      to: withRoot(PATHS.CURSOR_PLUGIN_DIR + BACKUP_SUFFIX),
    },
    { from: withRoot(PATHS.CURSOR_DIR), to: withRoot(PATHS.CURSOR_DIR + BACKUP_SUFFIX) },
  ];

  assertEnabled(root: string): string[] {
    const errors: string[] = [];
    const manifestPath = path.join(root, PATHS.CURSOR_SYNC_MANIFEST);
    if (!fs.existsSync(manifestPath))
      errors.push(`${PATHS.CURSOR_SYNC_MANIFEST} missing (content sync manifest)`);
    if (fs.existsSync(manifestPath)) {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      type CursorSyncManifest = {
        rules?: unknown[];
        commands?: unknown[];
        skills?: unknown[];
        agents?: unknown[];
      };
      let manifest: CursorSyncManifest | undefined = undefined;
      try {
        manifest = JSON.parse(raw) as CursorSyncManifest;
      } catch {
        errors.push(`${PATHS.CURSOR_SYNC_MANIFEST} invalid JSON`);
      }
      if (manifest && typeof manifest === 'object') {
        const hasArrays =
          Array.isArray(manifest.rules) ||
          Array.isArray(manifest.commands) ||
          Array.isArray(manifest.skills) ||
          Array.isArray(manifest.agents);
        if (!hasArrays)
          errors.push(
            `${PATHS.CURSOR_SYNC_MANIFEST} should have rules, commands, skills, or agents arrays`
          );
      }
    }
    return errors;
  }

  assertDisabled(root: string): string[] {
    const errors: string[] = [];
    const manifestPath = path.join(root, PATHS.CURSOR_SYNC_MANIFEST);
    if (fs.existsSync(manifestPath))
      errors.push(`${PATHS.CURSOR_SYNC_MANIFEST} should not exist when disabled`);
    return errors;
  }
}

export class CodexIntegrationAdapter extends IntegrationTestAdapterBase {
  readonly agent = 'codex' as const;
  readonly envVar = configHelpers.env.VARS.ENV_CODEX;
  readonly backupPaths = [
    {
      from: withRoot(PATHS.CODEX_AGENTS_FILE),
      to: withRoot(PATHS.CODEX_AGENTS_FILE + BACKUP_SUFFIX),
    },
  ];

  private readonly sectionHeading = markdownSection.CODEX_SECTION_HEADING.replace(/^#+\s*/, '');

  assertEnabled(root: string): string[] {
    const errors: string[] = [];
    const agentsFile = path.join(root, PATHS.CODEX_AGENTS_FILE);
    if (!fs.existsSync(agentsFile)) return [`${PATHS.CODEX_AGENTS_FILE} missing`];
    const content = fs.readFileSync(agentsFile, 'utf8');
    const re = new RegExp(
      `^#+\\s+${this.sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
      'im'
    );
    if (!re.test(content))
      errors.push(`${PATHS.CODEX_AGENTS_FILE} missing ## ${this.sectionHeading} section`);
    return errors;
  }

  assertDisabled(root: string): string[] {
    const errors: string[] = [];
    const agentsFile = path.join(root, PATHS.CODEX_AGENTS_FILE);
    if (!fs.existsSync(agentsFile)) return [];
    const content = fs.readFileSync(agentsFile, 'utf8');
    const re = new RegExp(
      `^#+\\s+${this.sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
      'im'
    );
    if (re.test(content))
      errors.push(
        `${PATHS.CODEX_AGENTS_FILE} should not contain ## ${this.sectionHeading} section when disabled`
      );
    return errors;
  }
}

export const INTEGRATION_ADAPTERS: Record<Agent, IntegrationTestAdapterBase> = {
  claude: new ClaudeIntegrationAdapter(),
  cursor: new CursorIntegrationAdapter(),
  codex: new CodexIntegrationAdapter(),
};
