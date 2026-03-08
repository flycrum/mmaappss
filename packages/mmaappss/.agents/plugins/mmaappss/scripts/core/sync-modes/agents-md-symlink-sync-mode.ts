import { ok, Result } from 'neverthrow';
import {
  clearAgentsMdSymlinks,
  syncAgentsMdSymlinks,
  type AgentsMdSymlinkOptions,
} from '../../common/agents-md-symlink-sync.js';
import { SyncModeBase, type SyncModeContext } from './sync-mode-base.js';

/** Sync mode that manages sourceFile→targetFile symlink lifecycle (e.g. AGENTS.md→CLAUDE.md). */
class AgentsMdSymlinkSyncMode extends SyncModeBase<AgentsMdSymlinkOptions> {
  override syncRunEnabled(context: SyncModeContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    return syncAgentsMdSymlinks(context.repoRoot, context.tsConfig, options).map(() => undefined);
  }

  override syncRunDisabled(context: SyncModeContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    return clearAgentsMdSymlinks(context.repoRoot, options);
  }

  override clearRun(context: SyncModeContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    return clearAgentsMdSymlinks(context.repoRoot, options);
  }
}

export const agentsMdSymlinkSyncMode = {
  AgentsMdSymlinkSyncMode,
};
export type { AgentsMdSymlinkOptions };
