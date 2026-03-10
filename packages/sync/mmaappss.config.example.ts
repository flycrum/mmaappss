/**
 * Example TypeScript config. Copy to repo root as mmaappss.config.ts and adjust.
 * Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import { marketplacesConfig } from './scripts/core/marketplaces-config.js';
import { LocalPluginsContentSyncBehavior } from './scripts/core/sync-behaviors/local-plugins-content-sync-behavior.js';

type ExampleConfigMode =
  | 'basic'
  | 'defaults-only'
  | 'disable-preset'
  | 'preset-override'
  | 'advanced'
  | 'custom-only';

const exampleConfigMode = 'basic' as ExampleConfigMode;

let mmaappssConfigExample: ReturnType<typeof marketplacesConfig.defineMarketplacesConfig>;

switch (exampleConfigMode) {
  case 'basic':
    mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig({
      marketplacesEnabled: {
        claude: true,
        cursor: true,
        codex: true,
      },
      excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
      // loggingEnabled: true,
      // postMergeSyncEnabled: true,
    });
    break;

  case 'defaults-only':
    mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig({
      marketplacesEnabled: {
        claude: true,
        cursor: true,
        codex: true,
      },
    });
    break;

  case 'disable-preset':
    mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig({
      marketplacesEnabled: {
        claude: false,
        cursor: true,
        codex: true,
      },
    });
    break;

  case 'preset-override':
    mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig(
      ({ config, defineAgent, agentPresets }) =>
        config({
          marketplacesEnabled: {
            claude: defineAgent({
              ...agentPresets.claude,
              name: 'claude',
              syncBehaviorPresets: {
                ...agentPresets.claude.syncBehaviorPresets,
                // disable rules symlink for claude
                rulesSymlink: false,
              },
            }),
            cursor: true,
            codex: true,
          },
        })
    );
    break;

  case 'advanced':
    mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig(
      ({ config, defineAgent, agentPresets }) =>
        config({
          marketplacesEnabled: {
            claude: true,
            cursor: defineAgent({
              ...agentPresets.cursor,
              name: 'cursor',
              syncBehaviorPresets: {
                ...agentPresets.cursor.syncBehaviorPresets,
                localPluginsContentSync: {
                  options: {
                    manifestPath: '.cursor/.mmaappss-cursor-sync.json',
                    requiredManifestKey: 'cursor',
                    targetRoot: '.cursor',
                    folderSelection: {
                      mode: 'whitelist',
                      folders: ['commands', 'skills', 'rules', 'agents'],
                    },
                    folderTransforms: {
                      rules: {
                        transformFilenameFn(filename) {
                          return filename.replace(/\.(md|markdown)$/i, '.mdc');
                        },
                        transformFileMarkdownFn(contents) {
                          return `---\nalwaysApply: true\n---\n\n${contents.replace(/^---[\s\S]*?---\n?/, '')}`;
                        },
                      },
                    },
                    processPluginFolderOrFile(localContent) {
                      if (localContent.entryName === '.claude-plugin') return false;
                      if (
                        localContent.pluginName === 'git' &&
                        localContent.entryName === 'commands'
                      ) {
                        return {
                          targetPath: `${localContent.targetPath}-customized`,
                        };
                      }
                      return {
                        filename: localContent.entryName,
                      };
                    },
                  },
                },
              },
            }),
            codex: true,
            custom: {
              superagent: defineAgent(
                ({ agentPresets: presets, syncBehaviorPresets: _syncBehaviorPresets }) => ({
                  ...presets.codex,
                  name: 'superagent',
                  syncBehaviorPresets: {
                    ...presets.codex.syncBehaviorPresets,
                    localMarketplaceSync: {
                      options: {
                        manifestKey: 'claude',
                        marketplaceFile: '.superagent-plugin/marketplace.json',
                        marketplaceName: 'mmaappss-superagent',
                        sourceFormat: 'prefixed',
                      },
                    },
                  },
                  syncBehaviorCustom: [
                    {
                      behaviorClass: LocalPluginsContentSyncBehavior,
                      options: {
                        manifestPath: '.superagent/.mmaappss-superagent-sync.json',
                        requiredManifestKey: 'claude',
                        strategy: 'generic',
                        targetRoot: '.superagent',
                        folderSelection: { mode: 'blacklist', folders: ['.claude-plugin'] },
                        processPluginFolderOrFile(localContent) {
                          if (
                            localContent.agentName === 'superagent' &&
                            localContent.entryName === 'rules'
                          ) {
                            return {
                              targetPath: `.superagent/rules/${localContent.pluginName}`,
                            };
                          }
                          return {
                            symlink: localContent.isDirectory,
                          };
                        },
                      },
                    },
                    (helpers) => ({
                      behaviorClass: helpers.syncBehaviorPresets.rulesSymlink.behaviorClass,
                      options: {
                        rulesDir: '.superagent/rules-symlinked',
                        syncManifest: '.superagent/.mmaappss-superagent-rules.json',
                      },
                    }),
                  ],
                })
              ),
            },
          },
          excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
        })
    );
    break;

  case 'custom-only':
    mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig(
      ({ config, defineAgent, syncBehaviorPresets }) =>
        config({
          marketplacesEnabled: {
            custom: {
              acme: defineAgent({
                name: 'acme',
                syncBehaviorPresets: {
                  markdownSectionSync: {
                    options: {
                      agentsFile: 'ACME_AGENTS.override.md',
                      sectionHeading: 'packages (generated by acme)',
                    },
                  },
                  localMarketplaceSync: {
                    options: {
                      manifestKey: 'claude',
                      marketplaceFile: '.acme-plugin/marketplace.json',
                      sourceFormat: 'relative',
                    },
                  },
                },
                syncBehaviorCustom: [
                  {
                    behaviorClass: syncBehaviorPresets.agentsMdSymlink.behaviorClass,
                  },
                ],
              }),
            },
          },
        })
    );
    break;

  default: {
    const _: never = exampleConfigMode;
    throw new Error(`Unknown exampleConfigMode: ${_}`);
  }
}

export { mmaappssConfigExample };
