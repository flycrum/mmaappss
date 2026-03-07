/**
 * Base class for agent-specific marketplace sync adapters.
 * Shared logic for marketplace JSON, rules sync, and teardown; hooks for agent-specific behavior.
 */

import type { Operation } from 'fast-json-patch';
import { sortBy, uniq } from 'lodash-es';
import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';
import { claudeMdSync } from '../common/claude-md-sync.js';
import type { MmaappssConfig } from '../common/config-helpers.js';
import { configHelpers } from '../common/config-helpers.js';
import { discoverMarketplaces } from '../common/discovery.js';
import { jsonPatch } from '../common/json-patch.js';
import { getLogger } from '../common/logger.js';
import { markdownSection } from '../common/markdown-section.js';
import { rulesSync } from '../common/rules-sync.js';
import type {
  Agent,
  DiscoveredMarketplace,
  DiscoveredPlugin,
  SyncOutcome,
} from '../common/types.js';

/** Plugin entry for marketplace.json */
export interface MarketplacePluginEntry {
  /** Plugin description */
  description?: string;
  /** Plugin name */
  name: string;
  /** Plugin source path */
  source: string;
  /** Plugin version */
  version?: string;
}

/** Canonical marketplace.json shape (Claude + Cursor) */
export interface MarketplaceJson {
  /** Marketplace name */
  name: string;
  /** Marketplace owner */
  owner: { name: string };
  /** Marketplace plugins */
  plugins: MarketplacePluginEntry[];
}

/**
 * Per-adapter configuration. Each adapter declares only what it uses.
 */
export interface AdapterAgentConfig {
  agent: Agent;
  /** Codex-only: file to edit (e.g. AGENTS.override.md) */
  agentsFile?: string;
  /** Which manifest to filter by when building plugin entries */
  manifestFilter?: 'claude' | 'cursor';
  /** Uses JSON marketplace file (.claude-plugin or .cursor-plugin) */
  marketplaceFile?: string;
  /** Name of the marketplace (e.g. 'mmaappss-plugins') */
  marketplaceName?: string;
  /** Symlink rules into target dir */
  rulesDir?: string;
  /** Codex-only: section heading in agentsFile */
  sectionHeading?: string;
  /** Claude-only: merge extraKnownMarketplaces + enabledPlugins */
  settingsFile?: string;
  /** Source path format: prefixed = ./path, relative = path */
  sourceFormat?: 'prefixed' | 'relative';
  /** File to track sync state */
  syncManifest?: string;
  /** Claude-only: symlink CLAUDE.md from AGENTS.md (root and nested) */
  usesClaudeMdSymlink?: boolean;
  /** Codex-only: surgical edit of AGENTS.override.md section */
  usesMarkdownSection?: boolean;
  /** Uses JSON marketplace file */
  usesMarketplaceJson?: boolean;
  /** Symlink rules into target dir */
  usesRulesSync?: boolean;
  /** Claude-only: merge settings */
  usesSettingsMerge?: boolean;
}

const MARKETPLACE_OWNER = 'mmaappss';
const DEFAULT_MARKETPLACE_NAME = 'mmaappss-plugins';
const SOURCE_TYPE = 'directory';

export abstract class AgentAdapterBase {
  protected readonly config: Required<
    Pick<
      AdapterAgentConfig,
      | 'agent'
      | 'usesMarketplaceJson'
      | 'usesRulesSync'
      | 'usesSettingsMerge'
      | 'usesMarkdownSection'
      | 'usesClaudeMdSymlink'
    >
  > &
    AdapterAgentConfig;

  constructor(config: AdapterAgentConfig) {
    this.config = {
      usesMarketplaceJson: false,
      usesRulesSync: false,
      usesSettingsMerge: false,
      usesMarkdownSection: false,
      usesClaudeMdSymlink: false,
      ...config,
    };
  }

  /** Main entry: run sync (enable or disable) based on config. */
  run(repoRoot: string, tsConfig: MmaappssConfig | null): Result<SyncOutcome, Error> {
    const enabled = configHelpers.general.getMarketplaceEnabled(
      repoRoot,
      tsConfig,
      this.config.agent
    );
    getLogger().info({ agent: this.config.agent, enabled }, 'adapter run');
    const marketplaces = discoverMarketplaces(repoRoot, tsConfig);

    if (enabled) {
      return this.runEnable(repoRoot, marketplaces, tsConfig);
    }
    return this.runDisable(repoRoot);
  }

  /** Force teardown (clear) for this agent. Ignores config; runs disable logic only. */
  clear(repoRoot: string): Result<SyncOutcome, Error> {
    return this.runDisable(repoRoot);
  }

  /** Hook: called before teardown. Override for agent-specific prep. */
  protected beforeTeardown(_repoRoot: string): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook: called after teardown. Override for agent-specific cleanup. */
  protected afterTeardown(_repoRoot: string): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook: called before sync. Override for agent-specific prep. */
  protected beforeSync(
    _repoRoot: string,
    _marketplaces: DiscoveredMarketplace[]
  ): Result<void, Error> {
    return ok(undefined);
  }

