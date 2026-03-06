/**
 * Master sync: run all marketplace syncs (Claude, Cursor, Codex).
 * Scaffolding: load config and exit 0; full logic in follow-up.
 */

import { configHelpers } from './common/config-helpers.js';
import { pathHelpers } from './common/path-helpers.js';

async function main(): Promise<void> {
  const repoRoot = pathHelpers.repoRoot;
  const tsConfig = await configHelpers.ts.loadConfig(repoRoot);
  configHelpers.general.getMarketplaceEnabled(repoRoot, tsConfig, 'claude');
  configHelpers.general.getMarketplaceEnabled(repoRoot, tsConfig, 'cursor');
  configHelpers.general.getMarketplaceEnabled(repoRoot, tsConfig, 'codex');
  process.exit(0);
}

main().catch(() => process.exit(0));
