import { ok, Result } from 'neverthrow';
import type { MmaappssConfig } from '../../common/config-helpers.js';
import type {
  DiscoveredMarketplace,
  DiscoveredPlugin,
  PluginManifestKey,
} from '../../common/types.js';
import type { AgentPolicy } from '../marketplaces-config.js';

/** Shared runtime context passed to every sync mode hook invocation. */
export interface SyncModeContext {
  /** Resolved agent configuration currently being executed. */
  agentConfig: {
    name: string;
  };
  /** Agent name convenience field for hook branching and logging. */
  agentName: string;
  /** Agent-level policy defaults used by generic sync mode logic. */
  agentPolicy?: AgentPolicy;
  /** Whether this adapter run is in enabled mode (`true`) or teardown mode (`false`). */
  enabled: boolean;
  /** Marketplaces discovered for this run (empty during disabled/clear runs). */
  marketplaces: DiscoveredMarketplace[];
  /** Repository root absolute path. */
  repoRoot: string;
  /** Mutable state bag shared across adapter and sync modes during one adapter lifetime. */
  sharedState: Map<string, unknown>;
  /** Loaded mmaappss config object when present. */
  tsConfig: MmaappssConfig | null;
}

/** Constructor signature for sync mode classes instantiated by the adapter runtime. */
export interface SyncModeClassRef<TOptions = unknown> {
  new (...args: unknown[]): SyncModeBase<TOptions>;
}

/** Normalized sync mode definition that binds a class to optional options and enabled flag. */
export interface SyncModeDefinition<TOptions = unknown> {
  /** Disables this mode definition when explicitly set to `false`. */
  enabled?: boolean;
  /** Mode class constructor invoked by the adapter runtime. */
  modeClass: SyncModeClassRef<TOptions>;
  /** Optional mode-specific options passed to the mode constructor. */
  options?: TOptions;
}

/** Base class for sync modes with no-op lifecycle hooks that subclasses can override. */
export abstract class SyncModeBase<TOptions = unknown> {
  /** Mode options passed from config; undefined when no options were provided. */
  protected readonly options: TOptions | undefined;

  /** Creates a sync mode instance with optional mode options. */
  constructor(options?: TOptions) {
    this.options = options;
  }

  /** Checks whether a plugin advertises a given manifest capability key. */
  protected hasPluginManifest(plugin: DiscoveredPlugin, manifestKey?: PluginManifestKey): boolean {
    if (!manifestKey) return true;
    return plugin.manifests[manifestKey] === true;
  }

  /** Hook before sync setup begins. */
  syncSetupBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync setup completes. */
  syncSetupAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync run phase starts. */
  syncRunBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook for enabled sync run behavior. */
  syncRunEnabled(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook for disabled sync run behavior. */
  syncRunDisabled(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync run phase completes. */
  syncRunAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync teardown begins. */
  syncTeardownBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync teardown completes. */
  syncTeardownAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear setup begins. */
  clearSetupBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear setup completes. */
  clearSetupAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear run phase starts. */
  clearRunBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook for clear run behavior. */
  clearRun(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear run phase completes. */
  clearRunAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear teardown begins. */
  clearTeardownBefore(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear teardown completes. */
  clearTeardownAfter(_context: SyncModeContext): Result<void, Error> {
    return ok(undefined);
  }
}

/** Named export wrapper for sync mode base class. */
export const syncModeBase = {
  SyncModeBase,
};
