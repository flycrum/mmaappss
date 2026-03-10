/**
 * Cursor content sync: copy/symlink plugin rules, commands, skills, and agents
 * into .cursor/*. Tracks all created paths in a manifest for teardown.
 * Cursor does not support local marketplace.json; we sync content instead.
 * All Cursor-specific logic lives here; only the Cursor preset imports this.
 */

import { Result, err, ok } from 'neverthrow';
import path from 'node:path';
import type { MmaappssConfig } from '../../../common/config-helpers.js';
import { isExcluded } from '../../../common/excluded-patterns.js';
import { getLogger } from '../../../common/logger.js';
import { syncFs } from '../../../common/sync-fs.js';
import type { DiscoveredMarketplace } from '../../../common/types.js';
import { presetConstants } from './preset-constants.js';

export interface CursorContentSyncManifest {
  rules: string[];
  commands: string[];
  skills: string[];
  agents: string[];
}

/** Ensure manifest has arrays for rules, commands, skills, agents (coerce invalid/missing to []). */
function normalizeCursorContentSyncManifest(parsed: unknown): CursorContentSyncManifest {
  const obj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const arr = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((e): e is string => typeof e === 'string') : [];
  return {
    rules: arr(obj.rules),
    commands: arr(obj.commands),
    skills: arr(obj.skills),
    agents: arr(obj.agents),
  };
}

/**
 * Strip optional YAML frontmatter from markdown content and return body only.
 * If no frontmatter (no leading ---), returns content as-is.
 */
function stripFrontmatter(content: string): string {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return content;
  const afterFirst = trimmed.slice(3);
  const endIdx = afterFirst.indexOf('\n---');
  if (endIdx === -1) return content;
  const body = afterFirst.slice(endIdx + 4).replace(/^\n+/, '');
  return body || '';
}

/** Cursor-specific constants; single source of truth for preset and config. */
const CURSOR_RULES_FRONTMATTER = '---\nalwaysApply: true\n---\n\n';

/**
 * Cursor preset config: content sync helpers and manifest type.
 * Single exported object for convenience and consistent access.
 */
