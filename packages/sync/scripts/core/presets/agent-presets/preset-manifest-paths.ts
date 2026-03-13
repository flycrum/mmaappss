/**
 * Builds MANIFEST_PATHS and native paths from preset configs so discovery and sync behaviors use a single source of truth.
 * Do not hard-code manifest paths or native skills dirs elsewhere.
 */

import type { PluginManifestKey } from '../../../common/types.js';
import { claudeAgentPresetConfig } from './claude-agent-preset.config.js';
import { codexAgentPresetConfig } from './codex-agent-preset.config.js';
import { cursorAgentPresetConfig } from './cursor-agent-preset.config.js';

/** Plugin manifest path per preset agent; used by discovery to detect plugin capability. */
export const PRESET_MANIFEST_PATHS: Record<PluginManifestKey, string> = {
  claude: claudeAgentPresetConfig.CONSTANTS.PLUGIN_MANIFEST_PATH,
  codex: codexAgentPresetConfig.CONSTANTS.PLUGIN_MANIFEST_PATH,
  cursor: cursorAgentPresetConfig.CONSTANTS.PLUGIN_MANIFEST_PATH,
};

/** Native skills dir per preset agent (where that agent discovers skills). Used by skills-directory sync to decide no-op vs sync. */
export const PRESET_NATIVE_SKILLS_DIR: Record<string, string> = {
  claude: claudeAgentPresetConfig.BASE_PRESET_OPTIONS.NATIVE_SKILLS_DIR,
  codex: codexAgentPresetConfig.BASE_PRESET_OPTIONS.NATIVE_SKILLS_DIR,
  cursor: cursorAgentPresetConfig.BASE_PRESET_OPTIONS.NATIVE_SKILLS_DIR,
};

/** Returns the native skills path for an agent (e.g. `.claude/skills` for Claude). */
export function getNativeSkillsDirForAgent(agentName: string): string {
  const dir = PRESET_NATIVE_SKILLS_DIR[agentName];
  return dir ?? '';
}
