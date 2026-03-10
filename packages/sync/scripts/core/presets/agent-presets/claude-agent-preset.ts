import type { DefineAgentInput } from '../../marketplaces-config.js';

/** Claude preset: all Claude-specific choices (paths, filenames, manifest key) are defined here. */
export const claudeAgentPreset: DefineAgentInput<'claude'> = {
  envVar: 'MMAAPPSS_MARKETPLACE_CLAUDE',
  name: 'claude',
  syncBehaviorPresets: {
    agentsMdSymlink: {
      options: {
        sourceFile: 'AGENTS.md',
        targetFile: 'CLAUDE.md',
        manifestPath: '.claude/.mmaappss-claude-md-sync.json',
        gitignoreComment: '\n# mmaappss: symlinked from AGENTS.md for Claude\n',
        gitignoreEntry: 'CLAUDE.md',
      },
    },
    localMarketplaceSync: {
      options: {
        manifestKey: 'claude',
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
        manifestKey: 'claude',
        marketplaceName: 'mmaappss-plugins',
        settingsFile: '.claude/settings.json',
      },
    },
  },
};
