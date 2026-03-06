/**
 * Root mmaappss config. Env vars (MMAAPPSS_MARKETPLACE_*) override these when set.
 */

import type { MmaappssConfig } from './packages/mmaappss/.agents/plugins/mmaappss/scripts/common/config-helpers.js';

const mmaappssConfig: MmaappssConfig = {
  marketplaceAll: true,
  marketplaceClaude: true,
  marketplaceCursor: true,
  marketplaceCodex: false,
  excludeDirectories: ['node_modules', 'dist', '.turbo'],
};

export default mmaappssConfig;
