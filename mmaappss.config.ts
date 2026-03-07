/**
 * Root mmaappss config. Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import type { MmaappssConfig } from './packages/mmaappss/.agents/plugins/mmaappss/scripts/common/config-helpers.js';

const mmaappssConfig: MmaappssConfig = {
  marketplacesEnabled: {
    claude: true,
    cursor: true,
    codex: true,
  },
  excludeDirectories: [],
  excludeFiles: ['.cursor/commands/git/git-pr-fillout-template.md'],
  // loggingEnabled: true,
  // postMergeSyncEnabled: true,
};

export default mmaappssConfig;
