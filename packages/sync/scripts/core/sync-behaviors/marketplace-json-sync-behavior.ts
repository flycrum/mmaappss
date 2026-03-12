import type { Operation } from 'fast-json-patch';
import { sortBy } from 'lodash-es';
import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';
import { jsonPatch } from '../../common/json-patch.js';
import { pathHelpers } from '../../common/path-helpers.js';
import type { DiscoveredMarketplace, PluginManifestKey } from '../../common/types.js';
import { presetConstants } from '../presets/agent-preset-constants.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Marketplace plugin entry written into `marketplace.json`. */
export interface MarketplacePluginEntry {
  description?: string;
  name: string;
  source: string;
  version?: string;
}

/** Canonical marketplace JSON shape managed by this sync behavior. */
interface MarketplaceJson {
  name: string;
  owner: { name: string };
  plugins: MarketplacePluginEntry[];
}

/** Options for syncing and tearing down marketplace JSON files. */
export interface MarketplaceJsonSyncBehaviorOptions {
  /** Manifest capability key used for plugin eligibility. Defaults to context.agentName when omitted. */
  manifestKey?: PluginManifestKey;
  /** Relative file path to the target marketplace json file. */
  marketplaceFile: string;
  /** Optional marketplace name override (defaults to presetConstants.DEFAULT_MARKETPLACE_NAME). */
  marketplaceName?: string;
  /** Source path formatting strategy for marketplace plugin entries. */
  sourceFormat?: 'prefixed' | 'relative';
}

/** Custom data registered by this behavior (plugins list for manifest). */
export interface MarketplaceJsonCustomData {
  plugins: MarketplacePluginEntry[];
}

export class MarketplaceJsonSyncBehavior extends SyncBehaviorBase<MarketplaceJsonSyncBehaviorOptions> {
  constructor(options?: MarketplaceJsonSyncBehaviorOptions) {
    super(options);
  }

  /** Builds sorted marketplace plugin entries from discovered marketplaces. */
  private buildMarketplacePluginEntries(
    marketplaces: DiscoveredMarketplace[],
    manifestKey?: PluginManifestKey
  ): MarketplacePluginEntry[] {
    const options = this.options;
    if (!options) return [];

    const formatSource = (relativePath: string) =>
      options.sourceFormat === 'prefixed' ? `./${relativePath}` : relativePath;

    const entries: MarketplacePluginEntry[] = [];
    const seen = new Set<string>();
    for (const marketplace of marketplaces) {
      for (const plugin of marketplace.plugins) {
        if (!this.hasPluginManifest(plugin, manifestKey)) continue;
        const key = `${marketplace.relativePath}:${plugin.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push({
          name: plugin.manifestName ?? plugin.name,
          source: formatSource(plugin.relativePath),
          description: plugin.description,
          version: plugin.version,
        });
      }
    }

    return sortBy(entries, 'name');
  }

  /** Builds the full canonical marketplace JSON document for write/patch operations. */
  private buildMarketplaceJson(
    marketplaces: DiscoveredMarketplace[],
    manifestKey?: PluginManifestKey
  ): MarketplaceJson {
    const options = this.options;
    const name = options?.marketplaceName ?? presetConstants.DEFAULT_MARKETPLACE_NAME;
    return {
      name,
      owner: { name: presetConstants.MARKETPLACE_OWNER },
      plugins: this.buildMarketplacePluginEntries(marketplaces, manifestKey),
    };
  }

  /** Removes managed marketplace fields or deletes the file when it is fully managed. */
  private teardownMarketplaceJson(outputRoot: string): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);

    const filePath = pathHelpers.joinRepo(outputRoot, options.marketplaceFile);
    const res = jsonPatch.readJson<MarketplaceJson>(filePath);
    if (res.isErr()) {
      if ((res.error as NodeJS.ErrnoException).code === 'ENOENT') return ok(undefined);
      return err(res.error);
    }

    const manifest = res.value;
    const marketplaceName = options.marketplaceName ?? presetConstants.DEFAULT_MARKETPLACE_NAME;
    const managedKeys = new Set(['name', 'owner', 'plugins']);
    const keys = Object.keys(manifest);
    const onlyManagedKeys =
      manifest.name === marketplaceName && keys.length > 0 && keys.every((k) => managedKeys.has(k));

    if (onlyManagedKeys) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        const nodeErr = e as NodeJS.ErrnoException;
        if (nodeErr?.code !== 'ENOENT') {
          return err(e instanceof Error ? e : new Error(String(e)));
        }
      }
      return ok(undefined);
    }

    const ops: Operation[] = [];
    if (manifest.name !== undefined) ops.push({ op: 'remove', path: '/name' });
    if (manifest.owner !== undefined) ops.push({ op: 'remove', path: '/owner' });
    if (manifest.plugins !== undefined) ops.push({ op: 'remove', path: '/plugins' });
    if (ops.length === 0) return ok(undefined);

    const patched = jsonPatch.applyPatch(manifest, ops);
    if (patched.isErr()) return err(patched.error);
    return jsonPatch.writeJson(filePath, patched.value);
  }

  /** Writes or patches marketplace JSON with canonical managed fields; returns canonical for registration. */
  private syncMarketplaceJson(context: SyncBehaviorContext): Result<MarketplaceJson, Error> {
    const options = this.options;
    if (!options)
      return ok({ name: '', owner: { name: presetConstants.MARKETPLACE_OWNER }, plugins: [] });

    const manifestKey = options.manifestKey ?? context.agentName;
    const filePath = pathHelpers.joinRepo(context.outputRoot, options.marketplaceFile);
    const canonical = this.buildMarketplaceJson(context.marketplaces, manifestKey);
    const res = jsonPatch.readJson<MarketplaceJson>(filePath);

    if (res.isErr()) {
      if ((res.error as NodeJS.ErrnoException).code === 'ENOENT') {
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });
        const writeRes = jsonPatch.writeJson(filePath, canonical);
        return writeRes.isErr() ? err(writeRes.error) : ok(canonical);
      }
      return err(res.error);
    }

    const ops: Operation[] = [
      { op: 'add', path: '/name', value: canonical.name },
      { op: 'add', path: '/owner', value: canonical.owner },
      { op: 'add', path: '/plugins', value: canonical.plugins },
    ];
    const patched = jsonPatch.applyPatch(res.value, ops);
    if (patched.isErr()) return err(patched.error);
    const writeRes = jsonPatch.writeJson(filePath, patched.value);
    return writeRes.isErr() ? err(writeRes.error) : ok(canonical);
  }

  /** Sync-phase enabled hook that writes marketplace json content. */
  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const result = this.syncMarketplaceJson(context);
    if (result.isErr()) return err(result.error);
    const key = context.currentBehaviorManifestKey ?? 'localMarketplaceSync';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      customData: { plugins: result.value.plugins } satisfies MarketplaceJsonCustomData,
    });
    return ok(undefined);
  }

  /** Sync-phase disabled hook that removes managed marketplace json content. */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    return this.teardownMarketplaceJson(context.outputRoot);
  }

  /** Clear hook that removes managed marketplace json content. */
  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    return this.teardownMarketplaceJson(context.outputRoot);
  }
}
