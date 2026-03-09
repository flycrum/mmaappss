/**
 * Master sync: run all marketplace syncs (Claude, Cursor, Codex).
 */

import { presetAgents } from './common/preset-agents.js';
import { runSync } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runSync([...presetAgents]);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error in mmaappss-marketplaces-all-sync', err);
  process.exit(1);
});
