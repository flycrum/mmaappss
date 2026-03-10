---
name: mmaappss-integrations-create-case
description: Create a new @mmaappss/sync integration test case by following existing examples in test-cases/, then run that case to confirm.
---

# Create a new integration test case

Use this skill when you need to **add a new integration test case** (a new config scenario). Create the files by following existing examples, then run the new case to confirm.

## When to use

- User asks to "create an integration test case", "add a new integration test", or "scaffold a test case for <scenario>"
- You want to add a new config scenario (e.g. new excluded path, new agent override)

## How to create

1. **Look at examples** in `packages/sync-integration-tests/scripts/test-cases/`:
   - `basic.ts` / `basic.json` — all presets + one custom agent
   - `disable-claude-rules.ts` / `disable-claude-rules.json` — claude with rulesSymlink disabled
   - `excluded-one-file.ts` / `excluded-one-file.json` — one excluded path

2. **Add** `scripts/test-cases/<name>.ts`: export a single `testCase` from `defineIntegrationTestCase({ config: mmaappssConfig, description: '...', jsonPath: 'test-cases/<name>.json' })`. Provide a required `description`. Build `mmaappssConfig` with `marketplacesConfig.defineMarketplacesConfig(...)` from `@mmaappss/sync/config`. Each case should include the three preset agents and a fourth custom agent in `agentsConfig.custom`.

3. **Add** `scripts/test-cases/<name>.json`: expected agent/behavior structure (keys only; values can be `true`). You can run sync once with your config and copy the generated manifest structure to form the expected JSON.

4. **Run the new case**: from `packages/sync-integration-tests`, run `pnpm exec tsx scripts/integration-test-harness.ts <name>`.

## Reference

- Test case format: [README.md](../../../README.md). Runner asserts manifest diff (added/removed/modified) and filesystem (match, missing, extra).
