/**
 * Claude-only sync behavior: removes Claude Code's local plugin cache entries for each
 * plugin in our marketplace so the next Claude load reads fresh content from source.
 * See references/troubleshooting.md#claude-local-plugin-cache in getting-started plugin.
 */

import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathHelpers } from '../../common/path-helpers.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Plugin entry shape we read from marketplace.json (name and optional version). */
interface MarketplacePluginEntry {
  name: string;
  version?: string;
}

/** Marketplace JSON shape we read (only plugins array). */
interface MarketplaceJson {
  plugins?: MarketplacePluginEntry[];
}

export interface ClaudeLocalPluginCacheBustBehaviorOptions {
  /** Base path for Claude's local plugin cache (default: ~/.claude/plugins/cache/local-plugins). */
  cacheBasePath?: string;
  /** Relative path to the marketplace.json file (e.g. .claude-plugin/marketplace.json). */
  marketplaceFile: string;
}

const DEFAULT_CACHE_BASE = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'local-plugins');

export class ClaudeLocalPluginCacheBustBehavior extends SyncBehaviorBase<ClaudeLocalPluginCacheBustBehaviorOptions> {
  constructor(options?: ClaudeLocalPluginCacheBustBehaviorOptions) {
    super(options);
  }

  /** Reads marketplace JSON and removes cache dir for each plugin. */
  private removeCacheForMarketplacePlugins(outputRoot: string): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);

    const filePath = pathHelpers.joinRepo(outputRoot, options.marketplaceFile);
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      const code =
        e && typeof e === 'object' && 'code' in e ? (e as NodeJS.ErrnoException).code : undefined;
      if (code === 'ENOENT') return ok(undefined);
      return err(e instanceof Error ? e : new Error(String(e)));
    }

    let data: MarketplaceJson;
    try {
      data = JSON.parse(raw) as MarketplaceJson;
    } catch (_) {
      return ok(undefined);
    }

    const plugins = data?.plugins;
    if (!Array.isArray(plugins) || plugins.length === 0) return ok(undefined);

    const cacheBase = options.cacheBasePath ?? DEFAULT_CACHE_BASE;
    for (const plugin of plugins) {
      const name = plugin?.name;
      if (typeof name !== 'string' || !name) continue;
      const version = typeof plugin?.version === 'string' ? plugin.version : undefined;
      const cacheDir = version ? path.join(cacheBase, name, version) : path.join(cacheBase, name);
      try {
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true });
        }
      } catch {
        // Best-effort; do not fail sync/clear if cache rm fails (e.g. permissions)
      }
    }
    return ok(undefined);
  }

  override syncRunAfter(context: SyncBehaviorContext): Result<void, Error> {
    return this.removeCacheForMarketplacePlugins(context.outputRoot);
  }

  override clearRunBefore(context: SyncBehaviorContext): Result<void, Error> {
    return this.removeCacheForMarketplacePlugins(context.outputRoot);
  }
}
