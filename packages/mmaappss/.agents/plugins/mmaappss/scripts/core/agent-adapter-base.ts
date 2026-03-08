import { err, ok, Result } from 'neverthrow';
import type { MmaappssConfig } from '../common/config-helpers.js';
import { configHelpers } from '../common/config-helpers.js';
import { discoverMarketplaces } from '../common/discovery.js';
import { getLogger } from '../common/logger.js';
import type { SyncOutcome } from '../common/types.js';
import type { DefinedAgent } from './marketplaces-config.js';
import {
  SyncModeBase,
  type SyncModeContext,
  type SyncModeDefinition,
} from './sync-modes/sync-mode-base.js';

/** Fluent, fail-fast Result pipeline for adapter and mode lifecycle steps. */
class LifecycleChain {
  /** Accumulated lifecycle result that short-circuits on first error. */
  private current: Result<void, Error> = ok(undefined);
  /** Adapter instance whose lifecycle hooks are executed by adapter callbacks. */
  private readonly adapter: AgentAdapterBase;
  /** Sync mode instances executed sequentially for each sync-mode step. */
  private readonly syncModeInstances: SyncModeBase[];

  private constructor(adapter: AgentAdapterBase, syncModeInstances: SyncModeBase[]) {
    this.adapter = adapter;
    this.syncModeInstances = syncModeInstances;
  }

  /** Creates a new lifecycle chain bound to an adapter and sync mode instances. */
  static start(adapter: AgentAdapterBase, syncModeInstances: SyncModeBase[]): LifecycleChain {
    return new LifecycleChain(adapter, syncModeInstances);
  }

  /** Runs one adapter-level hook by passing the adapter instance to the callback (for api consistency with `runSyncModeHook`). */
  runAdapterHook(
    stepForAdapter: (adapter: AgentAdapterBase) => Result<void, Error>
  ): LifecycleChain {
    this.current = this.current.andThen(() => stepForAdapter(this.adapter));
    return this;
  }

  /** Runs one sync-mode step once per sync mode instance in order. */
  runSyncModeHook(
    stepForSyncMode: (syncMode: SyncModeBase) => Result<void, Error>
  ): LifecycleChain {
    this.current = this.current.andThen(() =>
      this.syncModeInstances.reduce(
        (result, syncMode) => result.andThen(() => stepForSyncMode(syncMode)),
        ok(undefined) as Result<void, Error>
      )
    );
    return this;
  }

  /** Finalizes the fluent chain as a single Result. */
  toResult(): Result<void, Error> {
    return this.current;
  }
}

/** Base adapter that orchestrates sync and clear lifecycle phases for one agent. */
export class AgentAdapterBase {
  /** Static agent definition resolved from marketplace configuration. */
  protected readonly agentConfig: DefinedAgent;
  /** Enabled sync mode instances for this adapter run. */
  private readonly syncModeInstances: SyncModeBase[];
  /** Mutable state shared across adapter and mode lifecycle steps. */
  private readonly sharedState: Map<string, unknown>;

  /** Creates one adapter instance for a resolved agent configuration. */
  constructor(agentConfig: DefinedAgent) {
    this.agentConfig = agentConfig;
    this.syncModeInstances = agentConfig.syncModes
      .filter((syncMode) => syncMode.enabled !== false)
      .map((syncMode: SyncModeDefinition) => new syncMode.modeClass(syncMode.options));
    this.sharedState = new Map<string, unknown>();
  }

