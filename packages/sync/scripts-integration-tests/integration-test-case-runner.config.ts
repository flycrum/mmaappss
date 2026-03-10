/**
 * Integration test case runner: constants, helpers, and option/result types.
 * Single object export for use by integration-test-case-runner.ts.
 */

import path from 'node:path';
import type { SyncManifest } from '../scripts/common/sync-manifest.js';

export interface RunOneTestCaseOptions {
  /** Test case name (for logs). */
  name: string;
  /** Absolute path to the test case .ts file (so we can write a stub that imports it). */
  testCaseTsPath: string;
  /** Absolute path to expected manifest JSON file. */
  expectedManifestPath: string;
  /** Run clear before sync. */
  runClearFirst: boolean;
  /** Repo root (where mmaappss.config.ts lives). */
  repoRoot: string;
  /** Directory containing sync scripts (packages/sync/scripts). */
  scriptsDir: string;
}

export interface RunOneTestCaseResult {
  passed: boolean;
  errors: string[];
}

export const integrationTestCaseRunnerConfig = {
  CONSTANTS: {
    /** Repo-root config filename (stub written during test). */
    CONFIG_BACKUP_SUFFIX: '.integration-test-backup',
    /** Repo-root config filename. */
    CONFIG_FILE: 'mmaappss.config.ts',
  } as const,

  /**
   * Paths from manifest entries (symlinks, fsAutoRemoval, fsManualRemoval) that should exist after sync.
   */
  collectManifestPaths(manifest: SyncManifest, repoRoot: string): string[] {
    const out: string[] = [];
    for (const byBehavior of Object.values(manifest)) {
      for (const entry of Object.values(byBehavior)) {
        if (entry === true || typeof entry !== 'object') continue;
        for (const rel of entry.symlinks ?? []) {
          out.push(path.join(repoRoot, rel));
        }
        for (const rel of entry.fsAutoRemoval ?? []) {
          out.push(path.join(repoRoot, rel));
        }
        for (const rel of entry.fsManualRemoval ?? []) {
          out.push(path.join(repoRoot, rel));
        }
      }
    }
    return out;
  },
};
