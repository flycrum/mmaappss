import type { Exact } from 'type-fest';
import type { PresetAgentName } from '../common/preset-agents.js';
import { presetAgents } from '../common/preset-agents.js';
import { agentPresets } from './presets/agent-presets.js';
import { syncBehaviorPresets } from './presets/sync-behavior-presets.js';
import type {
  SyncBehaviorClassRef,
  SyncBehaviorDefinition,
} from './sync-behaviors/sync-behavior-base.js';

/** Preset sync-behavior names available in `syncBehaviorPresets`. */
export type SyncBehaviorPresetName = keyof typeof syncBehaviorPresets;

/** Options type for a sync behavior preset (from its behaviorClass constructor first parameter). */
export type SyncBehaviorPresetOptions<K extends SyncBehaviorPresetName> = ConstructorParameters<
  (typeof syncBehaviorPresets)[K]['behaviorClass']
>[0];

/** Fully resolved agent definition used at runtime by the adapter runner. */
export interface DefinedAgent<TName extends string = string> {
  /** Optional env var key that controls this agent's enabled state. */
  envVar?: string;
  /** Runtime agent identifier. */
  name: TName;
  /** Ordered sync behavior definitions used to construct sync behavior instances. */
  syncBehaviors: SyncBehaviorDefinition[];
  /**
   * Behaviors to clear (tear down) at the start of sync when they were disabled in config.
   * Used so toggling e.g. rulesSymlink to false removes that behavior's artifacts on the next sync.
   */
  syncBehaviorsToClear?: SyncBehaviorDefinition[];
}

/** Helper shape passed to sync behavior factory callbacks. */
interface SyncBehaviorHelpers {
  /** Named sync behavior presets that can be reused or extended in factories. */
  syncBehaviorPresets: typeof syncBehaviorPresets;
}

/** Factory callback that returns a sync behavior definition, class ref, or disable signal. */
type SyncBehaviorFactory = (
  helpers: SyncBehaviorHelpers
) =>
  | false
  | SyncBehaviorClassRef
  | SyncBehaviorDefinition
  | (SyncBehaviorDefinition & { enabled?: boolean });

/** Accepted value types for one sync behavior preset override entry. */
type SyncBehaviorPresetValue =
  | boolean
  | SyncBehaviorClassRef
  | SyncBehaviorDefinition
  | (Partial<SyncBehaviorDefinition> & { enabled?: boolean })
  | SyncBehaviorFactory;

/** Per-preset value type so config object literals get options inference (e.g. folderTransforms callbacks). */
type SyncBehaviorPresetValueForKey<K extends SyncBehaviorPresetName> =
  | SyncBehaviorDefinition<SyncBehaviorPresetOptions<K>>
  | (Partial<SyncBehaviorDefinition<SyncBehaviorPresetOptions<K>>> & { enabled?: boolean })
  | boolean
  | SyncBehaviorClassRef
  | SyncBehaviorFactory;

/** Union of all per-preset value types (for resolveSyncBehaviorEntry when receiving config values). */
type SyncBehaviorPresetValueFromConfig = {
  [K in SyncBehaviorPresetName]: SyncBehaviorPresetValueForKey<K>;
}[SyncBehaviorPresetName];

/** Discriminated union for syncBehaviorCustom entries so options (e.g. processPluginFolderOrFile) get inferred from behaviorClass. */
type SyncBehaviorCustomEntry = {
  [K in SyncBehaviorPresetName]: {
    behaviorClass: (typeof syncBehaviorPresets)[K]['behaviorClass'];
    options?: SyncBehaviorPresetOptions<K>;
    enabled?: boolean;
  };
}[SyncBehaviorPresetName];

