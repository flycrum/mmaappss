/**
 * Integration test harness: clone sandbox-template to sandboxes/.tests/current per case, run case(s), report with chalk (vitest-like).
 * On failure, renames current to failed-${name} for inspection. Clears .tests/ at start.
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
const SANDBOXES_DIR = 'sandboxes';
const TESTS_SUBDIR = '.tests';
const CURRENT_SANDBOX_NAME = 'current';

/** Count leading whitespace in a chalk-formatted string (strips ANSI codes first). */
function countLeadingSpacesFromFormatted(formatted: string): number {
  const ansi = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*m`, 'g');
  const plain = formatted.replace(ansi, '');
  return (plain.match(/^(\s*)/)?.[1] ?? '').length;
}

/** Remove sandboxes/.tests/ so runs start fresh. */
function clearTestsDir(sandboxesRoot: string): void {
  const testsDir = path.join(sandboxesRoot, TESTS_SUBDIR);
  if (fs.existsSync(testsDir)) {
    fs.rmSync(testsDir, { recursive: true });
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const caseNameArg = argv.find((a) => a !== '--');
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const integrationTestsRoot = path.resolve(scriptDir, '..');
  const sandboxesRoot = path.join(integrationTestsRoot, SANDBOXES_DIR);
  const currentSandboxPath = path.join(sandboxesRoot, TESTS_SUBDIR, CURRENT_SANDBOX_NAME);
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

  // clear before running tests so we start fresh, ensure prestine environment, and ensure that `.tests` reflects recently run test cases
  clearTestsDir(sandboxesRoot);

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
    const testCaseBasename = path.basename(file, '.ts');
    const testCaseTsPath = path.join(testCasesDir, file);
    const expectedManifestPath = path.join(testCasesDir, testCaseBasename + '.json');

    const result = await runOneTestCase({
      name: testCaseBasename,
      testCaseTsPath,
      expectedManifestPath,
      runClearFirst: true,
      repoRoot: currentSandboxPath,
      outputRoot: currentSandboxPath,
      scriptsDir,
      keepSandboxOnFailure: true,
    });

    if (result.passed) {
      console.log(chalk.green('  ✓'), testCaseBasename);
      passedCount++;
    } else {
      console.log(chalk.red('  ✗'), `${testCaseBasename} (${result.errors.length} errors)`);
      failedCount++;
      totalErrorCount += result.errors.length;

      const failedDir = path.join(sandboxesRoot, TESTS_SUBDIR, `failed-${testCaseBasename}`);
      if (fs.existsSync(currentSandboxPath)) {
        try {
          fs.mkdirSync(path.dirname(failedDir), { recursive: true });
          fs.renameSync(currentSandboxPath, failedDir);
        } catch (e) {
          console.error(
            chalk.yellow(
              `  (could not rename current to failed-${testCaseBasename}: ${(e as Error).message})`
            )
          );
        }
      }

      // if (result.manifestDiff && result.errors.length > 0) {
      //   console.log(
      //     printLine.getFormatted(
      //       printLine.create('red', 4, `${testCaseBasename}: manifest diff (extra/missing/mismatched)`)
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
