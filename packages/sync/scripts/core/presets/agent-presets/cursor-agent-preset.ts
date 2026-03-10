import { err, ok } from 'neverthrow';
import type { DefineAgentInput } from '../../marketplaces-config.js';
import {
  cursorAgentPresetConfig,
  type CursorContentSyncManifest,
} from './cursor-agent-preset.config.js';

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
            if (
              entry &&
              typeof entry === 'object' &&
              entry.customData &&
              typeof entry.customData === 'object'
            ) {
              return cursorAgentPresetConfig.clearCursorContentFromContents(
                context.repoRoot,
                entry.customData as CursorContentSyncManifest
              );
            }
            return ok(undefined);
          },
          sync(context) {
            const entry = context.manifestContent;
            const clearFromContents: CursorContentSyncManifest | undefined =
              entry && typeof entry === 'object' && entry.customData
                ? (entry.customData as CursorContentSyncManifest)
                : undefined;
            const result = cursorAgentPresetConfig.syncCursorContent(
              context.repoRoot,
              context.marketplaces,
              context.tsConfig,
              { clearFromContents }
            );
            if (result.isErr()) return err(result.error);
            const key = context.currentBehaviorManifestKey ?? 'localPluginsContentSync';
            context.registerContentToMmaappssSyncManifest(context.agentName, key, {
              options: context.currentBehaviorOptionsForManifest,
              customData: result.value,
            });
            return ok(undefined);
          },
        },
        requiredManifestKey: C.REQUIRED_MANIFEST_KEY,
        targetRoot: C.TARGET_ROOT,
      },
    },
  },
};
