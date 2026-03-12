import type { DefineAgentInput } from '../../marketplaces-config.js';
import { presetConstants } from '../agent-preset-constants.js';
import { claudeAgentPresetConfig } from './claude-agent-preset.config.js';

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
        gitignoreEntry: C.TARGET_FILE,
      },
    },
    claudeLocalPluginCacheBust: {
      options: {
        marketplaceFile: C.MARKETPLACE_FILE,
      },
    },
    localMarketplaceSync: {
      options: {
        manifestKey: C.AGENT_NAME,
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
        manifestKey: C.AGENT_NAME,
        marketplaceName: presetConstants.DEFAULT_MARKETPLACE_NAME,
        settingsFile: C.SETTINGS_FILE,
      },
    },
  },
};
