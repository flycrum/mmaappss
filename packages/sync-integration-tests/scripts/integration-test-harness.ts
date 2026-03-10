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

/** Count leading whitespace in a chalk-formatted string (strips ANSI codes first). */
function countLeadingSpacesFromFormatted(formatted: string): number {
  const ansi = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*m`, 'g');
  const plain = formatted.replace(ansi, '');
  return (plain.match(/^(\s*)/)?.[1] ?? '').length;
}

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

  console.log(chalk.cyan(`\n Integration test cases (${tsFiles.length})\n`));

  let passedCount = 0;
  let failedCount = 0;
  let totalErrorCount = 0;
  const maxLinesPerError = 10;
  const doShowCodeTicks = false;

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
      console.log(chalk.red('  ✗'), `${base} (${result.errors.length} errors)`);
      failedCount++;
      totalErrorCount += result.errors.length;

      // if (result.manifestDiff && result.errors.length > 0) {
      //   console.log(
      //     printLine.getFormatted(
      //       printLine.create('red', 4, `${base}: manifest diff (extra/missing/mismatched)`)
      //     )
      //   );
      // }

      for (const group of result.errors) {
        if (doShowCodeTicks) {
          console.log(printLine.getFormatted(printLine.create('dim', 4, '```')));
        }
        const limit = group.length <= maxLinesPerError ? group.length : maxLinesPerError - 1;
        for (let i = 0; i < limit; i++) {
          console.log(printLine.getFormatted(group[i]));
          if (group.length > maxLinesPerError && i === maxLinesPerError - 2) {
            const firstSkippedFormatted = printLine.getFormatted(group[maxLinesPerError - 1]);
            console.log(
              printLine.getFormatted(
                printLine.create(
                  'dim',
                  countLeadingSpacesFromFormatted(firstSkippedFormatted),
                  '...'
                )
              )
            );
          }
        }
        if (group.length > maxLinesPerError) {
          console.log(printLine.getFormatted(group[group.length - 1]));
        }
        if (doShowCodeTicks) {
          console.log(printLine.getFormatted(printLine.create('dim', 4, '```')));
        }
        console.log(printLine.getFormatted(printLine.create('dim', 4, '')));
      }
    }
  }

  console.log('');
  if (failedCount === 0) {
    console.log(chalk.green(` ${passedCount} passed\n`));
    process.exit(0);
  }
  const failedStr =
    totalErrorCount > 0
      ? ` ${failedCount} failed (${totalErrorCount} errors)`
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
