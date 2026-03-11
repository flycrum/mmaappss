/**
 * Exclude plugin by path: excluded ['.agents/plugins/root'] (sandbox root plugin).
 * Root plugin content should be absent from cursor and claude manifests.
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
      excluded: ['.agents/plugins/root'],
    })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'Exclude plugin by path .agents/plugins/root; assert root plugin content removed.',
  jsonPath: 'test-cases/excluded-plugin-git-path.json',
});
