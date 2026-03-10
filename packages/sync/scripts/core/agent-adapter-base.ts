import { err, ok, Result } from 'neverthrow';
import type { MmaappssConfig } from '../common/config-helpers.js';
import { configHelpers } from '../common/config-helpers.js';
import { discoverMarketplaces } from '../common/discovery.js';
import { getLogger } from '../common/logger.js';
import type { SyncManifestEntry } from '../common/sync-manifest.js';
import type { SyncOutcome } from '../common/types.js';
import type { DefinedAgent } from './marketplaces-config.js';
import {
  SyncBehaviorBase,
  type RegisterContentToSyncManifestFn,
  type SyncBehaviorContext,
  type SyncBehaviorDefinition,
} from './sync-behaviors/sync-behavior-base.js';

export interface RunOptions {
  /** Stored entry per behavior for this agent (used when enabled is false for syncRunDisabled). */
  manifestByBehavior?: Record<string, SyncManifestEntry>;
  /** Output root for all file writes (defaults to repoRoot when not set). */
  outputRoot?: string;
  /** Register into the unified sync manifest (sync only; no-op when clearing). */
  registerContentToMmaappssSyncManifest?: RegisterContentToSyncManifestFn;
}

export interface ClearOptions {
  /** Per–sync-behavior stored entry from unified manifest for this agent. */
  manifestByBehavior?: Record<string, SyncManifestEntry>;
  /** Output root for teardown paths (defaults to repoRoot when not set). */
  outputRoot?: string;
}

/** JSON-serializable clone of behavior options for manifest (drops functions and non-JSON values). */
function serializeOptionsForManifest(options: unknown): Record<string, unknown> {
  if (options == null) return {};
  try {
    const cloned = JSON.parse(JSON.stringify(options));
    return typeof cloned === 'object' && cloned !== null && !Array.isArray(cloned) ? cloned : {};
  } catch {
    return {};
  }
}

/** Fluent, fail-fast Result pipeline for adapter and behavior lifecycle steps. */
class LifecycleChain {
  /** Accumulated lifecycle result that short-circuits on first error. */
  private current: Result<void, Error> = ok(undefined);
  /** Adapter instance whose lifecycle hooks are executed by adapter callbacks. */
  private readonly adapter: AgentAdapterBase;
  /** Sync behavior instances executed sequentially for each sync-behavior step. */
  private readonly syncBehaviorInstances: SyncBehaviorBase[];

  private constructor(adapter: AgentAdapterBase, syncBehaviorInstances: SyncBehaviorBase[]) {
    this.adapter = adapter;
    this.syncBehaviorInstances = syncBehaviorInstances;
  }

  /** Creates a new lifecycle chain bound to an adapter and sync behavior instances. */
  static start(
    adapter: AgentAdapterBase,
    syncBehaviorInstances: SyncBehaviorBase[]
  ): LifecycleChain {
    return new LifecycleChain(adapter, syncBehaviorInstances);
  }

  /** Runs one adapter-level hook by passing the adapter instance to the callback (for api consistency with `runSyncBehaviorHook`). */
  runAdapterHook(
    stepForAdapter: (adapter: AgentAdapterBase) => Result<void, Error>
  ): LifecycleChain {
    this.current = this.current.andThen(() => stepForAdapter(this.adapter));
    return this;
  }

