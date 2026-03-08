import { markdownSection } from '../../common/markdown-section.js';
import type { PresetAgentName } from '../../common/preset-agents.js';
import type { DefineAgentInput } from '../marketplaces-config.js';

/** Built-in agent preset definitions composed from sync mode presets and options. */
export const agentPresets: Record<PresetAgentName, DefineAgentInput> = {
  claude: {
    envVar: 'MMAAPPSS_MARKETPLACE_CLAUDE',
    name: 'claude',
    syncModePresets: {
      agentsMdSymlink: true,
      localMarketplaceSync: {
        options: {
          manifestFilter: 'claude',
          marketplaceFile: '.claude-plugin/marketplace.json',
          marketplaceName: 'mmaappss-plugins',
          sourceFormat: 'prefixed',
        },
      },
      rulesSymlink: {
        options: {
          rulesDir: '.claude/rules',
          syncManifest: '.claude/.mmaappss-claude-sync.json',
        },
      },
      settingsSync: {
        options: {
          manifestFilter: 'claude',
          marketplaceName: 'mmaappss-plugins',
          settingsFile: '.claude/settings.json',
        },
      },
    },
  },
  codex: {
    envVar: 'MMAAPPSS_MARKETPLACE_CODEX',
    name: 'codex',
    syncModePresets: {
      markdownSectionSync: {
        options: {
          agentsFile: 'AGENTS.override.md',
          removeExistingSectionBlocks: true,
          sectionHeading: markdownSection.CODEX_SECTION_HEADING.replace(/^#+\s*/, ''),
        },
      },
    },
  },
  cursor: {
    envVar: 'MMAAPPSS_MARKETPLACE_CURSOR',
    name: 'cursor',
    syncModePresets: {
      localPluginsContentSync: {
        options: {
          manifestPath: '.cursor/.mmaappss-cursor-sync.json',
          requiredManifest: 'cursor',
          strategy: 'cursorCompatible',
          targetRoot: '.cursor',
        },
      },
    },
  },
};
