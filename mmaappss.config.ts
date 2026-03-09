/**
 * Root mmaappss config. Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import { marketplacesConfig } from './packages/sync/scripts/core/marketplaces-config.js';
import { LocalPluginsContentSyncMode } from './packages/sync/scripts/core/sync-modes/local-plugins-content-sync-mode.js';

let mmaappssConfig: ReturnType<typeof marketplacesConfig.defineMarketplacesConfig>;

type ConfigMode = 'basic' | 'crazy' | 'disable-claude-rules';
const configMode = 'basic' as ConfigMode;

if (configMode === 'basic') {
  mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(() => ({
    marketplacesEnabled: {
      claude: true,
      cursor: true,
      codex: true,
    },
    // excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
    // loggingEnabled: true,
    // postMergeSyncEnabled: true,
  }));
} else if (configMode === 'disable-claude-rules') {
  mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(
    ({ config, defineAgent, agentPresets }) =>
      config({
        marketplacesEnabled: {
          claude: defineAgent({
            ...agentPresets.claude,
            name: 'claude',
            syncModePresets: {
              ...agentPresets.claude.syncModePresets,
              // disable rules symlink for claude
              rulesSymlink: false,
            },
          }),
          cursor: true,
          codex: true,
        },
      })
  );
} else {
  mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(
    ({ config, defineAgent, agentPresets }) =>
      config({
        marketplacesEnabled: {
          claude: true,
          cursor: defineAgent({
            ...agentPresets.cursor,
            name: 'cursor',
            syncModePresets: {
              ...agentPresets.cursor.syncModePresets,
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
              ({ agentPresets: presets, syncModePresets: _syncModePresets }) => ({
                ...presets.codex,
                name: 'superagent',
                syncModePresets: {
                  ...presets.codex.syncModePresets,
                  localMarketplaceSync: {
                    options: {
                      manifestKey: 'claude',
                      marketplaceFile: '.superagent-plugin/marketplace.json',
                      marketplaceName: 'mmaappss-superagent',
                      sourceFormat: 'prefixed',
                    },
                  },
                },
                syncModeCustom: [
                  {
                    modeClass: LocalPluginsContentSyncMode,
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
                    modeClass: helpers.syncModePresets.rulesSymlink.modeClass,
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
}

export default mmaappssConfig;
