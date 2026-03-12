import { describe, expect, it } from 'vitest';
import { marketplacesConfig } from './marketplaces-config.js';

describe('marketplacesConfig', () => {
  it('defineAgent resolves preset and custom sync behaviors', () => {
    const agent = marketplacesConfig.defineAgent(({ syncBehaviorPresets }) => ({
      name: 'cursor',
      syncBehaviorPresets: {
        localPluginsContentSync: true,
      },
      syncBehaviorCustom: [
        {
          behaviorClass: syncBehaviorPresets.rulesSymlink.behaviorClass,
          options: {
            rulesDir: '.cursor/rules',
            syncManifest: '.cursor/.manifest.json',
          },
        },
      ],
    }));

    expect(agent.syncBehaviors.length).toBe(2);
  });

  it('resolveEnabledAgents supports custom agent records', () => {
    const mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(({ config, defineAgent }) =>
      config({
        agentsConfig: {
          custom: {
            acme: defineAgent({
              name: 'acme',
              syncBehaviorPresets: {
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
