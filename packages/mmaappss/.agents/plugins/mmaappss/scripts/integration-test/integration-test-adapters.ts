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
    const renameIfExists = (from: string, to: string): void => {
      if (fs.existsSync(from)) {
        if (fs.existsSync(to)) fs.rmSync(to, { recursive: true });
        fs.renameSync(from, to);
      }
    };

    try {
      for (const { from, to } of this.backupPaths) {
        if (fs.existsSync(to)) fs.rmSync(to, { recursive: true });
        renameIfExists(from, to);
      }
    } catch (e) {
      console.error('Backup failed:', (e as Error).message);
      for (const { from, to } of this.backupPaths) renameIfExists(to, from);
      return 1;
    }

    const results: { step: IntegrationTestStep; passed: boolean }[] = [];
    let allPassed = true;

    const runStep = async (step: IntegrationTestStep): Promise<boolean> => {
      const configPath = path.join(root, 'mmaappss.config.ts');
      const configBackup = path.join(root, 'mmaappss.config.ts.testing-backup');
      if (step.configOverride) {
        try {
          if (fs.existsSync(configPath)) fs.renameSync(configPath, configBackup);
          const fullConfig = {
            marketplaceAll: true,
            marketplaceClaude: true,
            marketplaceCursor: true,
            marketplaceCodex: true,
            ...step.configOverride,
          };
          fs.writeFileSync(
            configPath,
            `export default ${JSON.stringify(fullConfig, null, 2)} as const;\n`
          );
        } catch (e) {
          console.error('Config override failed:', (e as Error).message);
          if (fs.existsSync(configBackup)) fs.renameSync(configBackup, configPath);
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
          if (fs.existsSync(configPath)) fs.rmSync(configPath);
          if (fs.existsSync(configBackup)) fs.renameSync(configBackup, configPath);
        } catch (e) {
          console.error('Config restore failed:', (e as Error).message);
        }
      }
      return passed;
    };

    for (const step of this.steps) {
      const passed = await runStep(step);
      results.push({ step, passed });
      if (!passed) allPassed = false;
    }

    try {
      for (const { from, to } of this.backupPaths) {
        if (fs.existsSync(from)) fs.rmSync(from, { recursive: true });
        renameIfExists(to, from);
      }
    } catch (e) {
      console.error('Restore failed:', (e as Error).message);
    }

    for (const { step, passed } of results) {
      console.log(passed ? 'PASS' : 'FAIL', step.label, `(${step.mode})`);
    }
    return allPassed ? 0 : 1;
  }
}

function withRoot(p: string): string {
  return path.join(pathHelpers.repoRoot, p);
}

export class ClaudeIntegrationAdapter extends IntegrationTestAdapterBase {
  readonly agent = 'claude' as const;
  readonly envVar = configHelpers.env.VARS.ENV_CLAUDE;
  readonly backupPaths = [
    { from: withRoot('.claude-plugin'), to: withRoot('.claude-plugin-testing-123') },
    { from: withRoot('.claude'), to: withRoot('.claude-testing-123') },
  ];

  assertEnabled(root: string): string[] {
    const errors: string[] = [];
    const marketplace = path.join(root, '.claude-plugin', 'marketplace.json');
    const settings = path.join(root, '.claude', 'settings.json');
    if (!fs.existsSync(marketplace)) errors.push('.claude-plugin/marketplace.json missing');
    if (!fs.existsSync(settings)) errors.push('.claude/settings.json missing');
    if (fs.existsSync(settings)) {
      const s = JSON.parse(fs.readFileSync(settings, 'utf8')) as Record<string, unknown>;
      const ek = s.extraKnownMarketplaces as Record<string, unknown> | undefined;
      if (!ek?.['mmaappss-plugins'])
        errors.push('settings.json missing extraKnownMarketplaces.mmaappss-plugins');
    }
    return errors;
  }

