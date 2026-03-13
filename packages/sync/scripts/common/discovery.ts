/**
 * Recursive discovery of plugins dir across root and nested directories.
 * Plugins path is resolved from config (default .agents/plugins); manifest paths come from preset configs.
 * Respects config.excluded (glob patterns).
 */

import fs from 'node:fs';
import path from 'node:path';
import { getResolvedPluginsPath } from '../core/presets/agent-presets/mmaappss-base-preset-options.js';
import { PRESET_MANIFEST_PATHS } from '../core/presets/agent-presets/preset-manifest-paths.js';
import type { MmaappssConfig } from './config-helpers.js';
import { isExcluded } from './excluded-patterns.js';
import { getLogger } from './logger.js';
import type { DiscoveredMarketplace, DiscoveredPlugin, PluginManifestKey } from './types.js';

/** Default segments to exclude from walk (always applied). */
const DEFAULT_EXCLUDE = ['node_modules', 'dist', '.git', '.turbo', '.next'];

function loadManifest(
  manifestPath: string
): { name?: string; description?: string; version?: string } | null {
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if ('name' in parsed && typeof parsed.name !== 'string') return null;
    if ('description' in parsed && typeof parsed.description !== 'string') return null;
    if ('version' in parsed && typeof parsed.version !== 'string') return null;
    return {
      name: 'name' in parsed ? parsed.name : undefined,
      description: 'description' in parsed ? parsed.description : undefined,
      version: 'version' in parsed ? parsed.version : undefined,
    };
  } catch {
    return null;
  }
}

function discoverPluginsInDir(pluginsDir: string, relativePluginsPath: string): DiscoveredPlugin[] {
  const plugins: DiscoveredPlugin[] = [];
  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const manifestEntries = Object.entries(PRESET_MANIFEST_PATHS) as Array<
    [PluginManifestKey, string]
  >;

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;

    const pluginPath = path.join(pluginsDir, ent.name);
    // Priority: claude → codex → cursor, per PRESET_MANIFEST_PATHS order.
    const manifests = Object.fromEntries(
      manifestEntries.map(([manifestKey, manifestRelativePath]) => [
        manifestKey,
        fs.existsSync(path.join(pluginPath, manifestRelativePath)),
      ])
    ) as Record<PluginManifestKey, boolean>;
    const hasAnyManifest = Object.values(manifests).some(Boolean);
    if (!hasAnyManifest) continue;

    const firstPresentManifest = manifestEntries.find(([manifestKey]) => manifests[manifestKey]);
    if (!firstPresentManifest) continue;
    const manifestPath = firstPresentManifest[1];
    const absoluteManifestPath = path.join(pluginPath, manifestPath);
    const manifest = loadManifest(absoluteManifestPath);
    const relativePath = path.join(relativePluginsPath, ent.name).replace(/\\/g, '/');

    plugins.push({
      description: manifest?.description,
      manifests,
      manifestName: manifest?.name ?? ent.name,
      name: ent.name,
      path: pluginPath,
      relativePath,
      version: manifest?.version,
    });
  }

  return plugins.sort((a, b) => a.name.localeCompare(b.name));
}

function findPluginsDirs(repoRoot: string, config: MmaappssConfig | null): string[] {
  const walkPatterns = [...DEFAULT_EXCLUDE, ...(config?.excluded ?? [])];
  const found: string[] = [];
  const resolvedPluginsPath = getResolvedPluginsPath(config?.basePresetOptions);
  const segments = resolvedPluginsPath.split('/').filter(Boolean);
  if (segments.length < 2) {
    getLogger().warn(
      { resolvedPluginsPath },
      'discovery: resolved plugins path has fewer than 2 segments, using default'
    );
  }

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      getLogger().warn(
        { dir, err: e instanceof Error ? e.message : String(e) },
        'readdir failed, skipping'
      );
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const fullPath = path.join(dir, ent.name);
      const relativePath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
      if (isExcluded(relativePath, walkPatterns) || isExcluded(ent.name, walkPatterns)) continue;
      const pluginsPath = path.join(fullPath, ...segments);
      if (fs.existsSync(pluginsPath) && fs.statSync(pluginsPath).isDirectory()) {
        found.push(pluginsPath);
      }
      if (
        segments.length >= 2 &&
        ent.name === segments[segments.length - 1] &&
        path.basename(dir) === segments[segments.length - 2]
      ) {
        continue;
      }
      walk(fullPath);
    }
  }

  const rootPlugins = path.join(repoRoot, ...segments);
  if (fs.existsSync(rootPlugins) && fs.statSync(rootPlugins).isDirectory()) {
    found.unshift(rootPlugins);
  }

  walk(repoRoot);
  return [...new Set(found)];
}

/**
 * Discover all marketplaces (root + nested) and their plugins.
 */
export function discoverMarketplaces(
  repoRoot: string,
  config: MmaappssConfig | null
): DiscoveredMarketplace[] {
  const pluginsDirs = findPluginsDirs(repoRoot, config);
  const marketplaces: DiscoveredMarketplace[] = [];

  getLogger().debug(
    {
      pluginsDirsCount: pluginsDirs.length,
      pluginsDirs: pluginsDirs.map((d) => path.relative(repoRoot, d)),
    },
    'discovery: scanning plugins dirs'
  );

  const excluded = config?.excluded ?? [];

  const resolvedPluginsPath = getResolvedPluginsPath(config?.basePresetOptions);
  for (const pluginsDir of pluginsDirs) {
    const relativePath = path.relative(repoRoot, pluginsDir).replace(/\\/g, '/');
    const label =
      relativePath === resolvedPluginsPath ? 'Root marketplace' : `${relativePath} marketplace`;
    const allPlugins = discoverPluginsInDir(pluginsDir, relativePath);
    const plugins = excluded.length
      ? allPlugins.filter(
          (p) => !isExcluded(p.relativePath, excluded) && !isExcluded(p.name, excluded)
        )
      : allPlugins;
    marketplaces.push({ pluginsDir, relativePath, label, plugins });
  }

  const totalPlugins = marketplaces.reduce((n, m) => n + m.plugins.length, 0);
  getLogger().debug(
    { marketplacesCount: marketplaces.length, totalPlugins },
    'discovery: complete'
  );
  return marketplaces;
}
