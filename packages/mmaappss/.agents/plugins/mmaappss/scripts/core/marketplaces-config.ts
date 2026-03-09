import type { Exact } from 'type-fest';
import type { PresetAgentName } from '../common/preset-agents.js';
import { presetAgents } from '../common/preset-agents.js';
import { agentPresets } from './presets/agent-presets.js';
import { syncModePresets } from './presets/sync-mode-presets.js';
import type { SyncModeClassRef, SyncModeDefinition } from './sync-modes/sync-mode-base.js';

/** Preset sync-mode names available in `syncModePresets`. */
export type SyncModePresetName = keyof typeof syncModePresets;

/** Options type for a sync mode preset (from its modeClass constructor first parameter). */
export type SyncModePresetOptions<K extends SyncModePresetName> = ConstructorParameters<
  (typeof syncModePresets)[K]['modeClass']
>[0];

/** Fully resolved agent definition used at runtime by the adapter runner. */
export interface DefinedAgent<TName extends string = string> {
  /** Optional env var key that controls this agent's enabled state. */
  envVar?: string;
  /** Runtime agent identifier. */
  name: TName;
  /** Ordered sync mode definitions used to construct sync mode instances. */
  syncModes: SyncModeDefinition[];
  /**
   * Modes to clear (tear down) at the start of sync when they were disabled in config.
   * Used so toggling e.g. rulesSymlink to false removes that mode's artifacts on the next sync.
   */
  syncModesToClear?: SyncModeDefinition[];
}

/** Helper shape passed to sync mode factory callbacks. */
interface SyncModeHelpers {
  /** Named sync mode presets that can be reused or extended in factories. */
  syncModePresets: typeof syncModePresets;
}

/** Factory callback that returns a sync mode definition, class ref, or disable signal. */
type SyncModeFactory = (
  helpers: SyncModeHelpers
) => false | SyncModeClassRef | SyncModeDefinition | (SyncModeDefinition & { enabled?: boolean });

/** Accepted value types for one sync mode preset override entry. */
type SyncModePresetValue =
  | boolean
  | SyncModeClassRef
  | SyncModeDefinition
  | (Partial<SyncModeDefinition> & { enabled?: boolean })
  | SyncModeFactory;

/** Per-preset value type so config object literals get options inference (e.g. folderTransforms callbacks). */
type SyncModePresetValueForKey<K extends SyncModePresetName> =
  | SyncModeDefinition<SyncModePresetOptions<K>>
  | (Partial<SyncModeDefinition<SyncModePresetOptions<K>>> & { enabled?: boolean })
  | boolean
  | SyncModeClassRef
  | SyncModeFactory;

/** Union of all per-preset value types (for resolveSyncModeEntry when receiving config values). */
type SyncModePresetValueFromConfig = {
  [K in SyncModePresetName]: SyncModePresetValueForKey<K>;
}[SyncModePresetName];

/** Discriminated union for syncModeCustom entries so options (e.g. processPluginFolderOrFile) get inferred from modeClass. */
type SyncModeCustomEntry = {
  [K in SyncModePresetName]: {
    modeClass: (typeof syncModePresets)[K]['modeClass'];
    options?: SyncModePresetOptions<K>;
    enabled?: boolean;
  };
}[SyncModePresetName];

/** Input accepted by `defineAgent` before the config is normalized. */
export interface DefineAgentInput<TName extends string = string> {
  /** Optional env var key for this agent. */
  envVar?: string;
  /** Agent name for lookup, logs, and outcomes. */
  name: TName;
  /** Additional custom sync modes appended after preset sync modes. */
  syncModeCustom?: Array<SyncModeCustomEntry | SyncModeClassRef | SyncModeFactory>;
  /** Optional per-preset sync-mode values for enable, replace, or partial override. */
  syncModePresets?: Partial<{ [K in SyncModePresetName]: SyncModePresetValueForKey<K> }>;
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
  /** Built-in sync mode presets available for composition and override. */
  syncModePresets: typeof syncModePresets;
}

/** Supported config input shape for each marketplacesEnabled agent entry. */
type AgentEntryInput<TName extends string = string> =
  | boolean
  | DefinedAgent<TName>
  | DefineAgentInput<TName>;

/** Top-level marketplaces enabled map for presets and custom agents. */
export interface MarketplacesEnabledConfig {
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
  /** Excluded path patterns used by discovery and sync modes. */
  excluded?: string[];
  /** Enables structured file logging when true. */
  loggingEnabled?: boolean;
  /** Agent enablement and override definitions. */
  marketplacesEnabled?: MarketplacesEnabledConfig;
  /** Enables post-merge sync hook behavior when true. */
  postMergeSyncEnabled?: boolean;
  /** Agent names to run during post-merge sync. */
  postMergeSyncMarketplaces?: string[];
}

