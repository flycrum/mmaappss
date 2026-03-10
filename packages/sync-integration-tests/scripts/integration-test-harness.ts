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
import { printLine } from './utils/print-line.js';

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

  console.log(chalk.cyan('\n Integration tests\n'));
  let passedCount = 0;
  let failedCount = 0;
  let errorLines = 0;
  let totalErrors = 0;

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
      errorLines += result.errorLines.length;
      if (result.errorCount !== undefined) totalErrors += result.errorCount;
      for (const err of result.errorLines) {
        console.log(printLine.getFormatted(err));
      }
    }
  }

  console.log('');
  if (failedCount === 0) {
    console.log(chalk.green(` ${passedCount} passed\n`));
    process.exit(0);
  }
  const failedStr =
    totalErrors > 0
      ? ` ${failedCount} failed (${totalErrors} errors${errorLines > 0 ? `, ${errorLines} lines` : ''})`
      : errorLines > 0
        ? ` ${failedCount} failed (${errorLines} lines)`
        : ` ${failedCount} failed`;
  console.log(
    chalk.cyan('test-cases:'),
    chalk.red(failedStr),
    chalk.gray(`, ${passedCount} passed\n`)
  );
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err) : err);
  process.exit(1);
});
