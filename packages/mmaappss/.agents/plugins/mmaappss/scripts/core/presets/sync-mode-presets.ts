import { agentsMdSymlinkSyncMode } from '../sync-modes/agents-md-symlink-sync-mode.js';
import { localPluginsContentSyncMode } from '../sync-modes/local-plugins-content-sync-mode.js';
import { markdownSectionSyncMode } from '../sync-modes/markdown-section-sync-mode.js';
import { marketplaceJsonSyncMode } from '../sync-modes/marketplace-json-sync-mode.js';
import { rulesSymlinkSyncMode } from '../sync-modes/rules-symlink-sync-mode.js';
import { settingsSyncMode } from '../sync-modes/settings-sync-mode.js';

/** Built-in sync mode presets that map stable names to sync mode classes. */
export const syncModePresets = {
  agentsMdSymlink: {
    modeClass: agentsMdSymlinkSyncMode.AgentsMdSymlinkSyncMode,
  },
  localMarketplaceSync: {
    modeClass: marketplaceJsonSyncMode.MarketplaceJsonSyncMode,
  },
  localPluginsContentSync: {
    modeClass: localPluginsContentSyncMode.LocalPluginsContentSyncMode,
  },
  markdownSectionSync: {
    modeClass: markdownSectionSyncMode.MarkdownSectionSyncMode,
  },
  rulesSymlink: {
    modeClass: rulesSymlinkSyncMode.RulesSymlinkSyncMode,
  },
  settingsSync: {
    modeClass: settingsSyncMode.SettingsSyncMode,
  },
} as const;
