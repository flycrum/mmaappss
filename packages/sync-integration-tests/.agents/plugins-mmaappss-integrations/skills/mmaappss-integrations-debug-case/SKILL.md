---
name: mmaappss-integrations-debug-case
description: Diagnose, fix, and stabilize a failing integration test case by comparing expected manifest JSON to actual sync output using failed run artifacts. Use when a test case fails or expected JSON is out of sync.
---

# Debug a failing integration test case

Use this skill when you need to **investigate why an integration test failed**, **repair the expected JSON** to match actual sync output, or **stabilize** a new case from create-case. Work on a **single** test case; use the failed run artifact (`failed-<name>`) to compare actual vs expected manifest and fix the case.

## When to use

- A test case fails (harness reported errors for a case)
- User asks to "debug integration test X", "fix failing test case", "update expected manifest for X", "why does test case X fail"
- You need to align `scripts/test-cases/<name>.json` with what sync actually produces
- Create-case produced a new case that fails and you need to fix or understand the diff

## Prerequisite

Read [references/integration-tests-overview.md](../references/integration-tests-overview.md) for: how the harness works (current, failed-<name>, clear at start), where manifests live, and how the diff-manifest engine works (deep equality, array order rules).

## Debug flow (single test)

1. **Produce the failed artifact** (if not already): run the failing case so the harness renames `current` to `failed-<name>`.
   - From package: `pnpm run test -- <name>` (e.g. `pnpm run test -- basic`). From root: `pnpm -F @mmaappss/sync-integration-tests run test -- <name>`.
   - Or: `pnpm exec tsx scripts/integration-test-harness.ts <name>` from `packages/sync-integration-tests`.

2. **Locate the two manifests**
   - **Expected**: `packages/sync-integration-tests/scripts/test-cases/<name>.json`
   - **Actual**: `packages/sync-integration-tests/sandboxes/.tests/failed-<name>/.mmaappss/sync-manifest.json` (or the path from the test config if it sets `syncManifestPath`)

3. **Compare** using the same logic as the runner (see overview): identify added / removed / modified paths. "Added" = in actual only; "removed" = in expected only; "modified" = same path, different value. Remember: arrays of primitives are order-insensitive; arrays containing objects are order-sensitive.

4. **Fix the expected JSON**: Update `scripts/test-cases/<name>.json` to match the actual manifest (add missing keys, remove extra keys, fix modified values). Re-run the single case; repeat until it passes.

5. **If expected and actual appear identical** but the diff still reports differences: treat as a **diff-manifest bug**. Stop and escalate:
   - **🚨 EXPECTED AND ACTUAL MANIFESTS ARE IDENTICAL — DIFF ENGINE MAY BE WRONG 🚨**
   - Tell the developer: "The test case expected JSON and the generated sync-manifest.json appear to be the same, but the diff still reports added/removed/modified. This suggests a bug in the diff-manifest logic. Do you want to debug `packages/sync-integration-tests/scripts/utils/diff-manifest.ts` and `diff-manifest.config.ts`?"
   - Do not keep editing the test case JSON; the next step is to fix the diff implementation.

6. **Last resort** (sync errors, discovery issues): Enable **Pino file logging**, re-run, then inspect.
   - In the test case config (the `.ts` file), set `loggingEnabled: true`, or run with `MMAAPPSS_LOGGING_ENABLED=true`.
   - Use the debug-pino-logger skill to inspect logs under the output root (e.g. `sandboxes/.tests/failed-<name>/.mmaappss/logs/`). Fix config or sync behavior, re-run, then remove `loggingEnabled` when done.

## Reference

- Overview (harness, manifests, diff): [references/integration-tests-overview.md](../references/integration-tests-overview.md)
- Create-case skill: use when adding a new case; use this skill to stabilize it after the first run fails.
