/**
 * Cursor adapter: sync plugin content (rules, commands, skills, agents) into .cursor/*.
 * Cursor does not support local marketplace.json; we copy/symlink content instead.
 */

import path from 'node:path';
import type { MmaappssConfig } from '../common/config-helpers.js';
import { clearCursorContent, syncCursorContent } from '../common/cursor-content-sync.js';
import type { DiscoveredMarketplace } from '../common/types.js';
import type { AdapterAgentConfig } from './agent-adapter-base.js';
import { AgentAdapterBase } from './agent-adapter-base.js';

const CURSOR_SYNC_MANIFEST = '.cursor/.mmaappss-cursor-sync.json';

const CONFIG = {
  agent: 'cursor' as const,
  contentSyncManifest: CURSOR_SYNC_MANIFEST,
  usesContentSync: true,
} satisfies AdapterAgentConfig;

export class CursorAdapter extends AgentAdapterBase {
  constructor() {
    super(CONFIG);
  }

  protected override syncContent(
    repoRoot: string,
    marketplaces: DiscoveredMarketplace[],
    tsConfig?: MmaappssConfig | null
  ): ReturnType<AgentAdapterBase['syncContent']> {
    const manifestPath = path.join(repoRoot, this.config.contentSyncManifest!);
    return syncCursorContent(repoRoot, marketplaces, manifestPath, tsConfig).map(() => undefined);
  }

  protected override teardownContent(
    repoRoot: string
  ): ReturnType<AgentAdapterBase['teardownContent']> {
    const manifestPath = path.join(repoRoot, this.config.contentSyncManifest!);
    return clearCursorContent(repoRoot, manifestPath);
  }
}

export const cursorAdapter = new CursorAdapter();
