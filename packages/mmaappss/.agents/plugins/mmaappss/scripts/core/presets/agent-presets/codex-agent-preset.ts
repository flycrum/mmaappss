import type { DefineAgentInput } from '../../marketplaces-config.js';
import { codexAgentPresetConfig } from './codex-agent-preset.config.js';

/** Codex preset: sync-mode composition and codex-specific paths/manifest key. */
export const codexAgentPreset: DefineAgentInput<'codex'> = {
  envVar: 'MMAAPPSS_MARKETPLACE_CODEX',
  name: 'codex',
  syncModePresets: {
    markdownSectionSync: {
      options: {
        agentsFile: 'AGENTS.override.md',
        legacyHeadingsToRemove: [codexAgentPresetConfig.CODEX_LEGACY_HEADING],
        removeExistingSectionBlocks: true,
        removeOrphanBlocksFn: codexAgentPresetConfig.removeCodexLegacyOrphanBlocks,
        sectionHeading: codexAgentPresetConfig.CODEX_SECTION_HEADING.replace(/^#+\s*/, ''),
      },
    },
  },
};
