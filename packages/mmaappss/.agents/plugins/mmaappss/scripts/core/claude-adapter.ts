/**
 * Claude Code adapter: .claude-plugin/marketplace.json, .claude/settings.json, rules symlinks.
 */

import { AgentAdapterBase } from './agent-adapter-base.js';

const CONFIG = {
  agent: 'claude' as const,
  usesMarketplaceJson: true,
  manifestFilter: 'claude' as const,
  sourceFormat: 'prefixed' as const,
  marketplaceFile: '.claude-plugin/marketplace.json',
  usesRulesSync: true,
  rulesDir: '.claude/rules',
  syncManifest: '.claude/.mmaappss-claude-sync.json',
  usesSettingsMerge: true,
  settingsFile: '.claude/settings.json',
  marketplaceName: 'mmaappss-plugins',
};

export const claudeAdapter = new (class ClaudeAdapter extends AgentAdapterBase {
  constructor() {
    super(CONFIG);
  }
})();
