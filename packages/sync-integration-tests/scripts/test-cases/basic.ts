/**
 * Basic test case: all three preset agents enabled plus one custom agent (codex-like); sandbox plugins: root + nested.
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
  description:
    'All three preset agents plus one codex-like custom agent; discovery limited to sandbox (root + nested plugins).',
  jsonPath: 'test-cases/basic.json',
});
