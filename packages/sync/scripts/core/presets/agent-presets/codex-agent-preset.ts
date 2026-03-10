import type { DefineAgentInput } from '../../marketplaces-config.js';
import { codexAgentPresetConfig } from './codex-agent-preset.config.js';

const C = codexAgentPresetConfig.CONSTANTS;

/** Codex preset: sync-behavior composition and codex-specific paths/manifest key. */
export const codexAgentPreset: DefineAgentInput<'codex'> = {
  envVar: C.ENV_VAR,
  name: C.AGENT_NAME,
  syncBehaviorPresets: {
    markdownSectionSync: {
      options: {
        agentsFile: C.AGENTS_OVERRIDE_FILE,
        legacyHeadingsToRemove: [C.CODEX_LEGACY_HEADING],
        removeExistingSectionBlocks: true,
        removeOrphanBlocksFn: codexAgentPresetConfig.removeCodexLegacyOrphanBlocks,
        sectionHeading: C.CODEX_SECTION_HEADING.replace(/^#+\s*/, ''),
      },
    },
  },
};
