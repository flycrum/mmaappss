/**
 * Example TypeScript config. Copy to repo root as mmaappss.config.ts and adjust.
 * Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import type { MmaappssConfig } from './.agents/plugins/mmaappss/scripts/common/config-helpers.js';

export const mmaappssConfigExample = {
  marketplaceAll: true,
  marketplaceClaude: true,
  marketplaceCursor: true,
  marketplaceCodex: false,
  excludeDirectories: ['node_modules', 'dist', '.turbo'],
} satisfies MmaappssConfig;