export const cursorAgentPresetConfig = {
  /** Cursor-only constants; for shared subdirs/extensions use presetConstants. */
  CONSTANTS: {
    /** Runtime agent identifier for cursor. */
    AGENT_NAME: 'cursor',
    /** Frontmatter prepended to synced rule .mdc files. */
    CURSOR_RULES_FRONTMATTER,
    /** Env var that enables/disables cursor marketplace sync. */
    ENV_VAR: 'MMAAPPSS_MARKETPLACE_CURSOR',
    /** Plugin manifest key used to filter cursor-enabled plugins. */
    REQUIRED_MANIFEST_KEY: 'cursor' as const,
    /** Root output dir for cursor content (rules, commands, skills, agents). */
    TARGET_ROOT: '.cursor',
  } as const,

  /**
   * Remove all synced Cursor content using stored manifest content (e.g. from unified sync manifest).
   */
  clearCursorContentFromContents(
    repoRoot: string,
    contents: CursorContentSyncManifest
  ): Result<void, Error> {
    try {
      const manifest = normalizeCursorContentSyncManifest(contents);
      const allPaths = [
        ...manifest.rules,
        ...manifest.commands,
        ...manifest.skills,
        ...manifest.agents,
      ];
      syncFs.unlinkPaths(repoRoot, allPaths);
      const cursorDir = path.join(repoRoot, this.CONSTANTS.TARGET_ROOT);
      for (const sub of presetConstants.PLUGIN_CONTENT_DIRS) {
        syncFs.pruneEmptySubdirsThenParent(path.join(cursorDir, sub));
      }
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Sync all Cursor plugin content (rules as .mdc with frontmatter, commands/skills/agents as symlinks)
   * into .cursor/rules, .cursor/commands, .cursor/skills, .cursor/agents.
   * Caller registers result to unified manifest; no per-agent manifest file is written.
   * When clearFromContents is provided, clears from that before syncing.
   * Respects config.excluded (glob patterns for destination paths to skip).
   */
  syncCursorContent(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[],
    config?: Pick<MmaappssConfig, 'excluded'> | null,
    options?: { clearFromContents?: CursorContentSyncManifest }
  ): Result<CursorContentSyncManifest, Error> {
    if (options?.clearFromContents) {
      const clearResult = this.clearCursorContentFromContents(repoRoot, options.clearFromContents);
      if (clearResult.isErr()) return err(clearResult.error);
    }

    const allowedPluginNames = new Set(
      marketplaces.flatMap((m) =>
        m.plugins
          .filter((p) => p.manifests[this.CONSTANTS.AGENT_NAME as 'cursor'] === true)
          .map((p) => p.name)
      )
    );
    const cursorDir = path.join(repoRoot, this.CONSTANTS.TARGET_ROOT);
    for (const sub of presetConstants.PLUGIN_CONTENT_DIRS) {
      const parent = path.join(cursorDir, sub);
      if (!syncFs.pathExists(parent)) continue;
      const entries = syncFs.readdirWithTypes(parent);
      for (const ent of entries) {
        if (ent.isDirectory && !allowedPluginNames.has(ent.name)) {
          try {
            syncFs.rmSync(path.join(parent, ent.name), { recursive: true });
          } catch (e) {
            getLogger().warn(
              { dir: ent.name, err: e instanceof Error ? e.message : String(e) },
              'cursor-content-sync: cleanup of stale plugin dir failed'
            );
          }
        }
      }
    }

    const excluded = config?.excluded;
    const created: CursorContentSyncManifest = {
      rules: [],
      commands: [],
      skills: [],
      agents: [],
    };

    try {
      const rulesTarget = path.join(cursorDir, presetConstants.RULES_SUBDIR);
      const commandsTarget = path.join(cursorDir, presetConstants.COMMANDS_SUBDIR);
      const skillsTarget = path.join(cursorDir, presetConstants.SKILLS_SUBDIR);
      const agentsTarget = path.join(cursorDir, presetConstants.AGENTS_SUBDIR);
      const processedPluginNames = new Set<string>();

      for (const m of marketplaces) {
        for (const plugin of m.plugins) {
          if (plugin.manifests[this.CONSTANTS.AGENT_NAME as 'cursor'] !== true) continue;
          if (processedPluginNames.has(plugin.name)) continue;
          processedPluginNames.add(plugin.name);

          // --- Rules: copy to .mdc with frontmatter ---
          const rulesDir = path.join(plugin.path, presetConstants.RULES_SUBDIR);
          const ruleFiles = syncFs.listFiles(rulesDir, presetConstants.RULE_EXT);
          if (ruleFiles.length > 0) {
            syncFs.ensureDir(path.join(rulesTarget, plugin.name));
            for (const file of ruleFiles) {
              const srcPath = path.join(rulesDir, file);
              const base = path.basename(file, path.extname(file));
              const destPath = path.join(rulesTarget, plugin.name, `${base}.mdc`);
              const rel = path.relative(repoRoot, destPath);
              if (isExcluded(rel, excluded)) continue;
              const body = stripFrontmatter(syncFs.readFileUtf8(srcPath));
              syncFs.writeFileUtf8(destPath, this.CONSTANTS.CURSOR_RULES_FRONTMATTER + body);
              created.rules.push(rel);
            }
          }

          // --- Commands: symlink each file ---
          const commandsDir = path.join(plugin.path, presetConstants.COMMANDS_SUBDIR);
          const commandFiles = syncFs.listFiles(commandsDir, presetConstants.COMMAND_EXT);
          if (commandFiles.length > 0) {
            const pluginCommandsDir = path.join(commandsTarget, plugin.name);
            syncFs.ensureDir(pluginCommandsDir);
            for (const file of commandFiles) {
              const srcPath = path.join(commandsDir, file);
              const linkPath = path.join(pluginCommandsDir, file);
              const rel = path.relative(repoRoot, linkPath);
              if (isExcluded(rel, excluded)) continue;
              syncFs.symlinkRelative(srcPath, linkPath);
              created.commands.push(rel);
            }
          }

          // --- Skills: symlink each skill dir (skills/<name>/SKILL.md) ---
          const skillsDir = path.join(plugin.path, presetConstants.SKILLS_SUBDIR);
          const skillDirs = syncFs.listSubdirsWhere(skillsDir, (subPath) =>
            syncFs.isFile(path.join(subPath, 'SKILL.md'))
          );
          if (skillDirs.length > 0) {
            const pluginSkillsDir = path.join(skillsTarget, plugin.name);
            syncFs.ensureDir(pluginSkillsDir);
            for (const name of skillDirs) {
              const skillDirPath = path.join(skillsDir, name);
              const linkPath = path.join(pluginSkillsDir, name);
              const rel = path.relative(repoRoot, linkPath);
              if (isExcluded(rel, excluded)) continue;
              syncFs.symlinkRelative(skillDirPath, linkPath);
              created.skills.push(rel);
            }
          }

          // --- Agents: symlink each agent .md ---
          const agentsDir = path.join(plugin.path, presetConstants.AGENTS_SUBDIR);
          const agentFiles = syncFs.listFiles(agentsDir, presetConstants.AGENT_EXT);
          if (agentFiles.length > 0) {
            const pluginAgentsDir = path.join(agentsTarget, plugin.name);
            syncFs.ensureDir(pluginAgentsDir);
            for (const file of agentFiles) {
              const srcPath = path.join(agentsDir, file);
              const linkPath = path.join(pluginAgentsDir, file);
              const rel = path.relative(repoRoot, linkPath);
              if (isExcluded(rel, excluded)) continue;
              syncFs.symlinkRelative(srcPath, linkPath);
              created.agents.push(rel);
            }
          }
        }
      }

      return ok(created);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
};
