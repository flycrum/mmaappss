/**
 * Integration test for marketplace clear (teardown) for Claude, Cursor, Codex.
 * Ensures runClear tears down state created by sync (same assertions as sync test).
 *
 * Usage:
 *   tsx integration-test/mmaappss-marketplaces-clear-integration-test.ts <agent|all>
 *
 * Run: pnpm -F @mmaappss/sync run mmaappss:marketplaces:all:clear:test
 */

import fs from 'node:fs';
import { configHelpers } from '../common/config-helpers.js';
import { pathHelpers } from '../common/path-helpers.js';
import { presetAgents } from '../common/preset-agents.js';
import type { Agent } from '../common/types.js';
import { runClear, runSync } from '../core/sync-runner.js';
import { INTEGRATION_ADAPTERS, removeIfExists } from './integration-test-adapters.js';

const AGENTS: Agent[] = [...presetAgents];

async function runClearTestForAgent(agent: Agent): Promise<boolean> {
  const root = pathHelpers.repoRoot;
  const adapter = INTEGRATION_ADAPTERS[agent];
  if (!adapter) {
    console.error(`Missing integration adapter for ${agent}`);
    return false;
  }
  const VARS = configHelpers.env.VARS;

  const renameIfExists = (from: string, to: string): void => {
    if (fs.existsSync(from)) {
      if (fs.existsSync(to)) fs.rmSync(to, { recursive: true });
      fs.renameSync(from, to);
    }
  };

  // Start clean: remove any leftover backup dirs from a previous run
  for (const { to } of adapter.backupPaths) removeIfExists(to);

  try {
    for (const { from, to } of adapter.backupPaths) {
      removeIfExists(to);
      renameIfExists(from, to);
    }
  } catch (e) {
    console.error('Backup failed:', (e as Error).message);
    for (const { from, to } of adapter.backupPaths) renameIfExists(to, from);
    return false;
  }

  let passed = false;
  const originalEnvAll = process.env[VARS.ENV_ALL];
  const originalAdapterEnv = process.env[adapter.envVar];
  process.env[VARS.ENV_ALL] = 'true';
  process.env[adapter.envVar] = 'true';
  try {
    const syncResult = await runSync([agent]);
    if (syncResult.isErr()) {
      console.error('runSync (enable) failed:', syncResult.error.message);
      return false;
    }
    const enabledErrors = adapter.assertEnabled(root);
    if (enabledErrors.length > 0) {
      console.error('assertEnabled failed after sync:', enabledErrors);
      return false;
    }

    const clearResult = await runClear([agent]);
    if (clearResult.isErr()) {
      console.error('runClear failed:', clearResult.error.message);
      return false;
    }
    const disabledErrors = adapter.assertDisabled(root);
    if (disabledErrors.length > 0) {
      console.error('assertDisabled failed after clear:', disabledErrors);
      return false;
    }
    passed = true;
  } finally {
    if (originalEnvAll === undefined) delete process.env[VARS.ENV_ALL];
    else process.env[VARS.ENV_ALL] = originalEnvAll;
    if (originalAdapterEnv === undefined) delete process.env[adapter.envVar];
    else process.env[adapter.envVar] = originalAdapterEnv;
    try {
      for (const { from, to } of adapter.backupPaths) {
        removeIfExists(from);
        renameIfExists(to, from);
        removeIfExists(to);
      }
    } catch (e) {
      console.error('Restore failed:', (e as Error).message);
    }
  }
  return passed;
}

async function main(): Promise<void> {
  const agentArg = process.argv[2];

  const validArgs = [...presetAgents, 'all'] as const;
  if (!agentArg || !validArgs.includes(agentArg as (typeof validArgs)[number])) {
    console.error(
      `Usage: tsx mmaappss-marketplaces-clear-integration-test.ts <${presetAgents.join('|')}|all>`
    );
    process.exit(1);
  }

  const agents: Agent[] = agentArg === 'all' ? AGENTS : [agentArg as Agent];
  let allPassed = true;

  for (const agent of agents) {
    const passed = await runClearTestForAgent(agent);
    console.log(passed ? 'PASS' : 'FAIL', `clear ${agent}`);
    if (!passed) allPassed = false;
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('Unexpected error in mmaappss-marketplaces-clear-integration-test', err);
  process.exit(1);
});
