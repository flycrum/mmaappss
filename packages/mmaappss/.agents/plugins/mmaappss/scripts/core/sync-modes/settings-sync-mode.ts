import { uniq } from 'lodash-es';
import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';
import { jsonPatch } from '../../common/json-patch.js';
import type { PresetAgentName } from '../../common/preset-agents.js';
import type { DiscoveredMarketplace, DiscoveredPlugin } from '../../common/types.js';
import { SyncModeBase, type SyncModeContext } from './sync-mode-base.js';

/** Options for syncing and tearing down agent settings files. */
export interface SettingsSyncModeOptions {
  /** Selects which manifest-bearing plugins are included in enabledPlugins output. */
  manifestFilter: PresetAgentName;
  /** Optional marketplace name override (defaults to `mmaappss-plugins`). */
  marketplaceName?: string;
  /** Relative path to the target settings file. */
  settingsFile: string;
}

const SOURCE_TYPE = 'directory';
const DEFAULT_MARKETPLACE_NAME = 'mmaappss-plugins';

class SettingsSyncMode extends SyncModeBase<SettingsSyncModeOptions> {
  /** Builds plugin IDs that should be represented in the target settings file. */
  private buildPluginIds(marketplaces: DiscoveredMarketplace[]): string[] {
    const options = this.options;
    if (!options) return [];
    const includePlugin = (plugin: DiscoveredPlugin) => {
      if (options.manifestFilter === 'claude') return plugin.hasClaudeManifest;
      if (options.manifestFilter === 'cursor') return plugin.hasCursorManifest;
      return plugin.hasCodexManifest;
    };
    return uniq(
      marketplaces.flatMap((marketplace) =>
        marketplace.plugins
          .filter(includePlugin)
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
  private syncSettings(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[]
  ): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);

    const marketplaceName = options.marketplaceName ?? DEFAULT_MARKETPLACE_NAME;
    const pluginIds = this.buildPluginIds(marketplaces);
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

    const filePath = path.join(repoRoot, options.settingsFile);
    const res = jsonPatch.readJson<Record<string, unknown>>(filePath);
    let existing: Record<string, unknown>;
    if (res.isErr()) {
      if (res.error.message.includes('ENOENT')) existing = {};
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
  override syncRunEnabled(context: SyncModeContext): Result<void, Error> {
    return this.syncSettings(context.repoRoot, context.marketplaces);
  }

  /** Sync-phase disabled hook that removes settings integration fields. */
  override syncRunDisabled(context: SyncModeContext): Result<void, Error> {
    return this.teardownSettings(context.repoRoot);
  }

  /** Clear hook that removes settings integration fields. */
  override clearRun(context: SyncModeContext): Result<void, Error> {
    return this.teardownSettings(context.repoRoot);
  }
}

/** Named export wrapper for settings sync mode class. */
export const settingsSyncMode = {
  SettingsSyncMode,
};
