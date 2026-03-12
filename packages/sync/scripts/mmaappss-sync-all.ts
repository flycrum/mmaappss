/**
 * Master sync: run sync for all enabled agents and clear for disabled agents.
 * Uses union of preset agents, config-enabled agents, and agents in the existing manifest.
 */

import chalk from 'chalk';
import { runSync } from './core/sync-runner.js';

async function main(): Promise<void> {
  const result = await runSync();
  if (result.isErr()) {
    console.error(chalk.red('Sync failed:'), result.error.message);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(chalk.red('Unexpected error in mmaappss-sync-all'), err);
  process.exit(1);
});