/** Input accepted by `defineAgent` before the config is normalized. */
export interface DefineAgentInput<TName extends string = string> {
  /** Optional env var key for this agent. */
  envVar?: string;
  /** Agent name for lookup, logs, and outcomes. */
  name: TName;
  /** Additional custom sync behaviors appended after preset sync behaviors. */
  syncBehaviorCustom?: Array<SyncBehaviorCustomEntry | SyncBehaviorClassRef | SyncBehaviorFactory>;
  /** Optional per-preset sync-behavior values for enable, replace, or partial override. */
  syncBehaviorPresets?: Partial<{
    [K in SyncBehaviorPresetName]: SyncBehaviorPresetValueForKey<K>;
  }>;
}

/** Helper object passed to high-level config factories (`defineMarketplacesConfig`, `defineAgent`). Exported so config files get full type-safety and go-to-definition. */
export interface DefineAgentHelpers {
  /** Built-in agent presets available for composition and override. */
  agentPresets: typeof agentPresets;
  /** Wrapper to enforce exact config keys; use as `helpers.config({ ... })` in defineMarketplacesConfig callbacks. */
  config: typeof exactMarketplacesConfig;
  /** Factory for producing a strongly typed and normalized agent definition. */
  defineAgent: <const TName extends string>(
    input: DefineAgentInput<TName> | ((helpers: DefineAgentHelpers) => DefineAgentInput<TName>)
  ) => DefinedAgent<TName>;
  /** Built-in sync behavior presets available for composition and override. */
  syncBehaviorPresets: typeof syncBehaviorPresets;
}

/** Supported config input shape for each agentsConfig agent entry. */
type AgentEntryInput<TName extends string = string> =
  | boolean
  | DefinedAgent<TName>
  | DefineAgentInput<TName>;

/** Top-level agents config map for presets and custom agents. */
export interface AgentsConfig {
  /** Claude preset entry: `true` for default, `false` for disabled, or an override object. */
  claude?: AgentEntryInput<'claude'>;
  /** Codex preset entry: `true` for default, `false` for disabled, or an override object. */
  codex?: AgentEntryInput<'codex'>;
  /** Cursor preset entry: `true` for default, `false` for disabled, or an override object. */
  cursor?: AgentEntryInput<'cursor'>;
  /** Arbitrary custom agents keyed by custom agent name. */
  custom?: Record<string, AgentEntryInput>;
}

/** Full mmaappss config shape used by `defineMarketplacesConfig`. */
export interface MarketplacesConfig {
  /** Agent enablement and override definitions. */
  agentsConfig?: AgentsConfig;
  /** Excluded path patterns used by discovery and sync behaviors. */
  excluded?: string[];
  /** Enables structured file logging when true. */
  loggingEnabled?: boolean;
  /** Enables post-merge sync hook behavior when true. */
  postMergeSyncEnabled?: boolean;
  /** Agent names to run during post-merge sync. */
  postMergeSyncMarketplaces?: string[];
  /** Optional path for unified sync manifest (default `.mmaappss/sync-manifest.json`). */
  syncManifestPath?: string;
  /** Optional output root for all sync writes (manifest, agent dirs, symlinks). When set, discovery and config still use repo root. */
  syncOutputRoot?: string;
}

/** Exact config input: only keys from MarketplacesConfig allowed (type-fest Exact). */
export type ExactMarketplacesConfigInput<T extends MarketplacesConfig> = Exact<
  MarketplacesConfig,
  T
>;

/** Type guard for sync behavior class references (not factory callbacks). */
function isClassRef(value: unknown): value is SyncBehaviorClassRef {
  return (
    typeof value === 'function' &&
    typeof (value as { prototype?: unknown }).prototype === 'object' &&
    (value as { prototype: Record<string, unknown> }).prototype !== null &&
    'syncRunEnabled' in (value as { prototype: Record<string, unknown> }).prototype
  );
}

