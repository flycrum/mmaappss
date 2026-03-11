/**
 * Excluded path test case: one excluded path (sandbox); all presets enabled.
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
      excluded: ['.cursor/commands/root/root-hello.md'],
    })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'One excluded path (sandbox root plugin command); all presets enabled.',
  jsonPath: 'test-cases/excluded-one-file.json',
});
