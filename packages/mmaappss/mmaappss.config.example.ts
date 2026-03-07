/**
 * Example TypeScript config. Copy to repo root as mmaappss.config.ts and adjust.
 * Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import type { MmaappssConfig } from './.agents/plugins/mmaappss/scripts/common/config-helpers.js';

export const mmaappssConfigExample = {
  /** Enable all marketplaces (Claude, Cursor, Codex). */
  marketplacesEnabled: 'all',
  /** Per-agent: enable/disable specific marketplaces. */
  // marketplacesEnabled: {
  //   claude: true,
  //   cursor: true,
  //   codex: false,
  // },
  // excluded: ['node_modules', 'dist', '.turbo'],
  // excluded: ['.agents/plugins/git'],
  // excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
  // excluded: ['**/git/**'],
  // loggingEnabled: true,
  // postMergeSyncEnabled: true,
} satisfies MmaappssConfig;