  /** Hook: called after sync. Override for agent-specific follow-up. */
  protected afterSync(
    _repoRoot: string,
    _marketplaces: DiscoveredMarketplace[]
  ): Result<void, Error> {
    return ok(undefined);
  }

  /** Build marketplace plugin entries. Shared by Claude + Cursor. */
  protected buildMarketplacePluginEntries(
    marketplaces: DiscoveredMarketplace[]
  ): MarketplacePluginEntry[] {
    const filter = this.config.manifestFilter;
    if (!filter) return [];

    const hasManifest = (p: DiscoveredPlugin) =>
      filter === 'claude' ? p.hasClaudeManifest : p.hasCursorManifest;
    const formatSource = (relativePath: string) =>
      this.config.sourceFormat === 'prefixed' ? `./${relativePath}` : relativePath;

    const entries: MarketplacePluginEntry[] = [];
    const seen = new Set<string>();

    for (const m of marketplaces) {
      for (const p of m.plugins) {
        if (!hasManifest(p)) continue;
        const key = `${m.relativePath}:${p.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push({
          name: p.manifestName ?? p.name,
          source: formatSource(p.relativePath),
          description: p.description,
          version: p.version,
        });
      }
    }

    return sortBy(entries, 'name');
  }

  /** Build canonical marketplace.json. Shared by Claude + Cursor. */
  protected buildMarketplaceJson(marketplaces: DiscoveredMarketplace[]): MarketplaceJson {
    const plugins = this.buildMarketplacePluginEntries(marketplaces);
    const name = this.config.marketplaceName ?? DEFAULT_MARKETPLACE_NAME;
    return { name, owner: { name: MARKETPLACE_OWNER }, plugins };
  }

  private runDisable(repoRoot: string): Result<SyncOutcome, Error> {
    return Result.combine([this.beforeTeardown(repoRoot)])
      .andThen(() =>
        this.config.usesClaudeMdSymlink ? claudeMdSync.clearClaudeMd(repoRoot) : ok(undefined)
      )
      .andThen(() =>
        this.config.usesRulesSync && this.config.rulesDir && this.config.syncManifest
          ? rulesSync.clearRules(
              repoRoot,
              path.join(repoRoot, this.config.rulesDir),
              path.join(repoRoot, this.config.syncManifest)
            )
          : ok(undefined)
      )
      .andThen(() =>
        this.config.usesMarketplaceJson && this.config.marketplaceFile
          ? this.teardownMarketplaceJson(repoRoot)
          : ok(undefined)
      )
      .andThen(() =>
        this.config.usesSettingsMerge && this.config.settingsFile
          ? this.teardownSettings(repoRoot)
          : ok(undefined)
      )
      .andThen(() =>
        this.config.usesMarkdownSection && this.config.agentsFile && this.config.sectionHeading
          ? this.teardownMarkdownSectionImpl(repoRoot)
          : ok(undefined)
      )
      .andThen(() => this.afterTeardown(repoRoot))
      .map(() => ({ agent: this.config.agent, success: true }));
  }

  private runEnable(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[],
    tsConfig: MmaappssConfig | null
  ): Result<SyncOutcome, Error> {
    return Result.combine([this.beforeSync(repoRoot, marketplaces)])
      .andThen(() =>
        this.config.usesClaudeMdSymlink
          ? claudeMdSync.syncClaudeMd(repoRoot, tsConfig).map(() => undefined)
          : ok(undefined)
      )
      .andThen(() =>
        this.config.usesMarketplaceJson && this.config.marketplaceFile
          ? this.syncMarketplaceJson(repoRoot, marketplaces)
          : ok(undefined)
      )
      .andThen(() =>
        this.config.usesRulesSync && this.config.rulesDir && this.config.syncManifest
          ? rulesSync.syncRules(
              repoRoot,
              marketplaces,
              path.join(repoRoot, this.config.rulesDir),
              path.join(repoRoot, this.config.syncManifest)
            )
          : ok(undefined)
      )
      .andThen(() =>
        this.config.usesSettingsMerge && this.config.settingsFile
          ? this.syncSettings(repoRoot, marketplaces)
          : ok(undefined)
      )
      .andThen(() =>
        this.config.usesMarkdownSection && this.config.agentsFile && this.config.sectionHeading
          ? this.syncMarkdownSectionImpl(repoRoot, marketplaces)
          : ok(undefined)
      )
      .andThen(() => this.afterSync(repoRoot, marketplaces))
      .map(() => ({ agent: this.config.agent, success: true }));
  }

  private teardownMarketplaceJson(repoRoot: string): Result<void, Error> {
    const filePath = path.join(repoRoot, this.config.marketplaceFile!);
    const res = jsonPatch.readJson<MarketplaceJson>(filePath);
    if (res.isErr()) return err(res.error);
    const manifest = res.value;
    const name = this.config.marketplaceName ?? DEFAULT_MARKETPLACE_NAME;

    if (!manifest) return ok(undefined);

    if (manifest.name === name && Object.keys(manifest).length <= 3) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr?.code !== 'ENOENT') {
          console.error(`Failed to unlink ${filePath}:`, err);
          getLogger().error({ err, filePath }, 'failed to unlink marketplace file');
          return err(err instanceof Error ? err : new Error(String(err)));
        }
      }
      return ok(undefined);
    }

    const ops: Operation[] = [];
    if (manifest.name !== undefined) ops.push({ op: 'remove' as const, path: '/name' });
    if (manifest.owner !== undefined) ops.push({ op: 'remove' as const, path: '/owner' });
    if (manifest.plugins !== undefined) ops.push({ op: 'remove' as const, path: '/plugins' });
    if (ops.length === 0) return ok(undefined);

    const patched = jsonPatch.applyPatch(manifest, ops);
    if (patched.isErr()) return err(patched.error);
    return jsonPatch.writeJson(filePath, patched.value);
  }

  private syncMarketplaceJson(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[]
  ): Result<void, Error> {
    const filePath = path.join(repoRoot, this.config.marketplaceFile!);
    const canonical = this.buildMarketplaceJson(marketplaces);
    const res = jsonPatch.readJson<MarketplaceJson>(filePath);

    if (res.isErr()) return err(res.error);

    if (!res.value) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return jsonPatch.writeJson(filePath, canonical);
    }

    const ops: Operation[] = [
      { op: 'add', path: '/name', value: canonical.name },
      { op: 'add', path: '/owner', value: canonical.owner },
      { op: 'add', path: '/plugins', value: canonical.plugins },
    ];
    const patched = jsonPatch.applyPatch(res.value, ops);
    if (patched.isErr()) return err(patched.error);
    return jsonPatch.writeJson(filePath, patched.value);
  }

  /** Override for Claude: teardown settings.json keys. */
  protected teardownSettings(_repoRoot: string): Result<void, Error> {
    const filePath = path.join(_repoRoot, this.config.settingsFile!);
    if (!fs.existsSync(filePath)) return ok(undefined);

    const res = jsonPatch.readJson<Record<string, unknown>>(filePath);
    if (res.isErr()) return err(res.error);
    const s = res.value;
    if (!s) return ok(undefined);

    const name = this.config.marketplaceName ?? DEFAULT_MARKETPLACE_NAME;
    const ek = s.extraKnownMarketplaces as Record<string, unknown> | undefined;
    if (ek?.[name]) {
      delete ek[name];
      if (Object.keys(ek).length === 0) delete s.extraKnownMarketplaces;
    }
    const ep = s.enabledPlugins as Record<string, unknown> | undefined;
    if (ep) {
      for (const k of Object.keys(ep)) {
        if (k.endsWith(`@${name}`)) delete ep[k];
      }
      if (Object.keys(ep).length === 0) delete s.enabledPlugins;
    }
    return jsonPatch.writeJson(filePath, s);
  }

  /** Override for Claude: merge settings. */
  protected syncSettings(
    _repoRoot: string,
    marketplaces: DiscoveredMarketplace[]
  ): Result<void, Error> {
    const name = this.config.marketplaceName ?? DEFAULT_MARKETPLACE_NAME;
    const pluginIds = uniq(this.buildMarketplacePluginEntries(marketplaces).map((e) => e.name));
    const enabledPlugins: Record<string, boolean> = {};
    for (const id of pluginIds) {
      enabledPlugins[`${id}@${name}`] = true;
    }
    const patch = {
      extraKnownMarketplaces: {
        [name]: { source: { source: SOURCE_TYPE, path: '.' } },
      },
      enabledPlugins,
    };

    const filePath = path.join(_repoRoot, this.config.settingsFile!);
    const res = jsonPatch.readJson<Record<string, unknown>>(filePath);
    if (res.isErr()) return err(res.error);
    const existing = res.value ?? {};

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

  /** Teardown markdown section (Codex). */
  private teardownMarkdownSectionImpl(repoRoot: string): Result<void, Error> {
    const filePath = path.join(repoRoot, this.config.agentsFile!);
    const heading = (this.config.sectionHeading ?? '').replace(/^#+\s*/, '');
    return markdownSection.removeSection(filePath, heading);
  }

  /** Sync markdown section (Codex). Content from buildMarkdownSectionContent. */
  private syncMarkdownSectionImpl(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[]
  ): Result<void, Error> {
    const filePath = path.join(repoRoot, this.config.agentsFile!);
    const heading = (this.config.sectionHeading ?? '').replace(/^#+\s*/, '');
    const content = this.buildMarkdownSectionContent(marketplaces);
    return markdownSection.replaceOrAddSection(filePath, heading, content);
  }

  /** Override for Codex: build markdown section body. */
  protected buildMarkdownSectionContent(_marketplaces: DiscoveredMarketplace[]): string {
    return '';
  }
}
