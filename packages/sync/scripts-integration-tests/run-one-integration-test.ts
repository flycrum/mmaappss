/**
 * Run a single integration test case by name.
 * Usage: tsx scripts-integration-tests/run-one-integration-test.ts <case-name>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathHelpers } from '../scripts/common/path-helpers.js';
import { runOneTestCase } from './integration-test-case-runner.js';

const TEST_CASES_DIR = 'test-cases';

async function main(): Promise<void> {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: tsx run-one-integration-test.ts <case-name>');
    process.exit(1);
  }

  const root = path.dirname(fileURLToPath(import.meta.url));
  const testCasesDir = path.join(root, TEST_CASES_DIR);
  const testCaseTsPath = path.join(testCasesDir, `${name}.ts`);
  const expectedManifestPath = path.join(testCasesDir, `${name}.json`);

  if (!fs.existsSync(testCaseTsPath)) {
    console.error('No such test case:', testCaseTsPath);
    process.exit(1);
  }

  const repoRoot = pathHelpers.repoRoot;
  const scriptsDir = path.join(pathHelpers.packageRoot, 'scripts');

  const result = await runOneTestCase({
    name,
    testCaseTsPath,
    expectedManifestPath,
    runClearFirst: true,
    repoRoot,
    scriptsDir,
  });

  if (result.passed) {
    console.log('PASS', name);
    process.exit(0);
  }
  console.log('FAIL', name);
  for (const err of result.errors) console.error('  ', err);
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err) : err);
  process.exit(1);
});
