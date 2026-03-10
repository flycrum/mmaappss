import { err, ok, Result } from 'neverthrow';
import path from 'node:path';
import { rulesSync } from '../../common/rules-sync.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Options for symlinking rules and tracking their manifest file. */
export interface RulesSymlinkSyncBehaviorOptions {
  /** Target rules directory where plugin rules are linked. */
  rulesDir: string;
  /** Manifest file storing created link paths for teardown (legacy; unified manifest used when available). */
  syncManifest: string;
}

/** Custom data registered by this behavior (rule paths for teardown). */
export interface RulesSymlinkCustomData {
  rules: string[];
}

export class RulesSymlinkSyncBehavior extends SyncBehaviorBase<RulesSymlinkSyncBehaviorOptions> {
  constructor(options?: RulesSymlinkSyncBehaviorOptions) {
    super(options);
  }

  /** Clears rules from stored manifest entry (unified manifest). */
  private clearFromContents(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (!entry || typeof entry !== 'object' || !entry.customData) return ok(undefined);
    const options = this.options;
    if (!options) return ok(undefined);
    return rulesSync.clearRulesFromContents(
      context.repoRoot,
      path.join(context.repoRoot, options.rulesDir),
      entry.customData as RulesSymlinkCustomData
    );
  }

  /** Sync-phase enabled hook that recreates and records rules symlinks. */
  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const clearResult = this.clearFromContents(context);
    if (clearResult.isErr()) return clearResult;
    const result = rulesSync.syncRules(
      context.repoRoot,
      context.marketplaces,
      path.join(context.repoRoot, options.rulesDir),
      path.join(context.repoRoot, options.syncManifest),
      true
    );
    if (result.isErr()) return err(result.error);
    const key = context.currentBehaviorManifestKey ?? 'rulesSymlink';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      customData: { rules: result.value } satisfies RulesSymlinkCustomData,
    });
    return ok(undefined);
  }

  /** Sync-phase disabled hook that tears down rules symlinks. */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    return this.clearFromContents(context);
  }

  /** Clear hook that tears down rules symlinks. */
  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    return this.clearFromContents(context);
  }
}
