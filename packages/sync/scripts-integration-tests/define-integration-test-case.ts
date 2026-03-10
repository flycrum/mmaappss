/**
 * Defines a single integration test case: config to inject and expected manifest JSON path.
 * Each test case file in test-cases/ exports testCase (config is available as testCase.config for stub injection).
 */

import type { MarketplacesConfig } from '../scripts/core/marketplaces-config.js';

export interface IntegrationTestCaseDefinition {
  /** Config object to inject as mmaappss.config.ts (result of defineMarketplacesConfig). */
  config: MarketplacesConfig;
  /** Short human-readable description of what this test case verifies. */
  description: string;
  /** Relative path to expected sync-manifest JSON file (e.g. 'test-cases/basic.json'). Same base name as the test file. */
  jsonPath: string;
}

/**
 * Helper to define a test case with config and path to expected manifest JSON.
 */
export function defineIntegrationTestCase(
  def: IntegrationTestCaseDefinition
): IntegrationTestCaseDefinition {
  return def;
}
