/**
 * Path utilities for mmaappss sync scripts. Resolves package and repo roots from this module's location.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _scriptDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Namespaced path utilities. Paths are derived from this module's location under packages/mmaappss/.agents/plugins/mmaappss/scripts/common.
 */
export const pathHelpers = {
  /** Directory of this path-helpers module (scripts/common). */
  get scriptDir(): string {
    return _scriptDir;
  },
  /** packages/mmaappss — the mmaappss package root. */
  get packageRoot(): string {
    return path.resolve(_scriptDir, '..', '..', '..', '..', '..');
  },
  /** Monorepo root (parent of packages/). */
  get repoRoot(): string {
    return path.resolve(pathHelpers.packageRoot, '..', '..');
  },
};
