/**
 * File system assertions: compare sandbox contents to manifest paths.
 * Positive: path in manifest and exists; Negative missing: in manifest but missing; Negative extra: in sandbox but not in manifest (excluding template contents and parent dirs of manifest paths).
 */

import fs from 'node:fs';
import path from 'node:path';

export interface FileAssertionReport {
  /** Paths that exist and are in manifest (expected). */
  match: string[];
  /** Paths in manifest but missing from sandbox. */
  missing: string[];
  /** Paths in sandbox but not in manifest (excluding .mmaappss, parent dirs of manifest, and paths present in template). */
  extra: string[];
}

function collectRelativePathsUnder(dir: string, baseDir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, '/');
    out.push(rel);
    if (e.isDirectory()) {
      out.push(...collectRelativePathsUnder(full, baseDir));
    }
  }
  return out;
}

/**
 * Namespaced file-assertion utilities for integration tests.
 */
export const fileAssertions = {
  /**
   * Compare sandbox filesystem to manifest paths. Returns match, missing, extra (extra excludes .mmaappss, parent dirs of manifest paths, template paths, and excludeExtraPrefixes).
   */
  assertSandboxPaths(
    outputRoot: string,
    manifestPathsRelative: string[],
    options?: {
      templateRoot?: string;
      /** Paths (or dir prefixes) to exclude from extra report (e.g. sync outputs not in manifest). */
      excludeExtraPrefixes?: string[];
    }
  ): FileAssertionReport {
    const manifestSet = new Set(manifestPathsRelative);
    const match: string[] = [];
    const missing: string[] = [];
    for (const rel of manifestPathsRelative) {
      const full = path.join(outputRoot, rel);
      if (fs.existsSync(full)) match.push(rel);
      else missing.push(rel);
    }
    const allInSandbox = collectRelativePathsUnder(outputRoot, outputRoot);
    const templatePaths = options?.templateRoot
      ? new Set(collectRelativePathsUnder(options.templateRoot, options.templateRoot))
      : new Set<string>();
    const excludeExtraPrefixes = options?.excludeExtraPrefixes ?? [];
    const isParentOfManifest = (rel: string): boolean =>
      manifestPathsRelative.some((m) => m === rel || m.startsWith(rel + '/'));
    const isExcludedExtra = (rel: string): boolean =>
      excludeExtraPrefixes.some(
        (p) => rel === p || rel.startsWith(p + '/') || p.startsWith(rel + '/')
      );
    const extra = allInSandbox.filter(
      (rel) =>
        !manifestSet.has(rel) &&
        rel !== '.mmaappss' &&
        !rel.startsWith('.mmaappss/') &&
        !isParentOfManifest(rel) &&
        !templatePaths.has(rel) &&
        !isExcludedExtra(rel)
    );
    return { match, missing, extra };
  },

  /**
   * Collect all relative paths from manifest (symlinks, fsAutoRemoval, fsManualRemoval).
   */
  collectManifestRelativePaths(manifest: Record<string, Record<string, unknown>>): string[] {
    const out: string[] = [];
    for (const byBehavior of Object.values(manifest)) {
      for (const entry of Object.values(byBehavior)) {
        if (entry === true || typeof entry !== 'object') continue;
        const e = entry as {
          symlinks?: string[];
          fsAutoRemoval?: string[];
          fsManualRemoval?: string[];
        };
        for (const rel of e.symlinks ?? []) {
          out.push(rel);
        }
        for (const rel of e.fsAutoRemoval ?? []) {
          out.push(rel);
        }
        for (const rel of e.fsManualRemoval ?? []) {
          out.push(rel);
        }
      }
    }
    return [...new Set(out)];
  },
};
