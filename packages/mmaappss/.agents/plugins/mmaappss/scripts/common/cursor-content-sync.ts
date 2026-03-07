/**
 * Cursor content sync: copy/symlink plugin rules, commands, skills, and agents
 * into .cursor/*. Tracks all created paths in a manifest for teardown.
 * Cursor does not support local marketplace.json; we sync content instead.
 */

import { err, ok, Result } from 'neverthrow';
import path from 'node:path';
import type { MmaappssConfig } from './config-helpers.js';
import { syncFs } from './sync-fs.js';
import type { DiscoveredMarketplace } from './types.js';

const RULES_SUBDIR = 'rules';
const COMMANDS_SUBDIR = 'commands';
const SKILLS_SUBDIR = 'skills';
const AGENTS_SUBDIR = 'agents';

const CURSOR_RULES_FRONTMATTER = '---\nalwaysApply: true\n---\n\n';

const RULE_EXT = /\.(md|mdc|markdown)$/i;
const COMMAND_EXT = /\.(md|mdc|markdown|txt)$/i;
const AGENT_EXT = /\.(md|mdc|markdown)$/i;

const CURSOR_CONTENT_DIRS = ['rules', 'commands', 'skills', 'agents'] as const;

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

/** True if repo-relative destPath should be skipped (exact or under an excludeFiles entry). */
function isDestPathExcluded(destPathRel: string, excludeFiles: string[] | undefined): boolean {
  if (!excludeFiles?.length) return false;
  const normalized = destPathRel.replace(/\\/g, '/');
  for (const e of excludeFiles) {
    const entry = e.replace(/\\/g, '/');
    if (normalized === entry) return true;
    if (entry.endsWith('/') && normalized.startsWith(entry)) return true;
    if (!entry.endsWith('/') && (normalized === entry || normalized.startsWith(entry + '/')))
      return true;
  }
  return false;
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

/**
 * Sync all Cursor plugin content (rules as .mdc with frontmatter, commands/skills/agents as symlinks)
 * into .cursor/rules, .cursor/commands, .cursor/skills, .cursor/agents.
 * Writes manifest at manifestPath for teardown.
 * Respects config.excludeFiles (repo-relative destination paths to skip).
 */
export function syncCursorContent(
  repoRoot: string,
  marketplaces: DiscoveredMarketplace[],
  manifestPath: string,
  config?: Pick<MmaappssConfig, 'excludeFiles'> | null
): Result<CursorContentSyncManifest, Error> {
  const clearResult = clearCursorContent(repoRoot, manifestPath);
  if (clearResult.isErr()) return err(clearResult.error);

  const excludeFiles = config?.excludeFiles;
  const created: CursorContentSyncManifest = {
    rules: [],
    commands: [],
    skills: [],
    agents: [],
  };

  try {
    const cursorDir = path.join(repoRoot, '.cursor');
    const rulesTarget = path.join(cursorDir, 'rules');
    const commandsTarget = path.join(cursorDir, 'commands');
    const skillsTarget = path.join(cursorDir, 'skills');
    const agentsTarget = path.join(cursorDir, 'agents');

    for (const m of marketplaces) {
      for (const plugin of m.plugins) {
        if (!plugin.hasCursorManifest) continue;

        // --- Rules: copy to .mdc with frontmatter ---
        const rulesDir = path.join(plugin.path, RULES_SUBDIR);
        const ruleFiles = syncFs.listFiles(rulesDir, RULE_EXT);
        if (ruleFiles.length > 0) {
          syncFs.ensureDir(path.join(rulesTarget, plugin.name));
          for (const file of ruleFiles) {
            const srcPath = path.join(rulesDir, file);
            const base = path.basename(file, path.extname(file));
            const destPath = path.join(rulesTarget, plugin.name, `${base}.mdc`);
            const rel = path.relative(repoRoot, destPath);
            if (isDestPathExcluded(rel, excludeFiles)) continue;
            const body = stripFrontmatter(syncFs.readFileUtf8(srcPath));
            syncFs.writeFileUtf8(destPath, CURSOR_RULES_FRONTMATTER + body);
            created.rules.push(rel);
          }
        }

        // --- Commands: symlink each file ---
        const commandsDir = path.join(plugin.path, COMMANDS_SUBDIR);
        const commandFiles = syncFs.listFiles(commandsDir, COMMAND_EXT);
        if (commandFiles.length > 0) {
          const pluginCommandsDir = path.join(commandsTarget, plugin.name);
          syncFs.ensureDir(pluginCommandsDir);
          for (const file of commandFiles) {
            const srcPath = path.join(commandsDir, file);
            const linkPath = path.join(pluginCommandsDir, file);
            const rel = path.relative(repoRoot, linkPath);
            if (isDestPathExcluded(rel, excludeFiles)) continue;
            syncFs.symlinkRelative(srcPath, linkPath);
            created.commands.push(rel);
          }
        }

        // --- Skills: symlink each skill dir (skills/<name>/SKILL.md) ---
        const skillsDir = path.join(plugin.path, SKILLS_SUBDIR);
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
            if (isDestPathExcluded(rel, excludeFiles)) continue;
            syncFs.symlinkRelative(skillDirPath, linkPath);
            created.skills.push(rel);
          }
        }

        // --- Agents: symlink each agent .md ---
        const agentsDir = path.join(plugin.path, AGENTS_SUBDIR);
        const agentFiles = syncFs.listFiles(agentsDir, AGENT_EXT);
        if (agentFiles.length > 0) {
          const pluginAgentsDir = path.join(agentsTarget, plugin.name);
          syncFs.ensureDir(pluginAgentsDir);
          for (const file of agentFiles) {
            const srcPath = path.join(agentsDir, file);
            const linkPath = path.join(pluginAgentsDir, file);
            const rel = path.relative(repoRoot, linkPath);
            if (isDestPathExcluded(rel, excludeFiles)) continue;
            syncFs.symlinkRelative(srcPath, linkPath);
            created.agents.push(rel);
          }
        }
      }
    }

    const hasAny =
      created.rules.length > 0 ||
      created.commands.length > 0 ||
      created.skills.length > 0 ||
      created.agents.length > 0;

    if (hasAny) {
      syncFs.writeJsonManifest(manifestPath, created satisfies CursorContentSyncManifest);
    } else {
      syncFs.unlinkIfExists(manifestPath);
    }

    return ok(created);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Remove all synced Cursor content using the manifest. Idempotent.
 */
export function clearCursorContent(repoRoot: string, manifestPath: string): Result<void, Error> {
  try {
    const manifestResult = syncFs.readJsonManifest<CursorContentSyncManifest>(manifestPath);
    if (manifestResult.isErr()) {
      const e = manifestResult.error as Error & { code?: string };
      if (e.code === 'ENOENT') return ok(undefined);
      return err(manifestResult.error);
    }
    const manifest = normalizeCursorContentSyncManifest(manifestResult.value);

    const allPaths = [
      ...manifest.rules,
      ...manifest.commands,
      ...manifest.skills,
      ...manifest.agents,
    ];

    syncFs.unlinkPaths(repoRoot, allPaths);

    const cursorDir = path.join(repoRoot, '.cursor');
    for (const sub of CURSOR_CONTENT_DIRS) {
      syncFs.pruneEmptySubdirsThenParent(path.join(cursorDir, sub));
    }

    syncFs.unlinkIfExists(manifestPath);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
