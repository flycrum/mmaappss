/**
 * Basic test case: all three preset agents enabled plus one minimal custom agent (codex-like).
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
    })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'All three preset agents enabled plus one minimal custom agent (codex-like).',
  jsonPath: 'test-cases/basic.json',
});
