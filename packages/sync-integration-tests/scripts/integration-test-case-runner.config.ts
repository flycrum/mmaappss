/**
 * Integration test case runner: constants, helpers, and option/result types.
 */

import type { SyncManifest } from '@mmaappss/sync/sync-manifest';
import path from 'node:path';

export interface RunOneTestCaseOptions {
  name: string;
  testCaseTsPath: string;
  expectedManifestPath: string;
  runClearFirst: boolean;
  /** Monorepo root (config and discovery). */
  repoRoot: string;
  /** Output root (sandbox) where sync writes. */
  outputRoot: string;
  scriptsDir: string;
}

export interface RunOneTestCaseResult {
  passed: boolean;
  errors: string[];
  manifestDiff?: { added: string[]; removed: string[]; modified: string[] };
}

export const integrationTestCaseRunnerConfig = {
  CONSTANTS: {
    CONFIG_BACKUP_SUFFIX: '.integration-test-backup',
    CONFIG_FILE: 'mmaappss.config.ts',
  } as const,

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
