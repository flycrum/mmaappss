import { uniq } from 'lodash-es';
import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';
import { jsonPatch } from '../../common/json-patch.js';
import type { DiscoveredMarketplace, PluginManifestKey } from '../../common/types.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Options for syncing and tearing down agent settings files. */
export interface SettingsSyncBehaviorOptions {
  /** Manifest capability key to include. Defaults to context.agentName when omitted. */
  manifestKey?: PluginManifestKey;
  /** Optional marketplace name override (defaults to `mmaappss-plugins`). */
  marketplaceName?: string;
  /** Relative path to the target settings file. */
  settingsFile: string;
}

const SOURCE_TYPE = 'directory';
const DEFAULT_MARKETPLACE_NAME = 'mmaappss-plugins';

/**
 * Sync behavior for agent settings files. Options.settingsFile is required for real work.
 * Omitting options (or passing undefined) intentionally creates a no-op instance; methods guard for missing options and return early.
 */
export class SettingsSyncBehavior extends SyncBehaviorBase<SettingsSyncBehaviorOptions> {
  /** @param options - When omitted, instance is no-op; methods check this.options and skip when undefined. */
  constructor(options?: SettingsSyncBehaviorOptions) {
    super(options);
  }

  /** Builds plugin IDs that should be represented in the target settings file. */
  private buildPluginIds(
    marketplaces: DiscoveredMarketplace[],
    manifestKey?: PluginManifestKey
  ): string[] {
    const options = this.options;
    if (!options) return [];
    return uniq(
      marketplaces.flatMap((marketplace) =>
        marketplace.plugins
          .filter((plugin) => this.hasPluginManifest(plugin, manifestKey))
          .map((plugin) => plugin.manifestName ?? plugin.name)
      )
    );
  }

  /** Removes mmaappss-managed settings keys from the target settings file. */
  private teardownSettings(repoRoot: string): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);

    const filePath = path.join(repoRoot, options.settingsFile);
    if (!fs.existsSync(filePath)) return ok(undefined);

    const res = jsonPatch.readJson<Record<string, unknown>>(filePath);
    if (res.isErr()) return err(res.error);
    const parsed = res.value;
    const marketplaceName = options.marketplaceName ?? DEFAULT_MARKETPLACE_NAME;

    const extraKnown = parsed.extraKnownMarketplaces as Record<string, unknown> | undefined;
    if (extraKnown?.[marketplaceName]) {
      delete extraKnown[marketplaceName];
      if (Object.keys(extraKnown).length === 0) delete parsed.extraKnownMarketplaces;
    }

    const enabledPlugins = parsed.enabledPlugins as Record<string, unknown> | undefined;
    if (enabledPlugins) {
      for (const key of Object.keys(enabledPlugins)) {
        if (key.endsWith(`@${marketplaceName}`)) delete enabledPlugins[key];
      }
      if (Object.keys(enabledPlugins).length === 0) delete parsed.enabledPlugins;
    }

    return jsonPatch.writeJson(filePath, parsed);
  }

  /** Merges mmaappss-managed marketplace and enabled plugin settings into the target file. */
  private syncSettings(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);

    const marketplaceName = options.marketplaceName ?? DEFAULT_MARKETPLACE_NAME;
    const manifestKey = options.manifestKey ?? context.agentName;
    const pluginIds = this.buildPluginIds(context.marketplaces, manifestKey);
    const enabledPlugins: Record<string, boolean> = {};
    for (const pluginId of pluginIds) {
      enabledPlugins[`${pluginId}@${marketplaceName}`] = true;
    }

    const patch = {
      extraKnownMarketplaces: {
        [marketplaceName]: { source: { source: SOURCE_TYPE, path: '.' } },
      },
      enabledPlugins,
    };

    const filePath = path.join(context.repoRoot, options.settingsFile);
    const res = jsonPatch.readJson<Record<string, unknown>>(filePath);
    let existing: Record<string, unknown>;
    if (res.isErr()) {
      const errWithCode = res.error as Error & { code?: string };
      if (errWithCode.code === 'ENOENT' || res.error.message.includes('ENOENT')) existing = {};
      else return err(res.error);
    } else {
      existing = res.value ?? {};
    }

    const merged = {
      ...existing,
      extraKnownMarketplaces: {
        ...((existing.extraKnownMarketplaces as object) ?? {}),
        ...patch.extraKnownMarketplaces,
      },
      enabledPlugins: {
        ...((existing.enabledPlugins as Record<string, unknown>) ?? {}),
        ...patch.enabledPlugins,
      },
    };

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return jsonPatch.writeJson(filePath, merged);
  }

  /** Sync-phase enabled hook that writes settings integration fields. */
  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const result = this.syncSettings(context);
    if (result.isErr()) return result;
    const key = context.currentBehaviorManifestKey ?? 'settingsSync';
    const opts = context.currentBehaviorOptionsForManifest;
    context.registerContentToMmaappssSyncManifest(
      context.agentName,
      key,
      opts && Object.keys(opts).length > 0 ? { options: opts } : true
    );
    return ok(undefined);
  }

  /** Sync-phase disabled hook that removes settings integration fields. */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    return this.teardownSettings(context.repoRoot);
  }

  /** Clear hook that removes settings integration fields. */
  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    return this.teardownSettings(context.repoRoot);
  }
}
