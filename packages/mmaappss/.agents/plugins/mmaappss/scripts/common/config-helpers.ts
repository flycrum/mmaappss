/**
 * Config loading: env (dotenv from root) + optional TypeScript config.
 * Precedence: process env overrides file; env overrides TS config.
 */

import { config as loadDotenv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseBool } from './parse-bool.js';

/**
 * TypeScript config shape for mmaappss. Used by mmaappss.config.ts at repo root.
 */
export interface MmaappssConfig {
  /** Enable all marketplaces ('all') or per-agent flags. Env (MMAAPPSS_MARKETPLACE_*) overrides. */
  marketplacesEnabled?:
    | 'all'
    | {
        claude: boolean;
        cursor: boolean;
        codex: boolean;
      };
  /** Paths or globs to exclude from scanning .agents/plugins (future: plugin names, file paths). */
  excludeDirectories?: string[];
}

/**
 * Namespaced config utilities for env loading, TS config, and marketplace enable flags.
 */
export const configHelpers = {
  /** General config resolution (enable flags, etc.). */
  general: {
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
      root: string,
      tsConfig: MmaappssConfig | null,
      agent: 'claude' | 'cursor' | 'codex'
    ): boolean {
      const { VARS } = configHelpers.env;
      const allEnv = process.env[VARS.ENV_ALL];
      const agentEnv =
        agent === 'claude'
          ? process.env[VARS.ENV_CLAUDE]
          : agent === 'cursor'
            ? process.env[VARS.ENV_CURSOR]
            : process.env[VARS.ENV_CODEX];

      const enabled = tsConfig?.marketplacesEnabled;
      const defaultPer =
        enabled === 'all'
          ? true
          : enabled && typeof enabled === 'object'
            ? (enabled[agent] ?? false)
            : false;
      const allEnabled = parseBool(allEnv, true);
      const perEnabled = parseBool(agentEnv, defaultPer);
      return allEnabled && perEnabled;
    },
  },
  /** Env var loading and constant names. */
  env: {
    /** Env var names for marketplace enable/disable. */
    VARS: {
      /** Master switch: MMAAPPSS_MARKETPLACE_ALL */
      ENV_ALL: 'MMAAPPSS_MARKETPLACE_ALL',
      /** Claude marketplace: MMAAPPSS_MARKETPLACE_CLAUDE */
      ENV_CLAUDE: 'MMAAPPSS_MARKETPLACE_CLAUDE',
      /** Cursor marketplace: MMAAPPSS_MARKETPLACE_CURSOR */
      ENV_CURSOR: 'MMAAPPSS_MARKETPLACE_CURSOR',
      /** Codex marketplace: MMAAPPSS_MARKETPLACE_CODEX */
      ENV_CODEX: 'MMAAPPSS_MARKETPLACE_CODEX',
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
        const fileUrl = pathToFileURL(configPath).href;
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
