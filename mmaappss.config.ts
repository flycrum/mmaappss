/**
 * Root mmaappss config. Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import type { MmaappssConfig } from './packages/mmaappss/.agents/plugins/mmaappss/scripts/common/config-helpers.js';

const mmaappssConfig: MmaappssConfig = {
  marketplaceAll: false,
  marketplaceClaude: false,
  marketplaceCursor: true,
  marketplaceCodex: false,
  excludeDirectories: ['./packages/mmaappss'],
};

export default mmaappssConfig;
