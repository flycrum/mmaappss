/**
 * Cursor adapter: .cursor-plugin/marketplace.json, rules symlinks.
 */

import { AgentAdapterBase } from './agent-adapter-base.js';

const CONFIG = {
  agent: 'cursor' as const,
  usesMarketplaceJson: true,
  manifestFilter: 'cursor' as const,
  sourceFormat: 'relative' as const,
  marketplaceFile: '.cursor-plugin/marketplace.json',
  usesRulesSync: true,
  rulesDir: '.cursor/rules',
  syncManifest: '.cursor/.mmaappss-cursor-sync.json',
  marketplaceName: 'mmaappss-plugins',
};

export const cursorAdapter = new (class CursorAdapter extends AgentAdapterBase {
  constructor() {
    super(CONFIG);
  }
})();
