/**
 * Config and helpers for recursive manifest diff: types, deep equality, compare-at-depth.
 */

export interface ManifestDiffReport {
  added: string[];
  removed: string[];
  modified: string[];
}

export interface RunDiffOptions {
  /** When true, only compare keys (added/removed); never report modified or recurse into value differences. Use for lightweight expected manifests (e.g. true placeholders). */
  structureOnly?: boolean;
}

/** Plain object check (excludes array, null, Date, etc.) */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

/** True if value is primitive (or null) for array sort/comparison. */
function isPrimitive(v: unknown): boolean {
  return v === null || typeof v !== 'object';
}

/**
 * Deep equality: primitives by value, objects key-order insensitive.
 * Arrays: order-sensitive for arrays containing objects; order-insensitive for arrays of primitives only.
 */
function deepEqual(expected: unknown, actual: unknown): boolean {
  if (Object.is(expected, actual)) return true;
  if (expected === null || actual === null) return false;
  if (typeof expected !== typeof actual) return false;
  if (typeof expected !== 'object') return expected === actual;

  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    const ePrim = expected.every(isPrimitive);
    const aPrim = actual.every(isPrimitive);
    if (ePrim && aPrim) {
      const sortedE = [...expected].sort((a, b) => String(a).localeCompare(String(b), 'en'));
      const sortedA = [...actual].sort((a, b) => String(a).localeCompare(String(b), 'en'));
      return sortedE.every((_, i) => sortedE[i] === sortedA[i]);
    }
    return expected.every((_, i) => deepEqual(expected[i], actual[i]));
  }
  if (Array.isArray(expected) || Array.isArray(actual)) return false;

  if (!isPlainObject(expected) || !isPlainObject(actual)) return false;
  const eKeys = Object.keys(expected).sort();
  const aKeys = Object.keys(actual).sort();
  if (eKeys.length !== aKeys.length) return false;
  if (eKeys.some((k, i) => k !== aKeys[i])) return false;
  return eKeys.every((k) => deepEqual(expected[k], actual[k]));
}

function joinPath(prefix: string, segment: string): string {
  return prefix ? `${prefix}.${segment}` : segment;
}

export function compareAtDepth(
  expected: unknown,
  actual: unknown,
  pathPrefix: string,
  report: ManifestDiffReport,
  structureOnly: boolean
): void {
  if (!isPlainObject(expected) || !isPlainObject(actual)) {
    if (!structureOnly && !deepEqual(expected, actual)) report.modified.push(pathPrefix);
    return;
  }

  const eKeys = Object.keys(expected).sort();
  const aKeys = Object.keys(actual).sort();
  const allKeys = [...new Set([...eKeys, ...aKeys])].sort();

  for (const key of allKeys) {
    const path = joinPath(pathPrefix, key);
    const inExpected = Object.prototype.hasOwnProperty.call(expected, key);
    const inActual = Object.prototype.hasOwnProperty.call(actual, key);

    if (!inExpected && inActual) {
      report.added.push(path);
      continue;
    }
    if (inExpected && !inActual) {
      report.removed.push(path);
      continue;
    }

    const eVal = expected[key];
    const aVal = actual[key];

    if (!structureOnly && deepEqual(eVal, aVal)) continue;

    if (isPlainObject(eVal) && isPlainObject(aVal)) {
      compareAtDepth(eVal, aVal, path, report, structureOnly);
      continue;
    }

    if (Array.isArray(eVal) && Array.isArray(aVal)) {
      if (eVal.length !== aVal.length) {
        if (!structureOnly) report.modified.push(path);
        continue;
      }
      for (let i = 0; i < eVal.length; i++) {
        const elPath = `${path}[${i}]`;
        if (!structureOnly && deepEqual(eVal[i], aVal[i])) continue;
        if (isPlainObject(eVal[i]) && isPlainObject(aVal[i])) {
          compareAtDepth(eVal[i], aVal[i], elPath, report, structureOnly);
        } else if (!structureOnly) {
          report.modified.push(elPath);
        }
      }
      continue;
    }

    if (!structureOnly) report.modified.push(path);
  }
}
