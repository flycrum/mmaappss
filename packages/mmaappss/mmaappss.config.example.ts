/**
 * Example TypeScript config. Copy to repo root as mmaappss.config.ts and adjust.
 * Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import { marketplacesConfig } from './.agents/plugins/mmaappss/scripts/core/marketplaces-config.js';

export const mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig(() => ({
  marketplacesEnabled: {
    claude: true,
    cursor: true,
    codex: true,
  },
  excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
  // loggingEnabled: true,
  // postMergeSyncEnabled: true,
}));

// Example: Advanced preset override + custom agent using folder transforms and per-entry processing hooks.
// export const mmaappssConfigExample = marketplacesConfig.defineMarketplacesConfig(
//   ({ defineAgent, agentPresets }) => ({
//     marketplacesEnabled: {
//       claude: true,
//       cursor: defineAgent({
//         ...agentPresets.cursor,
//         name: 'cursor',
//         syncModePresets: {
//           ...agentPresets.cursor.syncModePresets,
//           localPluginsContentSync: {
//             options: {
//               manifestPath: '.cursor/.mmaappss-cursor-sync.json',
//               requiredManifestKey: 'cursor',
//               strategy: 'generic',
//               targetRoot: '.cursor',
//               folderSelection: {
//                 mode: 'whitelist',
//                 folders: ['commands', 'skills', 'rules', 'agents'],
//               },
//               folderTransforms: {
//                 rules: {
//                   transformFilenameFn(filename) {
//                     return filename.replace(/\.(md|markdown)$/i, '.mdc');
//                   },
//                   transformFileMarkdownFn(contents) {
//                     return `---\nalwaysApply: true\n---\n\n${contents.replace(/^---[\s\S]*?---\n?/, '')}`;
//                   },
//                 },
//               },
//               processPluginFolderOrFile(localContent) {
//                 if (localContent.entryName === '.claude-plugin') return false;
//                 if (localContent.pluginName === 'git' && localContent.entryName === 'commands') {
//                   return {
//                     targetPath: `${localContent.targetPath}-customized`,
//                   };
//                 }
//                 return {
//                   filename: localContent.entryName,
//                 };
//               },
//             },
//           },
//         },
//       }),
//       codex: true,
//       custom: {
//         superagent: defineAgent(({ agentPresets: presets, syncModePresets: _syncModePresets }) => ({
//           ...presets.codex,
//           name: 'superagent',
//           syncModePresets: {
//             ...presets.codex.syncModePresets,
//             localMarketplaceSync: {
//               options: {
//                 manifestKey: 'claude',
//                 marketplaceFile: '.superagent-plugin/marketplace.json',
//                 marketplaceName: 'mmaappss-superagent',
//                 sourceFormat: 'prefixed',
//               },
//             },
//           },
//           syncModeCustom: [
//             {
//               modeClass: localPluginsContentSyncMode.LocalPluginsContentSyncMode,
//               options: {
//                 manifestPath: '.superagent/.mmaappss-superagent-sync.json',
//                 requiredManifestKey: 'claude',
//                 strategy: 'generic',
//                 targetRoot: '.superagent',
//                 folderSelection: { mode: 'blacklist', folders: ['.claude-plugin'] },
//                 processPluginFolderOrFile(localContent) {
//                   if (
//                     localContent.agentName === 'superagent' &&
//                     localContent.entryName === 'rules'
//                   ) {
//                     return {
//                       targetPath: `.superagent/rules/${localContent.pluginName}`,
//                     };
//                   }
//                   return {
//                     symlink: localContent.isDirectory,
//                   };
//                 },
//               },
//             },
//             (helpers) => ({
//               modeClass: helpers.syncModePresets.rulesSymlink.modeClass,
//               options: {
//                 rulesDir: '.superagent/rules-symlinked',
//                 syncManifest: '.superagent/.mmaappss-superagent-rules.json',
//               },
//             }),
//           ],
//         })),
//       },
//     },
//     excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
//   })
// );

// Example: Minimal baseline with all built-in presets enabled and no per-agent customization.
// export const mmaappssConfigExampleDefaultsOnly = marketplacesConfig.defineMarketplacesConfig({
//   marketplacesEnabled: {
//     claude: true,
//     cursor: true,
//     codex: true,
//   },
// });

// Example: Toggle a single preset off while keeping other built-in presets enabled.
// export const mmaappssConfigExampleDisablePreset = marketplacesConfig.defineMarketplacesConfig({
//   marketplacesEnabled: {
//     claude: false,
//     cursor: true,
//     codex: true,
//   },
// });

// Example: Override one preset mode (disable settings sync) while inheriting the rest of the preset.
// export const mmaappssConfigExamplePresetOverride = marketplacesConfig.defineMarketplacesConfig(
//   ({ defineAgent, agentPresets }) => ({
//     marketplacesEnabled: {
//       claude: defineAgent({
//         ...agentPresets.claude,
//         syncModePresets: {
//           ...agentPresets.claude.syncModePresets,
//           settingsSync: false,
//         },
//       }),
//       cursor: true,
//       codex: true,
//     },
//   })
// );

// Example: Register a fully custom agent with custom + preset sync modes and no built-in presets.
// export const mmaappssConfigExampleCustomOnly = marketplacesConfig.defineMarketplacesConfig(
//   ({ defineAgent, syncModePresets }) => ({
//     marketplacesEnabled: {
//       custom: {
//         acme: defineAgent({
//           name: 'acme',
//           syncModePresets: {
//             markdownSectionSync: {
//               options: {
//                 agentsFile: 'ACME_AGENTS.override.md',
//                 sectionHeading: 'packages (generated by acme)',
//               },
//             },
//             localMarketplaceSync: {
//               options: {
//                 manifestKey: 'claude',
//                 marketplaceFile: '.acme-plugin/marketplace.json',
//                 sourceFormat: 'relative',
//               },
//             },
//           },
//           syncModeCustom: [
//             {
//               modeClass: syncModePresets.agentsMdSymlink.modeClass,
//             },
//           ],
//         }),
//       },
//     },
//   })
// );
