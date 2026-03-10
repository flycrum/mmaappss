/**
 * Consumer TypeScript config. Copy to repo root as mmaappss.config.ts.
 * Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import { marketplacesConfig } from '@mmaappss/sync/config';

const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig({
  agentsConfig: {
    claude: true,
    cursor: true,
    codex: true,
  },
  // excluded: [],
  // loggingEnabled: true,
  // postMergeSyncEnabled: true,
});

export default mmaappssConfig;
