/**
 * Sync runner: orchestrates marketplace sync for one or more agents.
 * Thin entrypoints call runSync(agents) or runSync() / runClear() for "all" (union set).
 */

import { err, ok, Result } from 'neverthrow';
import path from 'node:path';
import { configHelpers } from '../common/config-helpers.js';
import { getLogger, setLoggerContext } from '../common/logger.js';
import { pathHelpers } from '../common/path-helpers.js';
import { presetAgents } from '../common/preset-agents.js';
import {
  syncManifest,
  type SyncManifest,
  type SyncManifestEntry,
} from '../common/sync-manifest.js';
import type { Agent, SyncOutcome } from '../common/types.js';
import { AgentAdapterBase } from './agent-adapter-base.js';
import { marketplacesConfig, type DefinedAgent } from './marketplaces-config.js';
import { agentPresets } from './presets/agent-presets.js';

/** Resolves agent config from enabled-agents lookup or preset fallback; returns undefined for unknown agents. */
function getAgentConfig(
  agent: Agent,
  enabledAgents: Record<string, DefinedAgent>
): DefinedAgent | undefined {
  return (
    enabledAgents[agent] ??
    (agent in agentPresets
      ? marketplacesConfig.defineAgent(agentPresets[agent as keyof typeof agentPresets])
      : undefined)
  );
}

/** Union of preset agents, config-enabled agents, and agents present in the manifest. Deduped so each agent is processed once. */
function getAgentsToProcess(
  enabledAgents: Record<string, DefinedAgent>,
  manifest: SyncManifest
): Agent[] {
  return [
    ...new Set<Agent>([...presetAgents, ...Object.keys(enabledAgents), ...Object.keys(manifest)]),
  ];
}

