/**
 * Disable Claude rules test case: claude only with rulesSymlink disabled; cursor and codex disabled.
 */

import { marketplacesConfig } from '../../scripts/core/marketplaces-config.js';
import { defineIntegrationTestCase } from '../define-integration-test-case.js';

const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(
  ({ config, defineAgent, agentPresets }) =>
    config({
      agentsConfig: {
        claude: defineAgent({
          ...agentPresets.claude,
          name: 'claude',
          syncBehaviorPresets: {
            ...agentPresets.claude.syncBehaviorPresets,
            rulesSymlink: false,
          },
        }),
        cursor: false,
        codex: false,
      },
    })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'Claude only with rulesSymlink disabled; cursor and codex disabled.',
  jsonPath: 'test-cases/disable-claude-rules.json',
});
