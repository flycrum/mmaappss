/**
 * Sync Claude Code local marketplace and rules.
 */

import { runSync } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runSync(['claude']);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