/** Exact config input: only keys from MarketplacesConfig allowed (type-fest Exact). */
export type ExactMarketplacesConfigInput<T extends MarketplacesConfig> = Exact<
  MarketplacesConfig,
  T
>;

/** Type guard for sync mode class references (not factory callbacks). */
function isClassRef(value: unknown): value is SyncModeClassRef {
  return (
    typeof value === 'function' &&
    typeof (value as { prototype?: unknown }).prototype === 'object' &&
    (value as { prototype: Record<string, unknown> }).prototype !== null &&
    'syncRunEnabled' in (value as { prototype: Record<string, unknown> }).prototype
  );
}

/** Type guard for non-null object values. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Resolves one preset sync-mode entry into a normalized sync mode definition. */
function resolveSyncModeEntry(
  presetName: SyncModePresetName,
  rawValue: SyncModePresetValue | SyncModePresetValueFromConfig,
  helpers: SyncModeHelpers
): SyncModeDefinition | null {
  const value =
    typeof rawValue === 'function' && !isClassRef(rawValue) ? rawValue(helpers) : rawValue;
  if (value === false) return null;
  if (value === true) {
    return {
      modeClass: helpers.syncModePresets[presetName].modeClass as unknown as SyncModeClassRef,
    };
  }
  if (isClassRef(value)) return { modeClass: value };
  if (isObject(value) && 'modeClass' in value && isClassRef(value.modeClass)) {
    if (value.enabled === false) return null;
    return value as unknown as SyncModeDefinition;
  }
  if (isObject(value)) {
    if (value.enabled === false) return null;
    return {
      ...value,
      modeClass: helpers.syncModePresets[presetName].modeClass as unknown as SyncModeClassRef,
    } as unknown as SyncModeDefinition;
  }
  return null;
}

/** Resolves one custom sync-mode entry into a normalized sync mode definition. */
function resolveCustomSyncModeEntry(
  rawValue: SyncModeCustomEntry | SyncModeClassRef | SyncModeDefinition | SyncModeFactory,
  helpers: SyncModeHelpers
): SyncModeDefinition | null {
  const value =
    typeof rawValue === 'function' && !isClassRef(rawValue) ? rawValue(helpers) : rawValue;
  if (value === false) return null;
  if (isClassRef(value)) return { modeClass: value };
  if (isObject(value) && 'modeClass' in value && isClassRef(value.modeClass)) {
    if (value.enabled === false) return null;
    return value as unknown as SyncModeDefinition;
  }
  return null;
}

/** Type guard for already-resolved agent definitions. */
function isDefinedAgent(value: unknown): value is DefinedAgent {
  return isObject(value) && typeof value.name === 'string' && Array.isArray(value.syncModes);
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
    syncModePresets,
  };
}

/** Config factory and resolver APIs for marketplaces and agent definitions. */
export const marketplacesConfig = {
  /** Defines one agent with preset and custom sync mode composition. */
  defineAgent<const TName extends string>(
    input: DefineAgentInput<TName> | ((helpers: DefineAgentHelpers) => DefineAgentInput<TName>)
  ): DefinedAgent<TName> {
    const helpers = buildHelpers();
    const resolvedInput = typeof input === 'function' ? input(helpers) : input;
    const syncModes: SyncModeDefinition[] = [];

    const presetConfig = resolvedInput.syncModePresets ?? {};
    const syncModeHelpers: SyncModeHelpers = { syncModePresets };
    const syncModesToClear: SyncModeDefinition[] = [];

    for (const presetName of Object.keys(presetConfig) as SyncModePresetName[]) {
      const presetValue = presetConfig[presetName];
      if (presetValue === undefined) continue;
      if (presetValue === false) {
        // Only preset agents support default clearing; custom agents have no presetEntry so syncModesToClear is not populated for them.
        const presetAgent = agentPresets[resolvedInput.name as PresetAgentName];
        const presetEntry = presetAgent?.syncModePresets?.[presetName];
        if (presetEntry !== undefined && presetEntry !== false) {
          const cleared = resolveSyncModeEntry(presetName, presetEntry, syncModeHelpers);
          if (cleared) syncModesToClear.push(cleared);
        }
        continue;
      }
      const resolved = resolveSyncModeEntry(presetName, presetValue, syncModeHelpers);
      if (resolved) syncModes.push(resolved);
    }

    for (const customSyncMode of resolvedInput.syncModeCustom ?? []) {
      const resolved = resolveCustomSyncModeEntry(customSyncMode, syncModeHelpers);
      if (resolved) syncModes.push(resolved);
    }

    return {
      envVar: resolvedInput.envVar,
      name: resolvedInput.name,
      syncModes,
      ...(syncModesToClear.length > 0 ? { syncModesToClear } : {}),
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
        name: entry.name ?? entryName,
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
    const enabled = config?.marketplacesEnabled;
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
