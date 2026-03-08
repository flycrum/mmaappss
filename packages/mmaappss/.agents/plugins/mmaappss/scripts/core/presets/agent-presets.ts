import type { PresetAgentName } from '../../common/preset-agents.js';
import type { DefineAgentInput } from '../marketplaces-config.js';
import { claudeAgentPreset } from './agent-presets/claude-agent-preset.js';
import { codexAgentPreset } from './agent-presets/codex-agent-preset.js';
import { cursorAgentPreset } from './agent-presets/cursor-agent-preset.js';

/** Built-in agent preset definitions composed from sync mode presets and options. */
export const agentPresetsAll: Record<PresetAgentName, DefineAgentInput> = {
  claude: claudeAgentPreset,
  codex: codexAgentPreset,
  cursor: cursorAgentPreset,
};

/** Back-compat alias for older imports; prefer `agentPresetsAll` going forward. */
export const agentPresets = agentPresetsAll;
