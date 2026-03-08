import { AgentsMdSymlinkSyncMode } from '../sync-modes/agents-md-symlink-sync-mode.js';
import { LocalPluginsContentSyncMode } from '../sync-modes/local-plugins-content-sync-mode.js';
import { MarkdownSectionSyncMode } from '../sync-modes/markdown-section-sync-mode.js';
import { MarketplaceJsonSyncMode } from '../sync-modes/marketplace-json-sync-mode.js';
import { RulesSymlinkSyncMode } from '../sync-modes/rules-symlink-sync-mode.js';
import { SettingsSyncMode } from '../sync-modes/settings-sync-mode.js';

/** Built-in sync mode presets that map stable names to sync mode classes. */
export const syncModePresets = {
  agentsMdSymlink: {
    modeClass: AgentsMdSymlinkSyncMode,
  },
  localMarketplaceSync: {
    modeClass: MarketplaceJsonSyncMode,
  },
  localPluginsContentSync: {
    modeClass: LocalPluginsContentSyncMode,
  },
  markdownSectionSync: {
    modeClass: MarkdownSectionSyncMode,
  },
  rulesSymlink: {
    modeClass: RulesSymlinkSyncMode,
  },
  settingsSync: {
    modeClass: SettingsSyncMode,
  },
} as const;
