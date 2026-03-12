/**
 * Disabled test case: all preset agents disabled (no custom).
 * Ensures sync runs and produces an empty manifest (all agent entries cleared).
 */

import { marketplacesConfig } from '@mmaappss/sync/config';
import { defineIntegrationTestCase } from '../define-integration-test-case.js';

const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(({ config }) =>
  config({
    agentsConfig: {
      claude: false,
      cursor: false,
      codex: false,
    },
  })
);

export const testCase = defineIntegrationTestCase({
  config: mmaappssConfig,
  description: 'All preset agents disabled; manifest should have no agent entries.',
  jsonPath: 'test-cases/disabled.json',
});
