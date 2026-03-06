/**
 * Cursor adapter: .cursor-plugin/marketplace.json, rules symlinks.
 */

import type { AdapterAgentConfig } from './agent-adapter-base.js';
import { AgentAdapterBase } from './agent-adapter-base.js';

const CONFIG = {
  agent: 'cursor' as const,
  manifestFilter: 'cursor' as const,
  marketplaceFile: '.cursor-plugin/marketplace.json',
  marketplaceName: 'mmaappss-plugins',
  rulesDir: '.cursor/rules',
  sourceFormat: 'relative' as const,
  syncManifest: '.cursor/.mmaappss-cursor-sync.json',
  usesMarketplaceJson: true,
  usesRulesSync: true,
} satisfies AdapterAgentConfig;

export const cursorAdapter = new (class CursorAdapter extends AgentAdapterBase {
  constructor() {
    super(CONFIG);
  }
})();
