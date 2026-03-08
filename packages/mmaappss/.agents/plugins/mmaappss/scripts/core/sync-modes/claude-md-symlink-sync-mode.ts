import { Result } from 'neverthrow';
import { claudeMdSync } from '../../common/claude-md-sync.js';
import { SyncModeBase, type SyncModeContext } from './sync-mode-base.js';

/** Sync mode that manages `CLAUDE.md` symlink lifecycle. */
class ClaudeMdSymlinkSyncMode extends SyncModeBase {
  /** Sync-phase enabled hook that creates `CLAUDE.md` symlinks from `AGENTS.md`. */
  override syncRunEnabled(context: SyncModeContext): Result<void, Error> {
    return claudeMdSync.syncClaudeMd(context.repoRoot, context.tsConfig).map(() => undefined);
  }

  /** Sync-phase disabled hook that removes managed `CLAUDE.md` symlinks. */
  override syncRunDisabled(context: SyncModeContext): Result<void, Error> {
    return claudeMdSync.clearClaudeMd(context.repoRoot);
  }

  /** Clear hook that removes managed `CLAUDE.md` symlinks. */
  override clearRun(context: SyncModeContext): Result<void, Error> {
    return claudeMdSync.clearClaudeMd(context.repoRoot);
  }
}

/** Named export wrapper for Claude md symlink sync mode class. */
export const claudeMdSymlinkSyncMode = {
  ClaudeMdSymlinkSyncMode,
};
