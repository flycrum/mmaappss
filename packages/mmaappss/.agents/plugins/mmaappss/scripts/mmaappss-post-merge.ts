/**
 * Post-merge hook entrypoint: run marketplace sync only when postMergeSyncEnabled is true.
 * Invoke from .githooks/post-merge (or similar) so that after git pull/merge, marketplaces stay in sync.
 */

import { configHelpers } from './common/config-helpers.js';
import { pathHelpers } from './common/path-helpers.js';
import { runSync } from './core/sync-runner.js';

async function main(): Promise<void> {
  let enabled = false;
  try {
    const repoRoot = pathHelpers.repoRoot;
    configHelpers.env.loadEnv(repoRoot);
    const tsConfig = await configHelpers.ts.loadConfig(repoRoot);
    enabled = configHelpers.general.getPostMergeSyncEnabled(repoRoot, tsConfig);
  } catch (err) {
    console.error('Post-merge config error:', err);
    process.exit(1);
  }
  if (!enabled) {
    process.exit(0);
  }
  const result = await runSync(['claude', 'cursor', 'codex']);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error in mmaappss-post-merge', err);
  process.exit(1);
});
