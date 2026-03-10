import { ok, Result } from 'neverthrow';
import {
  clearAgentsMdSymlinks,
  syncAgentsMdSymlinks,
  type AgentsMdSymlinkOptions,
} from '../../common/agents-md-symlink-sync.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Sync behavior that manages sourceFile→targetFile symlink lifecycle (e.g. AGENTS.md→CLAUDE.md). */
export class AgentsMdSymlinkSyncBehavior extends SyncBehaviorBase<AgentsMdSymlinkOptions> {
  constructor(options?: AgentsMdSymlinkOptions) {
    super(options);
  }

  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    return syncAgentsMdSymlinks(context.repoRoot, context.tsConfig, options).map(() => undefined);
  }

  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    return clearAgentsMdSymlinks(context.repoRoot, options);
  }

  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    return clearAgentsMdSymlinks(context.repoRoot, options);
  }
}