/** Flushes pending logger writes before process exit or early return. */
function flushLogger(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    getLogger().flush((err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Run marketplace sync for the given agents (or all agents when omitted).
 * When agents is omitted, processes the union of preset agents, config-enabled agents, and agents in the existing manifest (each processed once).
 * For each agent: sync if enabled in config, otherwise clear (teardown). Agents only in the manifest (no config) are skipped (no DefinedAgent).
 */
export async function runSync(agents?: Agent[]): Promise<Result<SyncOutcome[], Error>> {
  const repoRoot = pathHelpers.repoRoot;
  const tsConfig = await configHelpers.ts.loadConfig(repoRoot);
  if (tsConfig === null) configHelpers.env.loadEnv(repoRoot);
  const enabledAgents = marketplacesConfig.resolveEnabledAgents(tsConfig);
  const outputRoot =
    tsConfig?.syncOutputRoot != null
      ? path.resolve(repoRoot, tsConfig.syncOutputRoot)
      : process.env.MMAAPPSS_OUTPUT_ROOT
        ? path.resolve(process.env.MMAAPPSS_OUTPUT_ROOT)
        : repoRoot;

  const enabledAgentList = Object.values(enabledAgents);
  if (enabledAgentList.length === 0) {
    console.log('[mmaappss] ❌ no agents enabled in config');
  } else {
    console.log('[mmaappss] 🤖 enabled agents:', enabledAgentList.map((a) => a.name).join(', '));
  }

  setLoggerContext(repoRoot, tsConfig, outputRoot);
  const log = getLogger();

  const manifestPath = syncManifest.getManifestPath(repoRoot, tsConfig, outputRoot);
  const manifest = syncManifest.load(manifestPath);
  const agentsToProcess = agents ?? getAgentsToProcess(enabledAgents, manifest);
  log.info(
    { configSource: tsConfig ? 'mmaappss.config.ts' : 'env/defaults', agents: agentsToProcess },
    'sync started'
  );

  const register = (agent: string, syncBehavior: string, entry: SyncManifestEntry) =>
    syncManifest.registerContent(manifest, agent, syncBehavior, entry);

  const outcomes: SyncOutcome[] = [];

  for (const agent of agentsToProcess) {
    const agentConfig = getAgentConfig(agent, enabledAgents);
    if (!agentConfig) {
      if (agent in manifest) {
        log.debug({ agent }, 'skipping manifest-only agent (no config to sync or clear)');
      }
      continue;
    }
    const adapter = new AgentAdapterBase(agentConfig);
    const isEnabled = agent in enabledAgents;

    if (isEnabled) {
      const result = adapter.run(repoRoot, tsConfig, {
        manifestByBehavior: manifest[agent] ?? {},
        outputRoot,
        registerContentToMmaappssSyncManifest: register,
      });
      if (result.isErr()) {
        log.error({ err: result.error, agent }, 'sync agent failed');
        await flushLogger();
        return err(result.error);
      }
      outcomes.push(result.value);
    } else {
      const manifestByBehavior = manifest[agent] ?? {};
      syncManifest.teardownAgentEntries(outputRoot, manifestByBehavior);
      const result = adapter.clear(repoRoot, tsConfig, {
        manifestByBehavior,
        outputRoot,
      });
      if (result.isErr()) {
        log.error({ err: result.error, agent }, 'clear agent failed');
        await flushLogger();
        return err(result.error);
      }
      outcomes.push(result.value);
      delete manifest[agent];
    }
  }

  syncManifest.write(manifestPath, manifest);
  console.log(
    '[mmaappss] 📄 sync manifest updated (enabled agents and registered behaviors):',
    path.resolve(manifestPath)
  );
  log.info({ outcomes }, 'sync completed');
  await flushLogger();
  return ok(outcomes);
}

/**
 * Force teardown (clear) for the given agents (or all when omitted).
 * When agents is omitted, processes the union of preset agents, config-enabled agents, and agents in the existing manifest (each cleared once).
 * Agents only in the manifest (no config) are skipped (no DefinedAgent to run clear).
 */
export async function runClear(agents?: Agent[]): Promise<Result<SyncOutcome[], Error>> {
  const repoRoot = pathHelpers.repoRoot;
  const tsConfig = await configHelpers.ts.loadConfig(repoRoot);
  if (tsConfig === null) configHelpers.env.loadEnv(repoRoot);
  const enabledAgents = marketplacesConfig.resolveEnabledAgents(tsConfig);
  const outputRoot =
    tsConfig?.syncOutputRoot != null
      ? path.resolve(repoRoot, tsConfig.syncOutputRoot)
      : process.env.MMAAPPSS_OUTPUT_ROOT
        ? path.resolve(process.env.MMAAPPSS_OUTPUT_ROOT)
        : repoRoot;

  setLoggerContext(repoRoot, tsConfig, outputRoot);
  const log = getLogger();

  const manifestPath = syncManifest.getManifestPath(repoRoot, tsConfig, outputRoot);
  const manifest = syncManifest.load(manifestPath);
  const agentsToProcess = agents ?? getAgentsToProcess(enabledAgents, manifest);
  log.info({ agents: agentsToProcess }, 'clear started');

  const outcomes: SyncOutcome[] = [];

  for (const agent of agentsToProcess) {
    const agentConfig = getAgentConfig(agent, enabledAgents);
    if (!agentConfig) {
      if (agent in manifest) {
        log.debug({ agent }, 'skipping manifest-only agent (no config to clear)');
      }
      continue;
    }
    const adapter = new AgentAdapterBase(agentConfig);
    const manifestByBehavior = manifest[agent] ?? {};
    syncManifest.teardownAgentEntries(outputRoot, manifestByBehavior);

    const result = adapter.clear(repoRoot, tsConfig, {
      manifestByBehavior,
      outputRoot,
    });
    if (result.isErr()) {
      log.error({ err: result.error, agent }, 'clear agent failed');
      await flushLogger();
      return err(result.error);
    }
    outcomes.push(result.value);
    delete manifest[agent];
  }

  syncManifest.write(manifestPath, manifest);
  console.log('[mmaappss] 📄 sync manifest cleared:', path.resolve(manifestPath));
  log.info({ outcomes }, 'clear completed');
  await flushLogger();
  return ok(outcomes);
}
