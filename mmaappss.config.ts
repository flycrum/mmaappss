/**
 * Root mmaappss config. Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import { marketplacesConfig } from './packages/mmaappss/.agents/plugins/mmaappss/scripts/core/marketplaces-config.js';
import { LocalPluginsContentSyncMode } from './packages/mmaappss/.agents/plugins/mmaappss/scripts/core/sync-modes/local-plugins-content-sync-mode.js';

const configMode = 'basic' as 'basic' | 'crazy';

let mmaappssConfig: ReturnType<typeof marketplacesConfig.defineMarketplacesConfig>;

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
} else {
  mmaappssConfig = marketplacesConfig.defineMarketplacesConfig(
    ({ defineAgent, agentPresets }, config) =>
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
