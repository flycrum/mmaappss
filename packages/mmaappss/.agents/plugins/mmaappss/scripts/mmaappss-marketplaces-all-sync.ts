/**
 * Master sync: run all marketplace syncs (Claude, Cursor, Codex).
 */

import { runSync } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runSync(['claude', 'cursor', 'codex']);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
