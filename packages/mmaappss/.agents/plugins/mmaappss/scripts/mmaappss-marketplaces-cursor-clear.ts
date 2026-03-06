/**
 * Clear (teardown) Cursor local marketplace and rules.
 */

import { runClear } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runClear(['cursor']);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
