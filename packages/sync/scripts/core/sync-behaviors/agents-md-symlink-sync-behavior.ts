import { err, ok, Result } from 'neverthrow';
import {
  agentsMdSymlinkSync,
  type AgentsMdSymlinkOptions,
} from '../../common/agents-md-symlink-sync.js';
import { syncManifest } from '../../common/sync-manifest.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Sync behavior that manages sourceFile→targetFile symlink lifecycle (e.g. AGENTS.md→CLAUDE.md). Central teardown unlinks symlinks. */
export class AgentsMdSymlinkSyncBehavior extends SyncBehaviorBase<AgentsMdSymlinkOptions> {
  constructor(options?: AgentsMdSymlinkOptions) {
    super(options);
  }

  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const result = agentsMdSymlinkSync.sync(
      context.repoRoot,
      context.tsConfig,
      options,
      context.outputRoot
    );
    if (result.isErr()) return err(result.error);
    const key = context.currentBehaviorManifestKey ?? 'agentsMdSymlink';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      symlinks: result.value,
    });
    return ok(undefined);
  }

  /** When behavior is disabled during sync, teardown this entry (unlink symlinks). */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') syncManifest.teardownEntry(context.outputRoot, entry);
    return ok(undefined);
  }

  override clearRun(): Result<void, Error> {
    return ok(undefined);
  }
}
