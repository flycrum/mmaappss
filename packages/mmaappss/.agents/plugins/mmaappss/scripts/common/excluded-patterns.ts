/**
 * Shared exclusion matcher for config.excluded patterns.
 * Used by discovery (walk + plugin filter), agents-md-symlink-sync, and preset sync handlers.
 */

import { minimatch } from 'minimatch';

/** Normalize path/segment to forward slashes for consistent matching. */
function normalize(s: string): string {
  return s.replace(/\\/g, '/');
}

/**
 * Returns true if value matches any pattern in the list.
 * Patterns are globs (minimatch); paths normalized to forward slashes.
 */
export function isExcluded(value: string, patterns: string[] | undefined): boolean {
  if (!patterns?.length) return false;
  const normalized = normalize(value);
  for (const p of patterns) {
    if (minimatch(normalized, normalize(p), { dot: true })) return true;
  }
  return false;
}
