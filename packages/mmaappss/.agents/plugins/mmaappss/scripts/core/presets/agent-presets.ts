import type { PresetAgentName } from '../../common/preset-agents.js';
import type { DefineAgentInput } from '../marketplaces-config.js';
import { claudeAgentPreset } from './agent-presets/claude-agent-preset.js';
import { codexAgentPreset } from './agent-presets/codex-agent-preset.js';
import { cursorAgentPreset } from './agent-presets/cursor-agent-preset.js';

/** Built-in agent preset definitions (object form; assignable to defineAgent first parameter). */
export const agentPresets: Record<PresetAgentName, DefineAgentInput> = {
  claude: claudeAgentPreset,
  codex: codexAgentPreset,
  cursor: cursorAgentPreset,
};
