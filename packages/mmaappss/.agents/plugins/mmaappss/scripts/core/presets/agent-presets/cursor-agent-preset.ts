import path from 'node:path';
import { cursorAgentPresetConfig } from './cursor-agent-preset.config.js';
import type { DefineAgentInput } from '../../marketplaces-config.js';

const CURSOR_MANIFEST_PATH = '.cursor/.mmaappss-cursor-sync.json';

/** Cursor preset: all Cursor-specific config and sync logic live here or in cursor-agent-preset.config. */
export const cursorAgentPreset: DefineAgentInput<'cursor'> = {
  envVar: 'MMAAPPSS_MARKETPLACE_CURSOR',
  name: 'cursor',
  syncModePresets: {
    localPluginsContentSync: {
      options: {
        customHandler: {
          clear(context) {
            return cursorAgentPresetConfig.clearCursorContent(
              context.repoRoot,
              path.join(context.repoRoot, CURSOR_MANIFEST_PATH)
            );
          },
          sync(context) {
            return cursorAgentPresetConfig
              .syncCursorContent(
                context.repoRoot,
                context.marketplaces,
                path.join(context.repoRoot, CURSOR_MANIFEST_PATH),
                context.tsConfig
              )
              .map(() => undefined);
          },
        },
        manifestPath: CURSOR_MANIFEST_PATH,
        requiredManifestKey: 'cursor',
        targetRoot: '.cursor',
      },
    },
  },
};
