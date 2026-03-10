import { err, ok } from 'neverthrow';
import { syncManifest } from '../../../common/sync-manifest.js';
import type { DefineAgentInput } from '../../marketplaces-config.js';
import { cursorAgentPresetConfig } from './cursor-agent-preset.config.js';

const C = cursorAgentPresetConfig.CONSTANTS;

/** Cursor preset: all Cursor-specific config and sync logic live here or in cursor-agent-preset.config. */
export const cursorAgentPreset: DefineAgentInput<'cursor'> = {
  envVar: C.ENV_VAR,
  name: C.AGENT_NAME,
  syncBehaviorPresets: {
    localPluginsContentSync: {
      options: {
        customHandler: {
          clear(context) {
            const entry = context.manifestContent;
            if (entry && typeof entry === 'object')
              syncManifest.teardownEntry(context.repoRoot, entry);
            cursorAgentPresetConfig.pruneCursorContentDirs(context.repoRoot);
            return ok(undefined);
          },
          sync(context) {
            const entry = context.manifestContent;
            if (entry && typeof entry === 'object') {
              syncManifest.teardownEntry(context.repoRoot, entry);
            }
            cursorAgentPresetConfig.pruneCursorContentDirs(context.repoRoot);
            const result = cursorAgentPresetConfig.syncCursorContent(
              context.repoRoot,
              context.marketplaces,
              context.tsConfig
            );
            if (result.isErr()) return err(result.error);
            const key = context.currentBehaviorManifestKey ?? 'localPluginsContentSync';
            const v = result.value;
            context.registerContentToMmaappssSyncManifest(context.agentName, key, {
              options: context.currentBehaviorOptionsForManifest,
              symlinks: [...v.commands, ...v.skills, ...v.agents],
              fsAutoRemoval: v.rules,
            });
            return ok(undefined);
          },
        },
        requiredManifestKey: C.AGENT_NAME,
        targetRoot: C.TARGET_ROOT,
      },
    },
  },
};
