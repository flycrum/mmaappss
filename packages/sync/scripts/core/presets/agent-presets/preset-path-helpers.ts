/**
 * Path segment joining for preset options. Ensures exactly one separator between segments;
 * no double slashes, no missing slash. Inputs may have trailing slash or not.
 */

import path from 'node:path';

/**
 * Join two path segments (e.g. AGENTS_SOURCE_DIR + AGENTS_PLUGINS_DIR) without double slash or missing slash.
 * Normalizes to forward slashes and trims; output has no trailing slash (path.join style).
 */
export function joinSegments(a: string, b: string): string {
  const na = a.replace(/\\/g, '/').replace(/\/+$/, '');
  const nb = b.replace(/\\/g, '/').replace(/^\//, '').replace(/\/+$/, '');
  if (!na) return nb || '';
  if (!nb) return na;
  return path.join(na, nb).replace(/\\/g, '/');
}

export const presetPathHelpers = {
  joinSegments,
};
