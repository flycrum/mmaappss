/**
 * Sync Cursor local marketplace and rules.
 */

import { runSync } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runSync(['cursor']);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
