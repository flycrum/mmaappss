/**
 * Integration test for marketplace sync (Claude, Cursor, Codex).
 * Colada-style backup/restore, class-based adapters.
 *
 * Usage:
 *   tsx integration-test/mmaappss-marketplaces-sync-integration-test.ts <agent|all> [mode]
 *
 * Examples:
 *   tsx ... claude              # run all conditions for claude
 *   tsx ... cursor enabled      # run single condition for cursor
 *   tsx ... all                 # run all conditions for all 3 agents
 *
 * Not part of vitest. Run: pnpm -F @mmaappss/mmaappss run mmaappss:marketplaces:all:sync:test
 */

import { pathHelpers } from '../common/path-helpers.js';
import { presetAgents } from '../common/preset-agents.js';
import type { Agent } from '../common/types.js';
import { INTEGRATION_ADAPTERS, type IntegrationTestMode } from './integration-test-adapters.js';

const AGENTS: Agent[] = [...presetAgents];
const MODES: IntegrationTestMode[] = ['enabled', 'disabled'];

async function main(): Promise<void> {
  const agentArg = process.argv[2];
  const modeArg = process.argv[3];

  if (!agentArg || (agentArg !== 'all' && !AGENTS.includes(agentArg as Agent))) {
    console.error(
      `Usage: tsx mmaappss-marketplaces-sync-integration-test.ts <${AGENTS.join('|')}|all> [enabled|disabled]`
    );
    console.error('  Agent only: run all conditions (backup → steps → restore)');
    console.error('  Agent + mode: run single condition');
    process.exit(1);
  }

  const root = pathHelpers.repoRoot;

  if (agentArg === 'all') {
    if (modeArg) {
      console.error('Cannot specify mode with "all"');
      process.exit(1);
    }
    for (const agent of AGENTS) {
      const adapter = INTEGRATION_ADAPTERS[agent];
      if (!adapter) {
        console.error(`Missing integration adapter: ${agent}`);
        process.exit(1);
      }
      const code = await adapter.runAllConditions(root);
      if (code !== 0) process.exit(code);
    }
    process.exit(0);
  }

  const adapter = INTEGRATION_ADAPTERS[agentArg as Agent];
  if (!adapter) {
    console.error(`Missing integration adapter: ${agentArg}`);
    process.exit(1);
  }

  if (modeArg) {
    if (!MODES.includes(modeArg as IntegrationTestMode)) {
      console.error(`Mode must be ${MODES.join(' or ')}`);
      process.exit(1);
    }
    const passed = await adapter.runSingleCondition(root, modeArg as IntegrationTestMode);
    process.exit(passed ? 0 : 1);
  }

  const code = await adapter.runAllConditions(root);
  process.exit(code);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err) : err);
  process.exit(1);
});
