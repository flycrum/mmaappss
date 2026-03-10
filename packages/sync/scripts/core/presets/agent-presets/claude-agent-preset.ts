import type { DefineAgentInput } from '../../marketplaces-config.js';
import { claudeAgentPresetConfig } from './claude-agent-preset.config.js';
import { presetConstants } from './preset-constants.js';

const C = claudeAgentPresetConfig.CONSTANTS;

/** Claude preset: all Claude-specific choices (paths, filenames, manifest key) are defined here. */
export const claudeAgentPreset: DefineAgentInput<'claude'> = {
  envVar: C.ENV_VAR,
  name: C.AGENT_NAME,
  syncBehaviorPresets: {
    agentsMdSymlink: {
      options: {
        sourceFile: C.SOURCE_FILE,
        targetFile: C.TARGET_FILE,
        gitignoreComment: C.GITIGNORE_COMMENT,
        gitignoreEntry: C.GITIGNORE_ENTRY,
      },
    },
    localMarketplaceSync: {
      options: {
        manifestKey: C.MANIFEST_KEY,
        marketplaceFile: C.MARKETPLACE_FILE,
        marketplaceName: presetConstants.DEFAULT_MARKETPLACE_NAME,
        sourceFormat: 'prefixed',
      },
    },
    rulesSymlink: {
      options: {
        rulesDir: C.RULES_DIR,
        syncManifest: C.RULES_SYNC_MANIFEST,
      },
    },
    settingsSync: {
      options: {
        manifestKey: C.MANIFEST_KEY,
        marketplaceName: presetConstants.DEFAULT_MARKETPLACE_NAME,
        settingsFile: C.SETTINGS_FILE,
      },
    },
  },
};
