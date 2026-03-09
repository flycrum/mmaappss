import { describe, expect, it } from 'vitest';
import { marketplacesConfig } from './marketplaces-config.js';

describe('marketplacesConfig', () => {
  it('defineAgent resolves preset and custom sync modes', () => {
    const agent = marketplacesConfig.defineAgent(({ syncModePresets }) => ({
      name: 'cursor',
      syncModePresets: {
        localPluginsContentSync: true,
      },
      syncModeCustom: [
        {
          modeClass: syncModePresets.rulesSymlink.modeClass,
          options: {
            rulesDir: '.cursor/rules',
            syncManifest: '.cursor/.manifest.json',
          },
        },
      ],
    }));

    expect(agent.syncModes.length).toBe(2);
  });

  it('resolveEnabledAgents supports custom agent records', () => {
    const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(({ config, defineAgent }) =>
      config({
        marketplacesEnabled: {
          custom: {
            acme: defineAgent({
              name: 'acme',
              syncModePresets: {
                markdownSectionSync: {
                  options: {
                    agentsFile: 'AGENTS.override.md',
                    sectionHeading: 'acme',
                  },
                },
              },
            }),
          },
        },
      })
    );

    const resolved = marketplacesConfig.resolveEnabledAgents(mmaappssConfig);
    expect(Object.keys(resolved)).toEqual(['acme']);
  });
});
