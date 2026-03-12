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
   - `basic.ts` / `basic.json` — all three presets + one codex-like custom agent (`testagent`)
   - `disable-claude-rules.ts` / `disable-claude-rules.json` — claude with rulesSymlink disabled + custom agent
   - `excluded-one-file.ts` / `excluded-one-file.json` — one excluded path (distinct manifest)
   - `excluded-packages.ts` / `excluded-packages.json` — exclude by segment (e.g. `packages`); distinct manifest
   - `excluded-plugin-git-path.ts` / `excluded-plugin-git-path.json` — exclude whole plugin by path; distinct manifest
   - `excluded-nonexistent.ts` / `excluded-nonexistent.json` — harmless nonexistent path (same manifest as basic)

2. **Add** `scripts/test-cases/<name>.ts`: export a single `testCase` from `defineIntegrationTestCase({ config: mmaappssConfig, description: '...', jsonPath: 'test-cases/<name>.json' })`. Provide a required `description`. Build `mmaappssConfig` with `marketplacesConfig.defineMarketplacesConfig(...)` from `@mmaappss/sync/config`. **Standard agents**: Include the three preset agents (claude, cursor, codex) and one custom agent that mirrors Codex—e.g. `custom: { testagent: defineAgent({ ...agentPresets.codex, name: 'testagent' }) }`. Omit the custom agent only when the case explicitly tests “no custom” or “disabled” (e.g. `disabled`).

3. **Add** `scripts/test-cases/<name>.json`: expected agent/behavior structure. You can run sync once with your config and copy the generated manifest from `sandboxes/.tests/current/.mmaappss/sync-manifest.json` (or from `sandboxes/.tests/failed-<name>/` after a run) to form the expected JSON. Keys and structure must match; see overview for diff-manifest rules (e.g. array order).

4. **Run the new case**: from `packages/sync-integration-tests`, run `pnpm run test -- <name>`. If it fails, use the **debug-case** skill to fix the expected JSON.

## Reference

- Harness, test case layout, and run commands: [references/integration-tests-overview.md](../references/integration-tests-overview.md)
- Test case format and runner assertions: package [README.md](../../../README.md). Runner asserts manifest diff (added/removed/modified) and filesystem (match, missing, extra).
- If the new case fails: use the **debug-case** skill to compare expected vs actual and update the `.json`.
