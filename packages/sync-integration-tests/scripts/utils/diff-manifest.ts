/**
 * Recursive manifest diff: compares expected vs actual at every depth (keys and values).
 * Stops descending when a key is added/removed or a value is modified to avoid noisy output.
 * Object key order is ignored; array order is significant.
 */

import {
  compareAtDepth,
  type ManifestDiffReport,
  type RunDiffOptions,
} from './diff-manifest.config.js';

export type { ManifestDiffReport, RunDiffOptions };

/**
 * Recursively diff expected vs actual manifest (any depth).
 * At each depth compares keys (added/removed) and values (modified); does not special-case levels.
 * Object key order is ignored; array element order is significant.
 * Stops descending under a key once that key is reported as added, removed, or modified.
 *
 * @param expected - Expected manifest (or subtree)
 * @param actual - Actual manifest (or subtree)
 * @param options - structureOnly: only compare keys (added/removed), never report modified
 * @returns Report with dot/bracket paths: added (in actual only), removed (in expected only), modified (same path, different value)
 */
export const diffManifest = {
  run(expected: unknown, actual: unknown, options?: RunDiffOptions): ManifestDiffReport {
    const structureOnly = options?.structureOnly ?? false;
    const report: ManifestDiffReport = { added: [], removed: [], modified: [] };
    compareAtDepth(expected, actual, '', report, structureOnly);
    return report;
  },
};
