# Integration tests overview

Shared reference for the mmaappss integration test harness, test case layout, and manifest diff. Skills (run-all, run-one, create-case, debug-case) point here for details.

## How to run

- **All cases** (from package): `pnpm run test`. From monorepo root: `pnpm run test:integrations` or `pnpm -F @mmaappss/sync-integration-tests run test`.
- **One case** (from package): `pnpm run test -- <case-name>` (e.g. `pnpm run test -- basic`). Or: `pnpm exec tsx scripts/integration-test-harness.ts <case-name>`. From root: `pnpm -F @mmaappss/sync-integration-tests run test -- basic`.

Note: `pnpm run test basic` does **not** pass `basic` to the script; use `pnpm run test -- basic`.

## Harness behavior

- **Location**: `packages/sync-integration-tests/scripts/integration-test-harness.ts`.
- **At start**: Clears `sandboxes/.tests/` so each run starts fresh.
- **Per case**: Clones `sandboxes/sandbox-template` to `sandboxes/.tests/current`, runs clear then sync with output root = `current`, asserts manifest diff and filesystem. On **pass**: removes `current`. On **failure**: renames `current` to `sandboxes/.tests/failed-<case-name>` (e.g. `failed-basic`) for inspection.
- **Case names**: Base name of files in `scripts/test-cases/` (e.g. `basic` for `basic.ts` / `basic.json`).

## Test case layout

- **Config**: `scripts/test-cases/<name>.ts` exports a single `testCase` from `defineIntegrationTestCase({ config, description, jsonPath })`. Config is built with `marketplacesConfig.defineMarketplacesConfig(...)` from `@mmaappss/sync/config`.
- **Expected manifest**: Colocated `scripts/test-cases/<name>.json` is the expected shape of the sync manifest. The runner compares the **actual** manifest produced by sync to this file.
- **Where sync writes**: Output root is `sandboxes/.tests/current` (or after a failure you inspect `sandboxes/.tests/failed-<name>/`). Default manifest path under that root is `.mmaappss/sync-manifest.json`. Config can override via `syncManifestPath` (see `packages/sync/scripts/core/marketplaces-config.ts`).

## Manifest diff (diff-manifest)

- **Code**: `scripts/utils/diff-manifest.ts` and `diff-manifest.config.ts`.
- **Report**: added (in actual, not expected), removed (in expected, not actual), modified (same path, different value).
- **Deep equality**: Primitives by value; object key order ignored. **Arrays**: order-sensitive for arrays containing objects; order-insensitive for arrays of primitives only (compared after sorting by string value).

## Config options (sync)

- `packages/sync/scripts/core/marketplaces-config.ts`: `syncManifestPath`, `syncOutputRoot`, `loggingEnabled`.

## Scripts

- Harness: `scripts/integration-test-harness.ts`
- Runner: `scripts/integration-test-case-runner.ts`
- Package README: `packages/sync-integration-tests/README.md`
