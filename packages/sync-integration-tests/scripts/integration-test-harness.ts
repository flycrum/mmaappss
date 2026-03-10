/**
 * Integration test harness: clone sandbox-template to sandbox per case, run case(s), report with chalk (vitest-like).
 * Single entry point: no args = run all cases; one arg = run that case by name.
 *
 * Usage: tsx scripts/integration-test-harness.ts [case-name]
 * Run: pnpm -F @mmaappss/sync-integration-tests run test
 */

import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runOneTestCase } from './integration-test-case-runner.js';

const TEST_CASES_DIR = 'test-cases';

async function main(): Promise<void> {
  const caseNameArg = process.argv[2];
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const integrationTestsRoot = path.resolve(scriptDir, '..');
  const repoRoot = path.resolve(integrationTestsRoot, '..', '..');
  const sandboxPath = path.join(integrationTestsRoot, 'sandbox');
  const scriptsDir = path.join(integrationTestsRoot, '..', 'sync', 'scripts');
  const testCasesDir = path.join(scriptDir, TEST_CASES_DIR);

  if (!fs.existsSync(testCasesDir)) {
    console.error(chalk.red('test-cases directory missing:'), testCasesDir);
    process.exit(1);
  }
  if (!fs.existsSync(scriptsDir)) {
    console.error(chalk.red('sync scripts directory missing:'), scriptsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(testCasesDir);
  let tsFiles = files.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.startsWith('index')
  );

  if (caseNameArg) {
    const singleFile = `${caseNameArg}.ts`;
    if (!tsFiles.includes(singleFile)) {
      console.error(chalk.red('No such test case:'), path.join(testCasesDir, singleFile));
      process.exit(1);
    }
    tsFiles = [singleFile];
  }

  if (tsFiles.length === 0) {
    console.error(chalk.red('No test case files found in'), testCasesDir);
    process.exit(1);
  }

  console.log(chalk.cyan('\n Integration Tests\n'));
  let passedCount = 0;
  let failedCount = 0;

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
      outputRoot: sandboxPath,
      scriptsDir,
    });

    if (result.passed) {
      console.log(chalk.green('  ✓'), base);
      passedCount++;
    } else {
      console.log(chalk.red('  ✗'), base);
      failedCount++;
      for (const err of result.errors) {
        if (err.startsWith('  + ') || err.startsWith('  - ') || err.startsWith('  ~ ')) {
          if (err.startsWith('  + ')) console.log(chalk.green(err));
          else if (err.startsWith('  - ')) console.log(chalk.red(err));
          else console.log(chalk.yellow(err));
        } else {
          console.log(chalk.red('    '), err);
        }
      }
    }
  }

  console.log('');
  if (failedCount === 0) {
    console.log(chalk.green(` ${passedCount} passed\n`));
    process.exit(0);
  }
  console.log(chalk.red(` ${failedCount} failed`), chalk.gray(`, ${passedCount} passed\n`));
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err) : err);
  process.exit(1);
});
