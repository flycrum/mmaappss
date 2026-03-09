/**
 * Path utilities for mmaappss sync scripts. Resolves package and repo roots from this module's location.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _scriptDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Namespaced path utilities. Paths are derived from this module's location under packages/sync/scripts/common.
 */
export const pathHelpers = {
  /** Directory of this path-helpers module (scripts/common). */
  get scriptDir(): string {
    return _scriptDir;
  },
  /** packages/sync — the @mmaappss/sync package root. */
  get packageRoot(): string {
    return path.resolve(_scriptDir, '..', '..');
  },
  /**
   * Repo root: uses MMAAPPSS_REPO_ROOT when set (bin sets it to cwd so linked installs use the
   * consumer repo; otherwise package location is used (node_modules → consumer root, or monorepo).
   */
  get repoRoot(): string {
    if (process.env.MMAAPPSS_REPO_ROOT) {
      return path.resolve(process.env.MMAAPPSS_REPO_ROOT);
    }
    return pathHelpers.resolveRepoRootFromPackageRoot(pathHelpers.packageRoot);
  },
  /**
   * Resolve repo root from a package root path. When packageRoot contains node_modules, returns the directory that contains that node_modules; otherwise returns packageRoot/../..
   * Exposed for testing.
   */
  resolveRepoRootFromPackageRoot(packageRoot: string): string {
    const normalized = packageRoot.replace(/\\/g, '/');
    if (normalized.includes('/node_modules/')) {
      const parts = normalized.split('/node_modules/');
      return path.resolve(parts[0]!);
    }
    return path.resolve(packageRoot, '..', '..');
  },
};
