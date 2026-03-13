/**
 * Base preset options: single source of truth for agent-agnostic path and filename defaults.
 * Each agent preset extends this class and overrides AGENT_NAME; optional native paths (e.g. NATIVE_SKILLS_DIR)
 * declare where that agent natively discovers content. Config.basePresetOptions can override path-related fields globally.
 */

import { presetPathHelpers } from './preset-path-helpers.js';

/** Default path/filename values for repo-level agents dir, plugins, and skills. */
export const DEFAULT_BASE_PRESET_OPTIONS = {
  AGENT_MD_FILENAME: 'AGENTS.md',
  AGENTS_PLUGINS_DIR: 'plugins/',
  AGENTS_SKILLS_DIR: 'skills/',
  AGENTS_SOURCE_DIR: '.agents/',
} as const;

/** Shape for config.basePresetOptions (excludes AGENT_NAME; used to override path defaults globally). */
export type BasePresetOptionsOverride = Partial<{
  AGENT_MD_FILENAME: string;
  AGENTS_PLUGINS_DIR: string;
  AGENTS_SKILLS_DIR: string;
  AGENTS_SOURCE_DIR: string;
}>;

/**
 * Base class for agent preset options. Subclasses override AGENT_NAME and may set NATIVE_SKILLS_DIR, PLUGIN_MANIFEST_PATH.
 */
export class MmaappssBasePresetOptions {
  AGENT_MD_FILENAME = DEFAULT_BASE_PRESET_OPTIONS.AGENT_MD_FILENAME;
  AGENTS_PLUGINS_DIR = DEFAULT_BASE_PRESET_OPTIONS.AGENTS_PLUGINS_DIR;
  AGENTS_SKILLS_DIR = DEFAULT_BASE_PRESET_OPTIONS.AGENTS_SKILLS_DIR;
  AGENTS_SOURCE_DIR = DEFAULT_BASE_PRESET_OPTIONS.AGENTS_SOURCE_DIR;
  /** Override in subclass; required for each agent. */
  AGENT_NAME!: string;
}

/**
 * Effective base options for path resolution: defaults merged with optional config override.
 * Used by discovery and sync behaviors to resolve plugins dir and skills dir without hard-coding.
 */
export function getEffectiveBaseOptions(override: BasePresetOptionsOverride | null | undefined): {
  AGENT_MD_FILENAME: string;
  AGENTS_PLUGINS_DIR: string;
  AGENTS_SKILLS_DIR: string;
  AGENTS_SOURCE_DIR: string;
} {
  const o = override ?? {};
  return {
    AGENT_MD_FILENAME: o.AGENT_MD_FILENAME ?? DEFAULT_BASE_PRESET_OPTIONS.AGENT_MD_FILENAME,
    AGENTS_PLUGINS_DIR: o.AGENTS_PLUGINS_DIR ?? DEFAULT_BASE_PRESET_OPTIONS.AGENTS_PLUGINS_DIR,
    AGENTS_SKILLS_DIR: o.AGENTS_SKILLS_DIR ?? DEFAULT_BASE_PRESET_OPTIONS.AGENTS_SKILLS_DIR,
    AGENTS_SOURCE_DIR: o.AGENTS_SOURCE_DIR ?? DEFAULT_BASE_PRESET_OPTIONS.AGENTS_SOURCE_DIR,
  };
}

/**
 * Resolved repo-relative path for plugins dir (e.g. `.agents/plugins`).
 * Uses path helper to avoid double slash or missing slash.
 */
export function getResolvedPluginsPath(
  override: BasePresetOptionsOverride | null | undefined
): string {
  const opts = getEffectiveBaseOptions(override);
  return presetPathHelpers.joinSegments(opts.AGENTS_SOURCE_DIR, opts.AGENTS_PLUGINS_DIR);
}

/**
 * Resolved repo-relative path for skills dir (e.g. `.agents/skills`).
 */
export function getResolvedSkillsPath(
  override: BasePresetOptionsOverride | null | undefined
): string {
  const opts = getEffectiveBaseOptions(override);
  return presetPathHelpers.joinSegments(opts.AGENTS_SOURCE_DIR, opts.AGENTS_SKILLS_DIR);
}