/** Type guard for non-null object values. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Resolves one preset sync-behavior entry into a normalized sync behavior definition. */
function resolveSyncBehaviorEntry(
  presetName: SyncBehaviorPresetName,
  rawValue: SyncBehaviorPresetValue | SyncBehaviorPresetValueFromConfig,
  helpers: SyncBehaviorHelpers
): SyncBehaviorDefinition | null {
  const value =
    typeof rawValue === 'function' && !isClassRef(rawValue) ? rawValue(helpers) : rawValue;
  if (value === false) return null;
  if (value === true) {
    return {
      behaviorClass: helpers.syncBehaviorPresets[presetName]
        .behaviorClass as unknown as SyncBehaviorClassRef,
      manifestKey: presetName,
    };
  }
  if (isClassRef(value)) return { behaviorClass: value, manifestKey: presetName };
  if (isObject(value) && 'behaviorClass' in value && isClassRef(value.behaviorClass)) {
    if (value.enabled === false) return null;
    return {
      ...(value as SyncBehaviorDefinition),
      manifestKey: presetName,
    } as SyncBehaviorDefinition;
  }
  if (isObject(value)) {
    if (value.enabled === false) return null;
    return {
      ...value,
      behaviorClass: helpers.syncBehaviorPresets[presetName]
        .behaviorClass as unknown as SyncBehaviorClassRef,
      manifestKey: presetName,
    } as unknown as SyncBehaviorDefinition;
  }
  return null;
}

/** Resolves one custom sync-behavior entry into a normalized sync behavior definition. */
function resolveCustomSyncBehaviorEntry(
  rawValue:
    | SyncBehaviorCustomEntry
    | SyncBehaviorClassRef
    | SyncBehaviorDefinition
    | SyncBehaviorFactory,
  helpers: SyncBehaviorHelpers
): SyncBehaviorDefinition | null {
  const value =
    typeof rawValue === 'function' && !isClassRef(rawValue) ? rawValue(helpers) : rawValue;
  if (value === false) return null;
  if (isClassRef(value)) return { behaviorClass: value };
  if (isObject(value) && 'behaviorClass' in value && isClassRef(value.behaviorClass)) {
    if (value.enabled === false) return null;
    return value as unknown as SyncBehaviorDefinition;
  }
  return null;
}

/** Type guard for already-resolved agent definitions. */
function isDefinedAgent(value: unknown): value is DefinedAgent {
  return isObject(value) && typeof value.name === 'string' && Array.isArray(value.syncBehaviors);
}

/**
 * Wraps config so only keys from MarketplacesConfig are allowed (excess properties are a type error).
 * Callback form uses (helpers, config) => config({ ... }) so config is in parameter position and exact keys are enforced.
 */
export function exactMarketplacesConfig<T extends MarketplacesConfig>(
  config: ExactMarketplacesConfigInput<T>
): T {
  return config as T;
}

/** Creates helper utilities passed into config factory callbacks. */
function buildHelpers(): DefineAgentHelpers {
  return {
    agentPresets,
    config: exactMarketplacesConfig,
    defineAgent: marketplacesConfig.defineAgent,
    syncBehaviorPresets,
  };
}

