---
name: mmaappss-integrations-create-case
description: Create a new @mmaappss/sync integration test case by following existing examples in test-cases/, then run that case to confirm.
---

# Create a new integration test case

Use this skill when you need to **add a new integration test case** (a new config scenario). There is no generator script; create the files by following existing examples, then run the new case to confirm.

## When to use

- User asks to "create an integration test case", "add a new integration test", or "scaffold a test case for <scenario>"
- You want to add a new config scenario (e.g. new excluded path, new agent override)

## How to create

1. **Look at examples** in `packages/sync/scripts-integration-tests/test-cases/`:
   - `basic.ts` / `basic.json` — all presets + one custom agent
   - `disable-claude-rules.ts` / `disable-claude-rules.json` — claude with rulesSymlink disabled
   - `excluded-one-file.ts` / `excluded-one-file.json` — one excluded path

2. **Add** `test-cases/<name>.ts`: export a single `testCase` from `defineIntegrationTestCase({ config: mmaappssConfig, description: '...', jsonPath: 'test-cases/<name>.json' })`. Provide a required `description` (short summary of what the case verifies). Build `mmaappssConfig` with `marketplacesConfig.defineMarketplacesConfig(...)` (same pattern as the examples). Each case should include the three preset agents (claude, cursor, codex) and a fourth custom agent in `agentsConfig.custom`.

3. **Add** `test-cases/<name>.json`: expected agent/behavior structure (keys only; values can be `true`). You can run sync once with your config (e.g. temporarily point the repo at your new case), then copy `.mmaappss/sync-manifest.json` and trim to structure (agent → behavior key → `true`) to form the expected JSON.

4. **Run the new case** to confirm: from `packages/sync`, run `pnpm exec tsx scripts-integration-tests/run-one-integration-test.ts <name>`. Use the **run-one** skill if you prefer that flow.

## Reference

- Test case format and adding steps: [scripts-integration-tests/README.md](../../../README.md).
- Expected JSON defines agents and behavior keys; the runner also asserts that every path in the actual manifest (symlinks, fsAutoRemoval, fsManualRemoval) exists on disk.
