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

main().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.message);
    if (err.stack) console.error(err.stack);
  } else {
    console.error(String(err));
  }
  process.exit(1);
});
