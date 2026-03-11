/**
 * Integration test case runner: constants, helpers, and option/result types.
 */

import type { SyncManifest } from '@mmaappss/sync/sync-manifest';
import path from 'node:path';
import type { PrintLine } from './utils/print-line.js';

export interface RunOneTestCaseOptions {
  /** Path to the expected manifest JSON file. */
  expectedManifestPath: string;
  /** When true, do not delete the output root on failure (harness renames it to failed-${name}). */
  keepSandboxOnFailure?: boolean;
  /** Test case name (used for logging and error messages). */
  name: string;
  /** Output root (active sandbox, e.g. sandboxes/.tests/current) where sync writes. */
  outputRoot: string;
  /** Monorepo root (config and discovery). */
  repoRoot: string;
  /** True if the clear script should be run first. */
  runClearFirst: boolean;
  /** Path to the scripts directory. */
  scriptsDir: string;
  /** Path to the test case TS file. */
  testCaseTsPath: string;
}

export interface RunOneTestCaseResult {
  /** One logical error = array of output lines. Grouped so harness can cap lines per error. */
  errors: PrintLine[][];
  /** Manifest diff report (added/removed/modified paths). Omitted when passed or when only error groups are tracked. */
  manifestDiff?: { added: string[]; removed: string[]; modified: string[] };
  /** True if no errors were found. */
  passed: boolean;
}

export const integrationTestCaseRunnerConfig = {
  CONSTANTS: {
    /** Suffix for the backup config file. */
    CONFIG_BACKUP_SUFFIX: '.integration-test-backup',
    /** Path to the config file. */
    CONFIG_FILE: 'mmaappss.config.ts',
  } as const,

  /** Collects all manifest paths (symlinks, fsAutoRemoval, fsManualRemoval). */
  collectManifestPaths(manifest: SyncManifest, outputRoot: string): string[] {
    const out: string[] = [];
    for (const byBehavior of Object.values(manifest)) {
      for (const entry of Object.values(byBehavior)) {
        if (entry === true || typeof entry !== 'object') continue;
        for (const rel of entry.symlinks ?? []) {
          out.push(path.join(outputRoot, rel));
        }
        for (const rel of entry.fsAutoRemoval ?? []) {
          out.push(path.join(outputRoot, rel));
        }
        for (const rel of entry.fsManualRemoval ?? []) {
          out.push(path.join(outputRoot, rel));
        }
      }
    }
    return out;
  },
};
