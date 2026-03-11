/**
 * Config loading: TypeScript config when present; otherwise env (dotenv from root).
 * When mmaappss.config.ts exists and loads, env files are not loaded and env vars do not override.
 */

import chalk from 'chalk';
import { config as loadDotenv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DefinedAgent, MarketplacesConfig } from '../core/marketplaces-config.js';
import { marketplacesConfig } from '../core/marketplaces-config.js';
import { agentPresets } from '../core/presets/agent-presets.js';
import { parseBool } from './parse-bool.js';
import { presetAgents } from './preset-agents.js';
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
     * Resolve whether file logging is enabled. When TS config is present, only TS is used; otherwise env.
     */
    getLoggingEnabled(_root: string, tsConfig: MmaappssConfig | null): boolean {
      if (tsConfig !== null) return tsConfig.loggingEnabled ?? false;
      const envVal = process.env[configHelpers.env.VARS.ENV_LOGGING];
      return parseBool(envVal, false);
    },

    /**
     * Resolve whether post-merge sync is enabled (for git hook). When TS config is present, only TS is used; otherwise env.
     */
    getPostMergeSyncEnabled(_root: string, tsConfig: MmaappssConfig | null): boolean {
      if (tsConfig !== null) return tsConfig.postMergeSyncEnabled ?? false;
      const envVal = process.env[configHelpers.env.VARS.ENV_POST_MERGE_SYNC];
      return parseBool(envVal, false);
    },

    /**
     * Resolve list of agents to sync in post-merge. Uses postMergeSyncMarketplaces from config; defaults to presetAgents if missing or invalid.
     * Only agent names that runSync can resolve (preset names or custom agents from agentsConfig) pass; others are dropped.
     */
    getPostMergeSyncMarketplaces(_root: string, tsConfig: MmaappssConfig | null): Agent[] {
      const raw = tsConfig?.postMergeSyncMarketplaces;
      if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_POST_MERGE_MARKETPLACES];
      const enabled = marketplacesConfig.resolveEnabledAgents(tsConfig);
      const knownAgents = new Set<string>([...Object.keys(enabled), ...presetAgents]);
      const filtered = raw
        .map((a) => (typeof a === 'string' ? a.trim() : ''))
        .filter((s): s is Agent => s.length > 0 && knownAgents.has(s));
      return filtered.length > 0 ? filtered : [...DEFAULT_POST_MERGE_MARKETPLACES];
    },

    /**
     * Resolve marketplace enable flags for a given agent.
     * When TS config is present, only TS config is used; otherwise env vars apply.
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
      const agentName = typeof agent === 'string' ? agent : agent.name;
      const resolvedAgents = marketplacesConfig.resolveEnabledAgents(tsConfig);
      if (tsConfig !== null) return Boolean(resolvedAgents[agentName]);
      const { VARS } = configHelpers.env;
      const allEnv = process.env[VARS.ENV_ALL];
      const defaultPer = Boolean(resolvedAgents[agentName]);
      const presetEnvVar = (agentPresets as Record<string, { envVar?: string }>)[agentName]?.envVar;
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
     * Load mmaappss.config.ts from root only. Does not load .env; callers load env when this returns null.
     *
     * @param root - Repo root path
     * @returns Config object or null if no mmaappss.config.ts exists or load failed
     */
    async loadConfig(root: string): Promise<MmaappssConfig | null> {
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
            chalk.cyan('[mmaappss]'),
            chalk.yellow(
              `Could not load mmaappss.config.ts from ${configPath}: ${msg}. Using env/defaults only.`
            )
          );
        }
        return null;
      }
    },
  },
};
