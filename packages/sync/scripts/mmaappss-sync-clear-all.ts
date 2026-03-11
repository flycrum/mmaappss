/**
 * Clear (teardown) all marketplace sync state.
 * Uses union of preset agents, config-enabled agents, and agents in the existing manifest.
 */

import chalk from 'chalk';
import { runClear } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runClear();
  if (result.isErr()) {
    console.error(chalk.red('Clear failed:'), result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(chalk.red('Unexpected error:'), err instanceof Error ? err.message : String(err));
  if (err instanceof Error && err.stack) console.error(chalk.dim(err.stack));
  process.exit(1);
});
