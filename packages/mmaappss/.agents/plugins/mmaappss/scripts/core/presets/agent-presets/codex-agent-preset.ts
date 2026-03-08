import { markdownSection } from '../../../common/markdown-section.js';
import type { DefineAgentInput } from '../../marketplaces-config.js';

/** Codex preset with policy-driven manifest defaults and sync-mode composition. */
export const codexAgentPreset: DefineAgentInput<'codex'> = {
  envVar: 'MMAAPPSS_MARKETPLACE_CODEX',
  name: 'codex',
  policy: {
    defaultManifestKey: 'codex',
  },
  syncModePresets: {
    markdownSectionSync: {
      options: {
        agentsFile: 'AGENTS.override.md',
        removeExistingSectionBlocks: true,
        sectionHeading: markdownSection.CODEX_SECTION_HEADING.replace(/^#+\s*/, ''),
      },
    },
  },
};
