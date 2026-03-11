/**
 * Example TypeScript config. Copy to repo root as mmaappss.config.ts and adjust.
 * Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import { marketplacesConfig } from './scripts/core/marketplaces-config.js';

const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig({
  agentsConfig: {
    claude: true,
    cursor: true,
    codex: true,
  },
  excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
});

export { mmaappssConfig };
export default mmaappssConfig;