/** Config factory and resolver APIs for marketplaces and agent definitions. */
export const marketplacesConfig = {
  /** Defines one agent with preset and custom sync behavior composition. */
  defineAgent<const TName extends string>(
    input: DefineAgentInput<TName> | ((helpers: DefineAgentHelpers) => DefineAgentInput<TName>)
  ): DefinedAgent<TName> {
    const helpers = buildHelpers();
    const resolvedInput = typeof input === 'function' ? input(helpers) : input;
    const syncBehaviors: SyncBehaviorDefinition[] = [];

    const presetConfig = resolvedInput.syncBehaviorPresets ?? {};
    const syncBehaviorHelpers: SyncBehaviorHelpers = { syncBehaviorPresets };
    const syncBehaviorsToClear: SyncBehaviorDefinition[] = [];

    for (const presetName of Object.keys(presetConfig) as SyncBehaviorPresetName[]) {
      const presetValue = presetConfig[presetName];
      if (presetValue === undefined) continue;
      if (presetValue === false) {
        // Only preset agents support default clearing; custom agents have no presetEntry so syncBehaviorsToClear is not populated for them.
        const presetAgent = agentPresets[resolvedInput.name as PresetAgentName];
        const presetEntry = presetAgent?.syncBehaviorPresets?.[presetName];
        if (presetEntry !== undefined && presetEntry !== false) {
          const cleared = resolveSyncBehaviorEntry(presetName, presetEntry, syncBehaviorHelpers);
          if (cleared) syncBehaviorsToClear.push(cleared);
        }
        continue;
      }
      const resolved = resolveSyncBehaviorEntry(presetName, presetValue, syncBehaviorHelpers);
      if (resolved) syncBehaviors.push(resolved);
    }

    let customIndex = 0;
    for (const customSyncBehavior of resolvedInput.syncBehaviorCustom ?? []) {
      const resolved = resolveCustomSyncBehaviorEntry(customSyncBehavior, syncBehaviorHelpers);
      if (resolved) {
        syncBehaviors.push({
          ...resolved,
          manifestKey: resolved.manifestKey ?? `custom_${customIndex}`,
        });
        customIndex += 1;
      }
    }

    return {
      envVar: resolvedInput.envVar,
      name: resolvedInput.name,
      syncBehaviors,
      ...(syncBehaviorsToClear.length > 0 ? { syncBehaviorsToClear } : {}),
    };
  },

  /**
   * Defines the top-level marketplaces config.
   * Object form: enforces exact keys (no excess properties).
   * Callback form: () => ({ ... }) or (helpers) => ({ ... }) or (helpers, config) => config({ ... }).
   * TReturn extends Exact<MarketplacesConfig, TReturn> so callback return with excess keys is a type error.
   */
  defineMarketplacesConfig<
    const TConfig extends MarketplacesConfig,
    TReturn extends Exact<MarketplacesConfig, TReturn> = MarketplacesConfig,
  >(
    input:
      | ExactMarketplacesConfigInput<TConfig>
      | (() => TReturn)
      | ((helpers: DefineAgentHelpers) => TReturn)
  ): TConfig extends (...args: unknown[]) => unknown ? MarketplacesConfig : TConfig {
    const helpers = buildHelpers();
    const result = typeof input === 'function' ? input(helpers) : input;
    return result as unknown as TConfig extends (...args: unknown[]) => unknown
      ? MarketplacesConfig
      : TConfig;
  },

  /** Resolves one agent entry (boolean, input object, or resolved definition) into a runtime agent definition. */
  resolveAgentConfig(entryName: string, entry: AgentEntryInput): DefinedAgent | null {
    if (entry === false) return null;
    if (entry === true) {
      const preset = agentPresets[entryName as keyof typeof agentPresets];
      if (!preset) return null;
      return marketplacesConfig.defineAgent(preset);
    }
    if (isDefinedAgent(entry)) {
      return {
        ...entry,
        name: entry.name,
      };
    }
    return marketplacesConfig.defineAgent({
      ...(entry as DefineAgentInput),
      name: ((entry as DefineAgentInput).name ?? entryName) as string,
    });
  },

  /** Resolves all enabled preset and custom agents into a runtime lookup map. */
  resolveEnabledAgents(config: MarketplacesConfig | null): Record<string, DefinedAgent> {
    const out: Record<string, DefinedAgent> = {};
    const enabled = config?.agentsConfig;
    if (!enabled) return out;

    const presetNames: PresetAgentName[] = [...presetAgents];
    for (const presetName of presetNames) {
      const entry = enabled[presetName];
      if (entry === undefined) continue;
      const resolved = marketplacesConfig.resolveAgentConfig(presetName, entry);
      if (resolved) out[resolved.name] = resolved;
    }

    for (const [customName, customEntry] of Object.entries(enabled.custom ?? {})) {
      const resolved = marketplacesConfig.resolveAgentConfig(customName, customEntry);
      if (resolved) out[resolved.name] = resolved;
    }

    return out;
  },
};

/** First parameter type of defineAgent; use for typing preset records so they are compile-time compatible. */
export type DefineAgentFirstParameter = Parameters<typeof marketplacesConfig.defineAgent>[0];
