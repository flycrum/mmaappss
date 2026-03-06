/**
 * Sync runner: orchestrates marketplace sync for one or more agents.
 * Thin entrypoints call runSync(agents).
 */

import { err, ok, Result } from 'neverthrow';
import { configHelpers } from '../common/config-helpers.js';
import { pathHelpers } from '../common/path-helpers.js';
import type { Agent, SyncOutcome } from '../common/types.js';
import { AgentAdapterBase } from './agent-adapter-base.js';
import { claudeAdapter } from './claude-adapter.js';
import { codexAdapter } from './codex-adapter.js';
import { cursorAdapter } from './cursor-adapter.js';

const AGENT_ADAPTERS_ALL: Record<Agent, AgentAdapterBase> = {
  claude: claudeAdapter,
  cursor: cursorAdapter,
  codex: codexAdapter,
};

export interface SyncRunnerOptions {
  agents: Agent[];
}

/**
 * Run marketplace sync for the given agents.
 * Loads config from repo root; each agent runs enable or disable based on config.
 */
export async function runSync(agents: Agent[]): Promise<Result<SyncOutcome[], Error>> {
  const repoRoot = pathHelpers.repoRoot;
  configHelpers.env.loadEnv(repoRoot);

  const tsConfig = await configHelpers.ts.loadConfig(repoRoot);
  const outcomes: SyncOutcome[] = [];

  for (const agent of agents) {
    const adapter = AGENT_ADAPTERS_ALL[agent];
    if (!adapter) {
      outcomes.push({ agent, success: false, message: `Unknown agent: ${agent}` });
      continue;
    }

    const result = adapter.run(repoRoot, tsConfig);
    if (result.isErr()) {
      return err(result.error);
    }
    outcomes.push(result.value);
  }

  return ok(outcomes);
}

/**
 * Force teardown (clear) for the given agents. Ignores config; runs disable logic only.
 */
export async function runClear(agents: Agent[]): Promise<Result<SyncOutcome[], Error>> {
  const repoRoot = pathHelpers.repoRoot;
  configHelpers.env.loadEnv(repoRoot);

  const outcomes: SyncOutcome[] = [];

  for (const agent of agents) {
    const adapter = AGENT_ADAPTERS_ALL[agent];
    if (!adapter) {
      outcomes.push({ agent, success: false, message: `Unknown agent: ${agent}` });
      continue;
    }

    const result = adapter.clear(repoRoot);
    if (result.isErr()) {
      return err(result.error);
    }
    outcomes.push(result.value);
  }

  return ok(outcomes);
}
