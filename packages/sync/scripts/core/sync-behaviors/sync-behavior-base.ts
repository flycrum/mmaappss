import { ok, Result } from 'neverthrow';
import type { MmaappssConfig } from '../../common/config-helpers.js';
import type { SyncManifestEntry } from '../../common/sync-manifest.js';
import type {
  DiscoveredMarketplace,
  DiscoveredPlugin,
  PluginManifestKey,
} from '../../common/types.js';

/** Callback for a sync behavior to register into the unified sync manifest (options + customData or true). */
export type RegisterContentToSyncManifestFn = (
  agent: string,
  syncBehavior: string,
  entry: SyncManifestEntry
) => void;

/** Shared runtime context passed to every sync behavior hook invocation. */
export interface SyncBehaviorContext {
  /** Resolved agent configuration currently being executed. */
  agentConfig: {
    name: string;
  };
  /** Agent name convenience field for hook branching and logging. */
  agentName: string;
  /** Manifest key for the current behavior (used when calling registerContentToMmaappssSyncManifest). */
  currentBehaviorManifestKey?: string;
  /** Serializable options for the current behavior (for manifest entry.options). Set by adapter. */
  currentBehaviorOptionsForManifest?: Record<string, unknown>;
  /** Whether this adapter run is in enabled mode (`true`) or teardown mode (`false`). */
  enabled: boolean;
  /** Stored entry for this behavior when running clear (from unified sync manifest: options + customData or true). */
  manifestContent?: SyncManifestEntry;
  /** Marketplaces discovered for this run (empty during disabled/clear runs). */
  marketplaces: DiscoveredMarketplace[];
  /** Output root for all file writes (manifest, agent dirs, symlinks). Defaults to repoRoot when not set (e.g. MMAAPPSS_OUTPUT_ROOT or config.syncOutputRoot). */
  outputRoot: string;
  /** Register into the unified sync manifest (sync only; no-op when clearing). */
  registerContentToMmaappssSyncManifest: RegisterContentToSyncManifestFn;
  /** Repository root absolute path (config and discovery). */
  repoRoot: string;
  /** Mutable state bag shared across adapter and sync behaviors during one adapter lifetime. */
  sharedState: Map<string, unknown>;
  /** Loaded mmaappss config object when present. */
  tsConfig: MmaappssConfig | null;
}

/** Constructor signature for sync behavior classes instantiated by the adapter runtime. */
export interface SyncBehaviorClassRef<TOptions = unknown> {
  new (options: TOptions | undefined, ...args: unknown[]): SyncBehaviorBase<TOptions>;
}

/** Normalized sync behavior definition that binds a class to optional options and enabled flag. */
export interface SyncBehaviorDefinition<TOptions = unknown> {
  /** Disables this behavior definition when explicitly set to `false`. */
  enabled?: boolean;
  /** Behavior class constructor invoked by the adapter runtime. */
  behaviorClass: SyncBehaviorClassRef<TOptions>;
  /** Key used in unified sync manifest for this behavior (preset name or generated for custom). */
  manifestKey?: string;
  /** Optional behavior-specific options passed to the behavior constructor. */
  options?: TOptions;
}

/** Base class for sync behaviors with no-op lifecycle hooks that subclasses can override. */
export abstract class SyncBehaviorBase<TOptions = unknown> {
  /** Behavior options passed from config; undefined when no options were provided. */
  protected readonly options: TOptions | undefined;

  /** Creates a sync behavior instance with optional behavior options. */
  constructor(options?: TOptions) {
    this.options = options;
  }

  /** Checks whether a plugin advertises a given manifest capability key. */
  protected hasPluginManifest(plugin: DiscoveredPlugin, manifestKey?: PluginManifestKey): boolean {
    if (!manifestKey) return true;
    return plugin.manifests[manifestKey] === true;
  }

  /** Hook before sync setup begins. */
  syncSetupBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync setup completes. */
  syncSetupAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync run phase starts. */
  syncRunBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook for enabled sync run behavior. */
  syncRunEnabled(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook for disabled sync run behavior. */
  syncRunDisabled(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync run phase completes. */
  syncRunAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before sync teardown begins. */
  syncTeardownBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after sync teardown completes. */
  syncTeardownAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear setup begins. */
  clearSetupBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear setup completes. */
  clearSetupAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear run phase starts. */
  clearRunBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook for clear run behavior. */
  clearRun(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear run phase completes. */
  clearRunAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook before clear teardown begins. */
  clearTeardownBefore(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook after clear teardown completes. */
  clearTeardownAfter(_context: SyncBehaviorContext): Result<void, Error> {
    return ok(undefined);
  }
}
