/**
 * Sync runner: orchestrates marketplace sync for one or more agents.
 * Thin entrypoints call runSync(agents).
 */

import { err, ok, Result } from 'neverthrow';
import { configHelpers } from '../common/config-helpers.js';
import { getLogger, setLoggerContext } from '../common/logger.js';
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

function flushLogger(): Promise<void> {
  return new Promise<void>((resolve) => getLogger().flush(() => resolve()));
}

/**
 * Run marketplace sync for the given agents.
 * Loads config from repo root; each agent runs enable or disable based on config.
 */
export async function runSync(agents: Agent[]): Promise<Result<SyncOutcome[], Error>> {
  const repoRoot = pathHelpers.repoRoot;
  configHelpers.env.loadEnv(repoRoot);

  const tsConfig = await configHelpers.ts.loadConfig(repoRoot);
  setLoggerContext(repoRoot, tsConfig);
  const log = getLogger();
  log.info(
    { configSource: tsConfig ? 'mmaappss.config.ts' : 'env/defaults', agents },
    'sync started'
  );

  const outcomes: SyncOutcome[] = [];

  for (const agent of agents) {
    const adapter = AGENT_ADAPTERS_ALL[agent];
    if (!adapter) {
      outcomes.push({ agent, success: false, message: `Unknown agent: ${agent}` });
      continue;
    }

    const result = adapter.run(repoRoot, tsConfig);
    if (result.isErr()) {
      log.error({ err: result.error, agent }, 'sync agent failed');
      await flushLogger();
      return err(result.error);
    }
    outcomes.push(result.value);
  }

  log.info({ outcomes }, 'sync completed');
  await flushLogger();
  return ok(outcomes);
}

/**
 * Force teardown (clear) for the given agents. Ignores config; runs disable logic only.
 */
export async function runClear(agents: Agent[]): Promise<Result<SyncOutcome[], Error>> {
  const repoRoot = pathHelpers.repoRoot;
  configHelpers.env.loadEnv(repoRoot);

  const tsConfig = await configHelpers.ts.loadConfig(repoRoot);
  setLoggerContext(repoRoot, tsConfig);
  const log = getLogger();
  log.info({ agents }, 'clear started');

  const outcomes: SyncOutcome[] = [];

  for (const agent of agents) {
    const adapter = AGENT_ADAPTERS_ALL[agent];
    if (!adapter) {
      outcomes.push({ agent, success: false, message: `Unknown agent: ${agent}` });
      continue;
    }

    const result = adapter.clear(repoRoot);
    if (result.isErr()) {
      log.error({ err: result.error, agent }, 'clear agent failed');
      await flushLogger();
      return err(result.error);
    }
    outcomes.push(result.value);
  }

  log.info({ outcomes }, 'clear completed');
  await flushLogger();
  return ok(outcomes);
}
