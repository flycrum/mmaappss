/**
 * Excluded path test case: one excluded path; all presets plus one custom agent enabled.
 */

import { marketplacesConfig } from '../../scripts/core/marketplaces-config.js';
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
            syncBehaviorPresets: { ...agentPresets.codex.syncBehaviorPresets },
          }),
        },
      },
      excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
    })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'One excluded path; all presets plus one custom agent enabled.',
  jsonPath: 'test-cases/excluded-one-file.json',
});