  /** Hook before mode sync setup begins. */
  syncSetupBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after all mode sync setup steps complete. */
  syncSetupAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync run steps begin. */
  syncRunBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook when sync is enabled for this agent. */
  syncRunEnabled(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook when sync is disabled for this agent. */
  syncRunDisabled(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync run steps complete. */
  syncRunAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync teardown mode steps begin. */
  syncTeardownBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync teardown mode steps complete. */
  syncTeardownAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before mode clear setup begins. */
  clearSetupBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after all mode clear setup steps complete. */
  clearSetupAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear run steps begin. */
  clearRunBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear run steps complete. */
  clearRunAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear teardown mode steps begin. */
  clearTeardownBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear teardown mode steps complete. */
  clearTeardownAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Executes the full sync lifecycle for this adapter and its modes. */
  run(repoRoot: string, tsConfig: MmaappssConfig | null): Result<SyncOutcome, Error> {
    const enabled = configHelpers.general.getMarketplaceEnabled(
      repoRoot,
      tsConfig,
      this.agentConfig
    );
    const marketplaces = enabled ? discoverMarketplaces(repoRoot, tsConfig) : [];
    const context: SyncModeContext = {
      agentConfig: this.agentConfig,
      agentName: this.agentConfig.name,
      agentPolicy: this.agentConfig.policy,
      enabled,
      marketplaces,
      repoRoot,
      sharedState: this.sharedState,
      tsConfig,
    };
    getLogger().info({ agent: this.agentConfig.name, enabled }, 'adapter lifecycle run');

    const syncResult = LifecycleChain.start(this, this.syncModeInstances)
      .runAdapterHook((adapter) => adapter.syncSetupBefore(context))
      .runSyncModeHook((syncMode) => syncMode.syncSetupBefore(context))
      .runSyncModeHook((syncMode) => syncMode.syncSetupAfter(context))
      .runAdapterHook((adapter) => adapter.syncSetupAfter(context))
      .runAdapterHook((adapter) => adapter.syncRunBefore(context))
      .runSyncModeHook((syncMode) => syncMode.syncRunBefore(context))
      .runAdapterHook((adapter) =>
        enabled ? adapter.syncRunEnabled(context) : adapter.syncRunDisabled(context)
      )
      .runSyncModeHook((syncMode) =>
        enabled ? syncMode.syncRunEnabled(context) : syncMode.syncRunDisabled(context)
      )
      .runSyncModeHook((syncMode) => syncMode.syncRunAfter(context))
      .runAdapterHook((adapter) => adapter.syncRunAfter(context))
      .runAdapterHook((adapter) => adapter.syncTeardownBefore(context))
      .runSyncModeHook((syncMode) => syncMode.syncTeardownBefore(context))
      .runSyncModeHook((syncMode) => syncMode.syncTeardownAfter(context))
      .runAdapterHook((adapter) => adapter.syncTeardownAfter(context))
      .toResult();

    if (syncResult.isErr()) return err(syncResult.error);
    return ok({ agent: this.agentConfig.name, success: true });
  }

  /** Executes the full clear lifecycle for this adapter and its modes. */
  clear(repoRoot: string, tsConfig: MmaappssConfig | null): Result<SyncOutcome, Error> {
    const context: SyncModeContext = {
      agentConfig: this.agentConfig,
      agentName: this.agentConfig.name,
      agentPolicy: this.agentConfig.policy,
      enabled: false,
      marketplaces: [],
      repoRoot,
      sharedState: this.sharedState,
      tsConfig,
    };

    const clearResult = LifecycleChain.start(this, this.syncModeInstances)
      .runAdapterHook((adapter) => adapter.clearSetupBefore(context))
      .runSyncModeHook((syncMode) => syncMode.clearSetupBefore(context))
      .runSyncModeHook((syncMode) => syncMode.clearSetupAfter(context))
      .runAdapterHook((adapter) => adapter.clearSetupAfter(context))
      .runAdapterHook((adapter) => adapter.clearRunBefore(context))
      .runSyncModeHook((syncMode) => syncMode.clearRunBefore(context))
      .runSyncModeHook((syncMode) => syncMode.clearRun(context))
      .runSyncModeHook((syncMode) => syncMode.clearRunAfter(context))
      .runAdapterHook((adapter) => adapter.clearRunAfter(context))
      .runAdapterHook((adapter) => adapter.clearTeardownBefore(context))
      .runSyncModeHook((syncMode) => syncMode.clearTeardownBefore(context))
      .runSyncModeHook((syncMode) => syncMode.clearTeardownAfter(context))
      .runAdapterHook((adapter) => adapter.clearTeardownAfter(context))
      .toResult();

    if (clearResult.isErr()) return err(clearResult.error);
    return ok({ agent: this.agentConfig.name, success: true });
  }
}
