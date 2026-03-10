import { ok, Result } from 'neverthrow';
import path from 'node:path';
import { rulesSync } from '../../common/rules-sync.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Options for symlinking rules and tracking their manifest file. */
export interface RulesSymlinkSyncBehaviorOptions {
  /** Target rules directory where plugin rules are linked. */
  rulesDir: string;
  /** Manifest file storing created link paths for teardown. */
  syncManifest: string;
}

export class RulesSymlinkSyncBehavior extends SyncBehaviorBase<RulesSymlinkSyncBehaviorOptions> {
  constructor(options?: RulesSymlinkSyncBehaviorOptions) {
    super(options);
  }

  /** Clears all previously managed rules links for this behavior. */
  private clearRules(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    return rulesSync.clearRules(
      context.repoRoot,
      path.join(context.repoRoot, options.rulesDir),
      path.join(context.repoRoot, options.syncManifest)
    );
  }

  /** Sync-phase enabled hook that recreates and records rules symlinks. */
  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const clearResult = this.clearRules(context);
    if (clearResult.isErr()) return clearResult;
    return rulesSync
      .syncRules(
        context.repoRoot,
        context.marketplaces,
        path.join(context.repoRoot, options.rulesDir),
        path.join(context.repoRoot, options.syncManifest)
      )
      .map(() => undefined);
  }

  /** Sync-phase disabled hook that tears down rules symlinks. */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    return this.clearRules(context);
  }

  /** Clear hook that tears down rules symlinks. */
  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    return this.clearRules(context);
  }
}
