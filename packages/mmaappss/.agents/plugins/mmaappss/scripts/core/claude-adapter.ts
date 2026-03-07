/**
 * Claude Code adapter: .claude-plugin/marketplace.json, .claude/settings.json, rules symlinks.
 */

import type { AdapterAgentConfig } from './agent-adapter-base.js';
import { AgentAdapterBase } from './agent-adapter-base.js';

const CONFIG = {
  agent: 'claude' as const,
  manifestFilter: 'claude' as const,
  marketplaceFile: '.claude-plugin/marketplace.json',
  marketplaceName: 'mmaappss-plugins',
  rulesDir: '.claude/rules',
  settingsFile: '.claude/settings.json',
  sourceFormat: 'prefixed' as const,
  syncManifest: '.claude/.mmaappss-claude-sync.json',
  usesClaudeMdSymlink: true,
  usesMarketplaceJson: true,
  usesRulesSync: true,
  usesSettingsMerge: true,
} satisfies AdapterAgentConfig;

export const claudeAdapter = new (class ClaudeAdapter extends AgentAdapterBase {
  constructor() {
    super(CONFIG);
  }
})();
