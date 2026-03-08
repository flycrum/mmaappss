/**
 * Clear (teardown) all marketplace sync state for Claude, Cursor, and Codex.
 */

import { presetAgents } from './common/preset-agents.js';
import { runClear } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runClear([...presetAgents]);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err instanceof Error ? err.message : String(err));
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
