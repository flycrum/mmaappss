import { err, ok, Result } from 'neverthrow';
import { pathHelpers } from '../../common/path-helpers.js';
import { rulesSync } from '../../common/rules-sync.js';
import { syncFs } from '../../common/sync-fs.js';
import { syncManifest } from '../../common/sync-manifest.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Options for symlinking rules and tracking their manifest file. */
export interface RulesSymlinkSyncBehaviorOptions {
  /** Target rules directory where plugin rules are linked. */
  rulesDir: string;
  /** Manifest file storing created link paths for teardown (legacy; unified manifest used when available). */
  syncManifest: string;
}

export class RulesSymlinkSyncBehavior extends SyncBehaviorBase<RulesSymlinkSyncBehaviorOptions> {
  constructor(options?: RulesSymlinkSyncBehaviorOptions) {
    super(options);
  }

  /** Sync-phase enabled hook that recreates and records rules symlinks. Central teardown unlinks; clearRun prunes empty dirs. */
  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const rulesTargetDir = pathHelpers.joinRepo(context.repoRoot, options.rulesDir);
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') {
      syncManifest.teardownEntry(context.repoRoot, entry);
    }
    syncFs.pruneEmptySubdirsThenParent(rulesTargetDir);
    const result = rulesSync.syncRules(
      context.repoRoot,
      context.marketplaces,
      rulesTargetDir,
      pathHelpers.joinRepo(context.repoRoot, options.syncManifest),
      true
    );
    if (result.isErr()) return err(result.error);
    const key = context.currentBehaviorManifestKey ?? 'rulesSymlink';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      symlinks: result.value,
    });
    return ok(undefined);
  }

  /** When behavior is disabled during sync, teardown this entry then prune so .claude/rules is cleared. */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') syncManifest.teardownEntry(context.repoRoot, entry);
    const options = this.options;
    if (options) {
      const rulesTargetDir = pathHelpers.joinRepo(context.repoRoot, options.rulesDir);
      syncFs.pruneEmptySubdirsThenParent(rulesTargetDir);
    }
    return ok(undefined);
  }

  /** Teardown entry (when called for disabled behavior) then prune. When called from full clear, central teardown already unlinked; this prunes. */
  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') syncManifest.teardownEntry(context.repoRoot, entry);
    const rulesTargetDir = pathHelpers.joinRepo(context.repoRoot, options.rulesDir);
    syncFs.pruneEmptySubdirsThenParent(rulesTargetDir);
    return ok(undefined);
  }
}
