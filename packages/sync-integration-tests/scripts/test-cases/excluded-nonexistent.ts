/**
 * Excluded non-existent path: excluded ['.agents/plugins/does-not-exist'] should be harmless.
 */

import { marketplacesConfig } from '@mmaappss/sync/config';
import { defineIntegrationTestCase } from '../define-integration-test-case.js';

const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(
  ({ config, defineAgent, agentPresets }) =>
    config({
      agentsConfig: {
        claude: true,
        cursor: true,
        codex: true,
        custom: {
          testagent: defineAgent({
            ...agentPresets.codex,
            name: 'testagent',
          }),
        },
      },
      excluded: ['.agents/plugins/does-not-exist'],
    })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'Excluded non-existent path; sync unchanged.',
  jsonPath: 'test-cases/excluded-nonexistent.json',
});
