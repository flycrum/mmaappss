import type { DefineAgentInput } from '../../marketplaces-config.js';

/** Cursor preset with policy-driven manifest defaults and sync-mode composition. */
export const cursorAgentPreset: DefineAgentInput<'cursor'> = {
  envVar: 'MMAAPPSS_MARKETPLACE_CURSOR',
  name: 'cursor',
  policy: {
    defaultManifestKey: 'cursor',
  },
  syncModePresets: {
    localPluginsContentSync: {
      options: {
        manifestPath: '.cursor/.mmaappss-cursor-sync.json',
        requiredManifestKey: 'cursor',
        strategy: 'cursorCompatible',
        targetRoot: '.cursor',
      },
    },
  },
};
