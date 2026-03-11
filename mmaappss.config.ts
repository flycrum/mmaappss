/**
 * Root mmaappss config. Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 * Integration test sandboxes are excluded so sync does not pick up fake plugins.
 */

import { marketplacesConfig } from './packages/sync/scripts/core/marketplaces-config.js';

const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(({ config, defineAgent }) =>
  config({
    agentsConfig: {
      claude: false,
      cursor: true,
      codex: true,
      custom: {
        superagent: defineAgent({
          name: 'superagent',
          syncBehaviorPresets: {
            localMarketplaceSync: true,
          },
        }),
      },
    },
    excluded: ['packages/sync-integration-tests/sandboxes'],
  })
);

export default mmaappssConfig;
