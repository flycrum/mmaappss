# Integration tests

Config-driven integration tests for marketplace sync. **Not part of vitest** — run via `pnpm -F @mmaappss/sync run test:integrations` (or `mmaappss:sync:test` / `mmaappss:sync:clear:test`, same harness).

## What they do

- **Harness** (`integration-test-harness.ts`): Loops over test cases in `test-cases/`. For each case: run clear, inject that case's config into `mmaappss.config.ts`, run sync, then assert manifest shape and that all registered paths (symlinks, fs-auto-removal, fs-manual-removal) exist.
- **Case runner** (`integration-test-case-runner.ts`): Runs one test case (clear → write stub config → sync → restore config → load manifest, compare to expected JSON, assert paths exist).

## Test cases

Each test case lives in `test-cases/<name>.ts` and exports:

- `testCase` — from `defineIntegrationTestCase({ config, description, jsonPath })`. Required `description` is a short summary of what the case verifies. Consumers get config via `testCase.config`.

Expected manifest JSON is `test-cases/<name>.json` (same base name as the `.ts` file). It defines the expected agents and behavior keys; the runner also asserts that every path listed in the **actual** manifest (symlinks, fsAutoRemoval, fsManualRemoval) exists on disk.

## How to run

From repo root or `packages/sync`:

- `pnpm -F @mmaappss/sync run test:integrations` — runs all test cases (clear before each, then sync, then assert).
- `pnpm -F @mmaappss/sync run mmaappss:sync:test` — same harness.
- `pnpm -F @mmaappss/sync run mmaappss:sync:clear:test` — same harness.

## Adding a test case

1. Add `test-cases/<name>.ts` that exports `testCase` from `defineIntegrationTestCase({ config: mmaappssConfig, description: '...', jsonPath: 'test-cases/<name>.json' })`. Include a required `description` (short summary of what the case verifies). Config is available as `testCase.config` (used by the stub for the sync run).
2. Add `test-cases/<name>.json` with the expected agent/behavior structure (keys only; values can be `true`).
3. Optionally run sync once with that config and copy the generated `.mmaappss/sync-manifest.json` to trim into `<name>.json` for structure.

Each test case should include the three preset agents (claude, cursor, codex) and a fourth custom agent in `agentsConfig.custom` so one config exercises all agent types.
