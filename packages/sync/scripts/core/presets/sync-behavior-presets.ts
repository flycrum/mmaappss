import { AgentsMdSymlinkSyncBehavior } from '../sync-behaviors/agents-md-symlink-sync-behavior.js';
import { ClaudeLocalPluginCacheBustBehavior } from '../sync-behaviors/claude-local-plugin-cache-bust-behavior.js';
import { LocalPluginsContentSyncBehavior } from '../sync-behaviors/local-plugins-content-sync-behavior.js';
import { MarkdownSectionSyncBehavior } from '../sync-behaviors/markdown-section-sync-behavior.js';
import { MarketplaceJsonSyncBehavior } from '../sync-behaviors/marketplace-json-sync-behavior.js';
import { RulesSymlinkSyncBehavior } from '../sync-behaviors/rules-symlink-sync-behavior.js';
import { SettingsSyncBehavior } from '../sync-behaviors/settings-sync-behavior.js';
import { SkillsDirectorySyncBehavior } from '../sync-behaviors/skills-directory-sync-behavior.js';

/** Built-in sync behavior presets that map stable names to sync behavior classes. */
export const syncBehaviorPresets = {
  agentsMdSymlink: {
    behaviorClass: AgentsMdSymlinkSyncBehavior,
  },
  claudeLocalPluginCacheBust: {
    behaviorClass: ClaudeLocalPluginCacheBustBehavior,
  },
  localMarketplaceSync: {
    behaviorClass: MarketplaceJsonSyncBehavior,
  },
  localPluginsContentSync: {
    behaviorClass: LocalPluginsContentSyncBehavior,
  },
  markdownSectionSync: {
    behaviorClass: MarkdownSectionSyncBehavior,
  },
  rulesSymlink: {
    behaviorClass: RulesSymlinkSyncBehavior,
  },
  settingsSync: {
    behaviorClass: SettingsSyncBehavior,
  },
  skillsDirectorySync: {
    behaviorClass: SkillsDirectorySyncBehavior,
  },
} as const;
