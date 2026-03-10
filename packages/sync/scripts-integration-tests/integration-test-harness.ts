/**
 * Integration test harness: loops over test cases in test-cases/, runs clear then sync per case,
 * asserts manifest shape and that all registered paths exist.
 *
 * Usage: tsx scripts-integration-tests/integration-test-harness.ts
 * Run: pnpm -F @mmaappss/sync run test:integrations
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathHelpers } from '../scripts/common/path-helpers.js';
import { runOneTestCase } from './integration-test-case-runner.js';

const TEST_CASES_DIR = 'test-cases';

async function main(): Promise<void> {
  const repoRoot = pathHelpers.repoRoot;
  const scriptsDir = path.join(pathHelpers.packageRoot, 'scripts');
  const integrationTestDir = path.dirname(fileURLToPath(import.meta.url));
  const testCasesDir = path.join(integrationTestDir, TEST_CASES_DIR);

  if (!fs.existsSync(testCasesDir)) {
    console.error('test-cases directory missing:', testCasesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(testCasesDir);
  const tsFiles = files.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.startsWith('index')
  );

  if (tsFiles.length === 0) {
    console.error('No test case files found in', testCasesDir);
    process.exit(1);
  }

  let allPassed = true;
  for (const file of tsFiles.sort()) {
    const base = path.basename(file, '.ts');
    const testCaseTsPath = path.join(testCasesDir, file);
    const expectedManifestPath = path.join(testCasesDir, base + '.json');

    const result = await runOneTestCase({
      name: base,
      testCaseTsPath,
      expectedManifestPath,
      runClearFirst: true,
      repoRoot,
      scriptsDir,
    });

    if (result.passed) {
      console.log('PASS', base);
    } else {
      console.log('FAIL', base);
      for (const err of result.errors) console.error('  ', err);
      allPassed = false;
    }
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err) : err);
  process.exit(1);
});