  /** Runs one sync-behavior step once per sync behavior instance in order; step receives (instance, index). */
  runSyncBehaviorHook(
    stepForSyncBehavior: (syncBehavior: SyncBehaviorBase, index: number) => Result<void, Error>
  ): LifecycleChain {
    this.current = this.current.andThen(() =>
      this.syncBehaviorInstances.reduce(
        (result, syncBehavior, index) =>
          result.andThen(() => stepForSyncBehavior(syncBehavior, index)),
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
  /** Enabled sync behavior instances for this adapter run. */
  private readonly syncBehaviorInstances: SyncBehaviorBase[];
  /** Instances for behaviors that are disabled in config; we run their clearRun at start of sync to tear down artifacts. */
  private readonly syncBehaviorsToClearInstances: SyncBehaviorBase[];
  /** Mutable state shared across adapter and behavior lifecycle steps. */
  private readonly sharedState: Map<string, unknown>;

  /** Creates one adapter instance for a resolved agent configuration. */
  constructor(agentConfig: DefinedAgent) {
    this.agentConfig = agentConfig;
    this.syncBehaviorInstances = agentConfig.syncBehaviors
      .filter((syncBehavior) => syncBehavior.enabled !== false)
      .map(
        (syncBehavior: SyncBehaviorDefinition) =>
          new syncBehavior.behaviorClass(syncBehavior.options)
      );
    this.syncBehaviorsToClearInstances = (agentConfig.syncBehaviorsToClear ?? []).map(
      (def: SyncBehaviorDefinition) => new def.behaviorClass(def.options)
    );
    this.sharedState = new Map<string, unknown>();
  }

  /** Hook before behavior sync setup begins. */
  syncSetupBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after all behavior sync setup steps complete. */
  syncSetupAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync run steps begin. */
  syncRunBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook when sync is enabled for this agent. */
  syncRunEnabled(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook when sync is disabled for this agent. */
  syncRunDisabled(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync run steps complete. */
  syncRunAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync teardown behavior steps begin. */
  syncTeardownBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync teardown behavior steps complete. */
  syncTeardownAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before behavior clear setup begins. */
  clearSetupBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after all behavior clear setup steps complete. */
  clearSetupAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear run steps begin. */
  clearRunBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear run steps complete. */
  clearRunAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear teardown behavior steps begin. */
  clearTeardownBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear teardown behavior steps complete. */
  clearTeardownAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Executes the full sync lifecycle for this adapter and its behaviors. */
  run(
    repoRoot: string,
    tsConfig: MmaappssConfig | null,
    options?: RunOptions
  ): Result<SyncOutcome, Error> {
    const enabled = configHelpers.general.getMarketplaceEnabled(
      repoRoot,
      tsConfig,
      this.agentConfig
    );
    const marketplaces = enabled ? discoverMarketplaces(repoRoot, tsConfig) : [];
    const noopRegister: RegisterContentToSyncManifestFn = () => {};
    const context: SyncBehaviorContext = {
      agentConfig: this.agentConfig,
      agentName: this.agentConfig.name,
      enabled,
      marketplaces,
      outputRoot: options?.outputRoot ?? repoRoot,
      registerContentToMmaappssSyncManifest:
        options?.registerContentToMmaappssSyncManifest ?? noopRegister,
      repoRoot,
      sharedState: this.sharedState,
      tsConfig,
    };
    getLogger().info({ agent: this.agentConfig.name, enabled }, 'adapter lifecycle run');

    const manifestByBehavior = options?.manifestByBehavior ?? {};
    if (enabled && this.syncBehaviorsToClearInstances.length > 0) {
      const clearContext: SyncBehaviorContext = {
        ...context,
        enabled: false,
        marketplaces: [],
      };
      const defs = this.agentConfig.syncBehaviorsToClear ?? [];
      for (let i = 0; i < this.syncBehaviorsToClearInstances.length; i++) {
        const def = defs[i];
        const key = def?.manifestKey ?? `custom_clear_${i}`;
        (clearContext as SyncBehaviorContext & { manifestContent?: unknown }).manifestContent =
          manifestByBehavior[key];
        const clearResult = this.syncBehaviorsToClearInstances[i]!.clearRun(clearContext);
        if (clearResult.isErr()) return err(clearResult.error);
      }
    }

    const setBehaviorContext = (index: number): void => {
      const def = this.agentConfig.syncBehaviors[index];
      const key = def?.manifestKey ?? `custom_${index}`;
      (
        context as SyncBehaviorContext & { currentBehaviorManifestKey?: string }
      ).currentBehaviorManifestKey = key;
      (
        context as SyncBehaviorContext & {
          currentBehaviorOptionsForManifest?: Record<string, unknown>;
        }
      ).currentBehaviorOptionsForManifest = serializeOptionsForManifest(def?.options);
      (context as SyncBehaviorContext & { manifestContent?: unknown }).manifestContent =
        manifestByBehavior[key];
    };

    const syncResult = LifecycleChain.start(this, this.syncBehaviorInstances)
      .runAdapterHook((adapter) => adapter.syncSetupBefore(context))
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.syncSetupBefore(context);
      })
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.syncSetupAfter(context);
      })
      .runAdapterHook((adapter) => adapter.syncSetupAfter(context))
      .runAdapterHook((adapter) => adapter.syncRunBefore(context))
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.syncRunBefore(context);
      })
      .runAdapterHook((adapter) =>
        enabled ? adapter.syncRunEnabled(context) : adapter.syncRunDisabled(context)
      )
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return enabled ? sb.syncRunEnabled(context) : sb.syncRunDisabled(context);
      })
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.syncRunAfter(context);
      })
      .runAdapterHook((adapter) => adapter.syncRunAfter(context))
      .runAdapterHook((adapter) => adapter.syncTeardownBefore(context))
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.syncTeardownBefore(context);
      })
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.syncTeardownAfter(context);
      })
      .runAdapterHook((adapter) => adapter.syncTeardownAfter(context))
      .toResult();

    if (syncResult.isErr()) return err(syncResult.error);
    return ok({ agent: this.agentConfig.name, success: true });
  }

  /** Executes the full clear lifecycle for this adapter and its behaviors. */
  clear(
    repoRoot: string,
    tsConfig: MmaappssConfig | null,
    options?: ClearOptions
  ): Result<SyncOutcome, Error> {
    const manifestByBehavior = options?.manifestByBehavior ?? {};
    const noopRegister: RegisterContentToSyncManifestFn = () => {};
    const context: SyncBehaviorContext = {
      agentConfig: this.agentConfig,
      agentName: this.agentConfig.name,
      enabled: false,
      marketplaces: [],
      outputRoot: options?.outputRoot ?? repoRoot,
      registerContentToMmaappssSyncManifest: noopRegister,
      repoRoot,
      sharedState: this.sharedState,
      tsConfig,
    };

    const setBehaviorContext = (index: number): void => {
      const def = this.agentConfig.syncBehaviors[index];
      const key = def?.manifestKey ?? `custom_${index}`;
      (
        context as SyncBehaviorContext & { currentBehaviorManifestKey?: string }
      ).currentBehaviorManifestKey = key;
      (
        context as SyncBehaviorContext & {
          currentBehaviorOptionsForManifest?: Record<string, unknown>;
        }
      ).currentBehaviorOptionsForManifest = serializeOptionsForManifest(def?.options);
      (context as SyncBehaviorContext & { manifestContent?: unknown }).manifestContent =
        manifestByBehavior[key];
    };

    const clearResult = LifecycleChain.start(this, this.syncBehaviorInstances)
      .runAdapterHook((adapter) => adapter.clearSetupBefore(context))
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.clearSetupBefore(context);
      })
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.clearSetupAfter(context);
      })
      .runAdapterHook((adapter) => adapter.clearSetupAfter(context))
      .runAdapterHook((adapter) => adapter.clearRunBefore(context))
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.clearRunBefore(context);
      })
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.clearRun(context);
      })
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.clearRunAfter(context);
      })
      .runAdapterHook((adapter) => adapter.clearRunAfter(context))
      .runAdapterHook((adapter) => adapter.clearTeardownBefore(context))
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.clearTeardownBefore(context);
      })
      .runSyncBehaviorHook((sb, i) => {
        setBehaviorContext(i);
        return sb.clearTeardownAfter(context);
      })
      .runAdapterHook((adapter) => adapter.clearTeardownAfter(context))
      .toResult();

    if (clearResult.isErr()) return err(clearResult.error);
    return ok({ agent: this.agentConfig.name, success: true });
  }
}