  assertDisabled(root: string): string[] {
    const errors: string[] = [];
    const manifest = path.join(root, '.claude', '.mmaappss-claude-sync.json');
    const marketplace = path.join(root, '.claude-plugin', 'marketplace.json');
    const settings = path.join(root, '.claude', 'settings.json');
    if (fs.existsSync(manifest))
      errors.push('.claude/.mmaappss-claude-sync.json should not exist when disabled');
    if (fs.existsSync(marketplace)) {
      const m = JSON.parse(fs.readFileSync(marketplace, 'utf8')) as { name?: string };
      if (m.name === 'mmaappss-plugins')
        errors.push('marketplace.json should be removed or stripped when disabled');
    }
    if (fs.existsSync(settings)) {
      const s = JSON.parse(fs.readFileSync(settings, 'utf8')) as Record<string, unknown>;
      const ek = s.extraKnownMarketplaces as Record<string, unknown> | undefined;
      if (ek?.['mmaappss-plugins'])
        errors.push('settings.json should not have mmaappss-plugins when disabled');
    }
    return errors;
  }
}

export class CursorIntegrationAdapter extends IntegrationTestAdapterBase {
  readonly agent = 'cursor' as const;
  readonly envVar = configHelpers.env.VARS.ENV_CURSOR;
  readonly backupPaths = [
    { from: withRoot('.cursor-plugin'), to: withRoot('.cursor-plugin-testing-123') },
    { from: withRoot('.cursor'), to: withRoot('.cursor-testing-123') },
  ];

  assertEnabled(root: string): string[] {
    const errors: string[] = [];
    const marketplace = path.join(root, '.cursor-plugin', 'marketplace.json');
    if (!fs.existsSync(marketplace)) errors.push('.cursor-plugin/marketplace.json missing');
    if (fs.existsSync(marketplace)) {
      const m = JSON.parse(fs.readFileSync(marketplace, 'utf8')) as {
        name?: string;
        plugins?: unknown[];
      };
      if (m.name !== 'mmaappss-plugins' || !Array.isArray(m.plugins) || m.plugins.length === 0) {
        errors.push('marketplace.json should have name mmaappss-plugins and plugins');
      }
    }
    return errors;
  }

  assertDisabled(root: string): string[] {
    const errors: string[] = [];
    const manifest = path.join(root, '.cursor', '.mmaappss-cursor-sync.json');
    const marketplace = path.join(root, '.cursor-plugin', 'marketplace.json');
    if (fs.existsSync(manifest))
      errors.push('.cursor/.mmaappss-cursor-sync.json should not exist when disabled');
    if (fs.existsSync(marketplace)) {
      const m = JSON.parse(fs.readFileSync(marketplace, 'utf8')) as { name?: string };
      if (m.name === 'mmaappss-plugins')
        errors.push('marketplace.json should be removed or stripped when disabled');
    }
    return errors;
  }
}

/** Codex sync target; see https://developers.openai.com/codex/guides/agents-md/ */
const CODEX_AGENTS_FILE = 'AGENTS.override.md';

export class CodexIntegrationAdapter extends IntegrationTestAdapterBase {
  readonly agent = 'codex' as const;
  readonly envVar = configHelpers.env.VARS.ENV_CODEX;
  readonly backupPaths = [
    { from: withRoot(CODEX_AGENTS_FILE), to: withRoot(`${CODEX_AGENTS_FILE}.testing-123`) },
  ];

  private readonly sectionHeading = markdownSection.CODEX_SECTION_HEADING.replace(/^#+\s*/, '');

  assertEnabled(root: string): string[] {
    const errors: string[] = [];
    const agentsFile = path.join(root, CODEX_AGENTS_FILE);
    if (!fs.existsSync(agentsFile)) return [`${CODEX_AGENTS_FILE} missing`];
    const content = fs.readFileSync(agentsFile, 'utf8');
    const re = new RegExp(
      `^#+\\s+${this.sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
      'im'
    );
    if (!re.test(content))
      errors.push(`${CODEX_AGENTS_FILE} missing ## ${this.sectionHeading} section`);
    return errors;
  }

  assertDisabled(root: string): string[] {
    const errors: string[] = [];
    const agentsFile = path.join(root, CODEX_AGENTS_FILE);
    if (!fs.existsSync(agentsFile)) return [];
    const content = fs.readFileSync(agentsFile, 'utf8');
    const re = new RegExp(
      `^#+\\s+${this.sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
      'im'
    );
    if (re.test(content))
      errors.push(
        `${CODEX_AGENTS_FILE} should not contain ## ${this.sectionHeading} section when disabled`
      );
    return errors;
  }
}

export const INTEGRATION_ADAPTERS: Record<Agent, IntegrationTestAdapterBase> = {
  claude: new ClaudeIntegrationAdapter(),
  cursor: new CursorIntegrationAdapter(),
  codex: new CodexIntegrationAdapter(),
};
