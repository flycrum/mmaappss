/**
 * Unified sync manifest: one JSON file per repo that records what each sync behavior
 * created (per agent). Used by clear to teardown without per-behavior manifest files.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { MmaappssConfig } from './config-helpers.js';

/**
 * One sync behavior's entry in the unified manifest.
 * options = serializable behavior options (from definition); customData = runtime data the behavior registered.
 * Use true when the behavior is active but has nothing to store (e.g. no options or customData).
 */
export type SyncManifestEntry = true | { options?: Record<string, unknown>; customData?: unknown };

/** Full manifest: agent -> behavior manifestKey -> entry. */
export type SyncManifest = Record<string, Record<string, SyncManifestEntry>>;

const DEFAULT_SYNC_MANIFEST_REL = '.mmaappss/sync-manifest.json';

/**
 * Sync manifest read/write and registration API.
 */
export const syncManifest = {
  /**
   * Resolve the absolute path for the unified sync manifest.
   * Uses config.syncManifestPath when set, otherwise default under repo root.
   */
  getManifestPath(repoRoot: string, config: MmaappssConfig | null): string {
    const rel = config?.syncManifestPath ?? DEFAULT_SYNC_MANIFEST_REL;
    return path.join(repoRoot, rel);
  },

  /**
   * Load the unified sync manifest from disk. Returns empty object when file missing or invalid.
   */
  load(manifestPath: string): SyncManifest {
    try {
      if (!fs.existsSync(manifestPath)) return {};
      const raw = fs.readFileSync(manifestPath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as SyncManifest;
      }
    } catch {
      // invalid or unreadable -> treat as empty
    }
    return {};
  },

  /**
   * Write the unified sync manifest to disk. Ensures parent directory exists.
   */
  write(manifestPath: string, manifest: SyncManifest): void {
    const dir = path.dirname(manifestPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  },

  /**
   * Register content for one agent + sync behavior into the in-memory manifest.
   * Call from sync behaviors during sync run; runner persists the manifest after all agents run.
   */
  registerContent(
    manifest: SyncManifest,
    agent: string,
    syncBehavior: string,
    entry: SyncManifestEntry
  ): void {
    if (!manifest[agent]) manifest[agent] = {};
    manifest[agent][syncBehavior] = entry;
  },
};
