#!/usr/bin/env node
/**
 * Bin entry for @mmaappss/sync. Runs all-agents marketplace sync with cwd = consumer root.
 * - Uses this package's tsx loader (file://) so sync works when linked: Node would otherwise
 *   resolve tsx from cwd (consumer), where it may not be installed.
 * - Sets MMAAPPSS_REPO_ROOT=cwd so path-helpers use the invocation directory as repo root when
 *   the package is symlinked (pnpm link); otherwise repo root would resolve to the link source.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(packageRoot, 'scripts/mmaappss-sync-all.ts');
const require = createRequire(import.meta.url);
const tsxLoader = require.resolve('tsx');

const result = spawnSync(process.execPath, ['--import', `file://${tsxLoader}`, scriptPath], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: { ...process.env, MMAAPPSS_REPO_ROOT: process.cwd() },
});
process.exit(result.status ?? 1);
