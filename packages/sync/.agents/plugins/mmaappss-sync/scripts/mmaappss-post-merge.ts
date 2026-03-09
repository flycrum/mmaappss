/**
 * Post-merge hook entrypoint: run marketplace sync only when postMergeSyncEnabled is true.
 * Invoke from .githooks/post-merge (or similar) so that after git pull/merge, marketplaces stay in sync.
 */

import type { MmaappssConfig } from './common/config-helpers.js';
import { configHelpers } from './common/config-helpers.js';
import { pathHelpers } from './common/path-helpers.js';
import { runSync } from './core/sync-runner.js';

async function main(): Promise<void> {
  let enabled = false;
  let tsConfig: MmaappssConfig | null = null;
  try {
    const repoRoot = pathHelpers.repoRoot;
    configHelpers.env.loadEnv(repoRoot);
    tsConfig = await configHelpers.ts.loadConfig(repoRoot);
    enabled = configHelpers.general.getPostMergeSyncEnabled(repoRoot, tsConfig);
  } catch (err) {
    console.error('Post-merge config error:', err);
    process.exit(1);
  }
  if (!enabled) {
    process.exit(0);
  }
  const repoRoot = pathHelpers.repoRoot;
  const marketplaces = configHelpers.general.getPostMergeSyncMarketplaces(repoRoot, tsConfig);
  const result = await runSync(marketplaces);
  if (result.isErr()) {
    console.error(result.error.stack ?? result.error);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error in mmaappss-post-merge', err);
  process.exit(1);
});
