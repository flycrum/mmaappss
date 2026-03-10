/**
 * Structure diff for manifest: compare agent names and behavior keys only (not values).
 */

export interface ManifestDiffReport {
  added: string[];
  removed: string[];
  modified: string[];
}

function shallowKeys(obj: unknown): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.keys(obj as Record<string, unknown>).sort();
}

/**
 * Namespaced manifest-diff utilities for integration tests.
 */
export const diffManifest = {
  /**
   * Compare expected vs actual manifest structure (agents and behavior keys). Returns added, removed, modified paths (dot-notation).
   */
  diff(
    expected: Record<string, Record<string, unknown>>,
    actual: Record<string, Record<string, unknown>>
  ): ManifestDiffReport {
    return this.runDiff(expected, actual);
  },

  runDiff(
    expected: Record<string, Record<string, unknown>>,
    actual: Record<string, Record<string, unknown>>
  ): ManifestDiffReport {
    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    const expectedAgents = shallowKeys(expected);
    const actualAgents = shallowKeys(actual);
    for (const a of actualAgents) {
      if (!expectedAgents.includes(a)) {
        added.push(a);
      } else {
        const eBehaviors = shallowKeys((expected as Record<string, Record<string, unknown>>)[a]);
        const aBehaviors = shallowKeys((actual as Record<string, Record<string, unknown>>)[a]);
        for (const b of aBehaviors) {
          if (!eBehaviors.includes(b)) added.push(`${a}.${b}`);
        }
        for (const b of eBehaviors) {
          if (!aBehaviors.includes(b)) removed.push(`${a}.${b}`);
        }
      }
    }
    for (const a of expectedAgents) {
      if (!actualAgents.includes(a)) removed.push(a);
    }
    return { added, removed, modified };
  },
};
