/**
 * Recursive discovery of .agents/plugins/ across root and nested directories.
 * Respects excludeDirectories from config.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { MmaappssConfig } from './config-helpers.js';
import type { DiscoveredMarketplace, DiscoveredPlugin } from './types.js';

const PLUGINS_SUBDIR = '.agents/plugins';
const CLAUDE_MANIFEST = '.claude-plugin/plugin.json';
const CURSOR_MANIFEST = '.cursor-plugin/plugin.json';

/** Default directories to exclude from scanning (always applied). */
const DEFAULT_EXCLUDE = ['node_modules', 'dist', '.git', '.turbo', '.next'];

function isExcluded(dirName: string, config: MmaappssConfig | null): boolean {
  const exclude = [...DEFAULT_EXCLUDE, ...(config?.excludeDirectories ?? [])];
  return exclude.some((e) => dirName === e || dirName.endsWith(path.sep + e));
}

function loadManifest(
  manifestPath: string
): { name?: string; description?: string; version?: string } | null {
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw) as { name?: string; description?: string; version?: string };
  } catch {
    return null;
  }
}

function discoverPluginsInDir(
  pluginsDir: string,
  repoRoot: string,
  relativePluginsPath: string
): DiscoveredPlugin[] {
  const plugins: DiscoveredPlugin[] = [];
  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;

    const pluginPath = path.join(pluginsDir, ent.name);
    const claudeManifestPath = path.join(pluginPath, CLAUDE_MANIFEST);
    const cursorManifestPath = path.join(pluginPath, CURSOR_MANIFEST);
    const hasClaude = fs.existsSync(claudeManifestPath);
    const hasCursor = fs.existsSync(cursorManifestPath);

    if (!hasClaude && !hasCursor) continue;

    const manifest = loadManifest(hasClaude ? claudeManifestPath : cursorManifestPath);
    const relativePath = path.join(relativePluginsPath, ent.name);

    plugins.push({
      name: ent.name,
      path: pluginPath,
      relativePath,
      hasClaudeManifest: hasClaude,
      hasCursorManifest: hasCursor,
      manifestName: manifest?.name ?? ent.name,
      description: manifest?.description,
      version: manifest?.version,
    });
  }

  return plugins.sort((a, b) => a.name.localeCompare(b.name));
}

function findPluginsDirs(repoRoot: string, config: MmaappssConfig | null): string[] {
  const found: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (isExcluded(ent.name, config)) continue;

      const fullPath = path.join(dir, ent.name);
      const pluginsPath = path.join(fullPath, '.agents', 'plugins');
      if (fs.existsSync(pluginsPath) && fs.statSync(pluginsPath).isDirectory()) {
        found.push(pluginsPath);
      }
      if (ent.name === 'plugins' && path.basename(dir) === '.agents') continue;
      walk(fullPath);
    }
  }

  const rootPlugins = path.join(repoRoot, PLUGINS_SUBDIR);
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

  for (const pluginsDir of pluginsDirs) {
    const relativePath = path.relative(repoRoot, pluginsDir).replace(/\\/g, '/');
    const label =
      relativePath === PLUGINS_SUBDIR || relativePath === '.agents/plugins'
        ? 'Root marketplace'
        : `${relativePath} marketplace`;
    const plugins = discoverPluginsInDir(pluginsDir, repoRoot, relativePath);
    marketplaces.push({ pluginsDir, relativePath, label, plugins });
  }

  return marketplaces;
}
