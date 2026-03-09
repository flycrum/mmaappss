#!/usr/bin/env node
/**
 * Bin entry for @mmaappss/sync. Runs all-agents marketplace sync with cwd = consumer root.
 * Requires tsx (bundled as dependency) to run the TypeScript sync script.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(packageRoot, 'scripts/mmaappss-sync-all.ts');

const result = spawnSync(process.execPath, ['--import', 'tsx', scriptPath], {
  stdio: 'inherit',
  cwd: process.cwd(),
});
process.exit(result.status ?? 1);
