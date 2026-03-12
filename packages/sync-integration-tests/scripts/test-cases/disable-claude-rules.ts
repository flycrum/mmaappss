/**
 * Disable Claude rules test case: claude with rulesSymlink disabled + one custom agent (codex-like); cursor and codex disabled.
 */

import { marketplacesConfig } from '@mmaappss/sync/config';
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
        custom: {
          testagent: defineAgent({
            ...agentPresets.codex,
            name: 'testagent',
          }),
        },
      },
    })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'Claude with rulesSymlink disabled plus one codex-like custom agent; cursor and codex disabled.',
  jsonPath: 'test-cases/disable-claude-rules.json',
});
