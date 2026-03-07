/**
 * Example TypeScript config. Copy to repo root as mmaappss.config.ts and adjust.
 * Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import type { MmaappssConfig } from './.agents/plugins/mmaappss/scripts/common/config-helpers.js';

export const mmaappssConfigExample = {
  marketplacesEnabled: {
    claude: true,
    cursor: true,
    codex: false,
  },
  excludeDirectories: ['node_modules', 'dist', '.turbo'],
  /** Set true to write structured logs to .mmaappss/logs/mmaappss.log (env MMAAPPSS_LOGGING_ENABLED overrides). */
  loggingEnabled: false,
} satisfies MmaappssConfig;
