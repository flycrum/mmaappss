/**
 * Config loading: env (dotenv from root) + optional TypeScript config.
 * Precedence: process env overrides file; env overrides TS config.
 */

import { config as loadDotenv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DefinedAgent, MarketplacesConfig } from '../core/marketplaces-config.js';
import { marketplacesConfig } from '../core/marketplaces-config.js';
import { agentPresetsAll } from '../core/presets/agent-presets.js';
import { parseBool } from './parse-bool.js';
import type { Agent } from './types.js';

const DEFAULT_POST_MERGE_MARKETPLACES: Agent[] = ['claude', 'cursor', 'codex'];

/**
 * TypeScript config shape for mmaappss. Used by mmaappss.config.ts at repo root.
 */
export type MmaappssConfig = MarketplacesConfig;

/**
 * Namespaced config utilities for env loading, TS config, and marketplace enable flags.
 */
export const configHelpers = {
  /** General config resolution (enable flags, logging, etc.). */
  general: {
    /**
     * Resolve whether file logging is enabled. Env MMAAPPSS_LOGGING_ENABLED overrides TS config.
     */
    getLoggingEnabled(_root: string, tsConfig: MmaappssConfig | null): boolean {
      const envVal = process.env[configHelpers.env.VARS.ENV_LOGGING];
      const defaultVal = tsConfig?.loggingEnabled ?? false;
      return parseBool(envVal, defaultVal);
    },

    /**
     * Resolve whether post-merge sync is enabled (for git hook). Env MMAAPPSS_POST_MERGE_SYNC_ENABLED overrides TS config.
     */
    getPostMergeSyncEnabled(_root: string, tsConfig: MmaappssConfig | null): boolean {
      const envVal = process.env[configHelpers.env.VARS.ENV_POST_MERGE_SYNC];
      const defaultVal = tsConfig?.postMergeSyncEnabled ?? false;
      return parseBool(envVal, defaultVal);
    },

    /**
     * Resolve list of agents to sync in post-merge. Uses postMergeSyncMarketplaces from config; defaults to presetAgents if missing or invalid.
     */
    getPostMergeSyncMarketplaces(_root: string, tsConfig: MmaappssConfig | null): Agent[] {
      const raw = tsConfig?.postMergeSyncMarketplaces;
      if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_POST_MERGE_MARKETPLACES];
      const filtered = raw.filter((a): a is Agent => typeof a === 'string' && a.trim().length > 0);
      return filtered.length > 0 ? filtered : [...DEFAULT_POST_MERGE_MARKETPLACES];
    },

    /**
     * Resolve marketplace enable flags for a given agent.
     * Env overrides TS config; MMAAPPSS_MARKETPLACE_ALL acts as master switch.
     *
     * @param root - Repo root path (for env loading context)
     * @param tsConfig - Loaded mmaappss.config.ts or null
     * @param agent - Target coding agent
     * @returns Whether marketplace sync is enabled for that agent
     */
    getMarketplaceEnabled(
      _root: string,
      tsConfig: MmaappssConfig | null,
      agent: Agent | DefinedAgent
    ): boolean {
      const { VARS } = configHelpers.env;
      const allEnv = process.env[VARS.ENV_ALL];
      const agentName = typeof agent === 'string' ? agent : agent.name;
      const resolvedAgents = marketplacesConfig.resolveEnabledAgents(tsConfig);
      const defaultPer = Boolean(resolvedAgents[agentName]);
      const presetEnvVar = agentPresetsAll[agentName as keyof typeof agentPresetsAll]?.envVar;
      const envVar = typeof agent === 'object' && agent.envVar ? agent.envVar : presetEnvVar;
      const agentEnv = envVar ? process.env[envVar] : undefined;
      const allEnabled = parseBool(allEnv, true);
      const perEnabled = parseBool(agentEnv, defaultPer);
      return allEnabled && perEnabled;
    },
  },

  /** Env var loading and constant names. */
  env: {
    /** Env var names for marketplace enable/disable and logging. */
    VARS: {
      /** Master switch: MMAAPPSS_MARKETPLACE_ALL */
      ENV_ALL: 'MMAAPPSS_MARKETPLACE_ALL',
      /** Claude preset marketplace: MMAAPPSS_MARKETPLACE_CLAUDE */
      ENV_CLAUDE: 'MMAAPPSS_MARKETPLACE_CLAUDE',
      /** Cursor preset marketplace: MMAAPPSS_MARKETPLACE_CURSOR */
      ENV_CURSOR: 'MMAAPPSS_MARKETPLACE_CURSOR',
      /** Codex preset marketplace: MMAAPPSS_MARKETPLACE_CODEX */
      ENV_CODEX: 'MMAAPPSS_MARKETPLACE_CODEX',
      /** File logging: MMAAPPSS_LOGGING_ENABLED */
      ENV_LOGGING: 'MMAAPPSS_LOGGING_ENABLED',
      /** Post-merge sync (git hook): MMAAPPSS_POST_MERGE_SYNC_ENABLED */
      ENV_POST_MERGE_SYNC: 'MMAAPPSS_POST_MERGE_SYNC_ENABLED',
    } as const,
    /**
     * Load env from repo root (.env then .envrc.local).
     * Process env already set at runtime takes precedence over file values.
     *
     * @param root - Repo root path
     */
    loadEnv(root: string): void {
      loadDotenv({ path: path.join(root, '.env') });
      loadDotenv({ path: path.join(root, '.envrc.local'), override: true });
    },
  },

  /** TypeScript config file loading. */
  ts: {
    /**
     * Load env from root, then optionally load mmaappss.config.ts from root.
     *
     * @param root - Repo root path
     * @returns Config object or null if no mmaappss.config.ts exists
     */
    async loadConfig(root: string): Promise<MmaappssConfig | null> {
      configHelpers.env.loadEnv(root);
      const configPath = path.join(root, 'mmaappss.config.ts');
      try {
        // Cache-bust so overwritten config (e.g. in integration tests) is reloaded
        const fileUrl = `${pathToFileURL(configPath).href}?t=${Date.now()}`;
        const mod = await import(fileUrl);
        return (mod.default ?? mod) as MmaappssConfig;
      } catch (err) {
        if (fs.existsSync(configPath)) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(
            `[mmaappss] Could not load mmaappss.config.ts from ${configPath}: ${msg}. Using env/defaults only.`
          );
        }
        return null;
      }
    },
  },
};
