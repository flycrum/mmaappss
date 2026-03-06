/**
 * Clear (teardown) Codex AGENTS.override.md section.
 */

import { runClear } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runClear(['codex']);
  if (result.isErr()) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
