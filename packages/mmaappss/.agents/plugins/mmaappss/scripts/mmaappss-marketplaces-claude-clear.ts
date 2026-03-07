/**
 * Clear (teardown) Claude local marketplace and rules.
 */

import { runClear } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runClear(['claude']);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error in mmaappss-marketplaces-claude-clear', err);
  process.exit(1);
});
