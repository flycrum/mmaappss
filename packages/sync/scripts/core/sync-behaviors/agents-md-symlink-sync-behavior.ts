import { err, ok, Result } from 'neverthrow';
import {
  agentsMdSymlinkSync,
  type AgentsMdSymlinkOptions,
} from '../../common/agents-md-symlink-sync.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Custom data registered by this behavior (paths created for teardown). */
export interface AgentsMdSymlinkCustomData {
  paths: string[];
}

/** Sync behavior that manages sourceFile→targetFile symlink lifecycle (e.g. AGENTS.md→CLAUDE.md). */
export class AgentsMdSymlinkSyncBehavior extends SyncBehaviorBase<AgentsMdSymlinkOptions> {
  constructor(options?: AgentsMdSymlinkOptions) {
    super(options);
  }

  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const result = agentsMdSymlinkSync.sync(context.repoRoot, context.tsConfig, options);
    if (result.isErr()) return err(result.error);
    const key = context.currentBehaviorManifestKey ?? 'agentsMdSymlink';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      customData: { paths: result.value } satisfies AgentsMdSymlinkCustomData,
    });
    return ok(undefined);
  }

  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object' && entry.customData) {
      return agentsMdSymlinkSync.clearFromContents(
        context.repoRoot,
        entry.customData as AgentsMdSymlinkCustomData
      );
    }
    return ok(undefined);
  }

  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object' && entry.customData) {
      return agentsMdSymlinkSync.clearFromContents(
        context.repoRoot,
        entry.customData as AgentsMdSymlinkCustomData
      );
    }
    return ok(undefined);
  }
}
