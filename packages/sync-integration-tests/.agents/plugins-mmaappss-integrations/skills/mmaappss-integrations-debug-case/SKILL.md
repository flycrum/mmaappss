---
name: mmaappss-integrations-debug-case
description: Diagnose, fix, and stabilize a failing integration test case by comparing config to expected manifest and using failed run artifacts. Complements create-case; use when a test case fails or expected JSON is out of sync.
---

# Debug a failing integration test case

Use this skill when you need to **investigate why an integration test case failed**, **repair the expected JSON** to match actual sync output, or even **create** an initial test case. Start with a **single** test case; the flow uses the failed run artifact (renamed `failed-<name>`) to compare actual manifest to expected and fix the case.

## When to use

- A test case fails (harness reported errors for a case) or when first creating a test case and trying to determine the expected manifest
- User asks to "debug integration test X", "fix failing test case", "update expected manifest for X", "why does test case X fail", "help me create the expect test case results for the sync manifest json file"
- You need to align a test case's expected `.json` with what sync actually produces
- Create-case produced a new case that fails and you need to fix or understand the diff

## How test cases and manifests relate

- **Config**: Each test case is `scripts/test-cases/<name>.ts`. It exports a `testCase` with a **config** (agents, excluded paths, etc.) built via `marketplacesConfig.defineMarketplacesConfig(...)`.
- **Expected output**: Colocated `scripts/test-cases/<name>.json` is the **expected** shape of the sync manifest (agent/behavior keys and structure). The runner compares the **actual** manifest produced by sync to this file.
- **Where sync writes**: By default the manifest is at `.mmaappss/sync-manifest.json` under the **output root**. The test runner uses **output root** = `packages/sync-integration-tests/sandboxes/.tests/current`. The config can override the manifest path via `syncManifestPath` (see `packages/sync/scripts/core/marketplaces-config.ts`: `syncManifestPath`, `syncOutputRoot`).
- **On failure**: The harness does **not** delete the run directory. It renames `sandboxes/.tests/current` to `sandboxes/.tests/failed-<name>`. So after a failure you have a full artifact: the failed run's output root is `sandboxes/.tests/failed-<name>/`, and inside it you find the actual `.mmaappss/sync-manifest.json` (or the path from the test config if `syncManifestPath` was set).

## Debug flow (single test)

1. **Run the failing case once** (if not already run) so the harness produces `sandboxes/.tests/failed-<name>`:
   ```bash
   cd packages/sync-integration-tests && pnpm exec tsx scripts/integration-test-harness.ts <name>
   ```
2. **Locate the two manifests**:
   - **Expected**: `packages/sync-integration-tests/scripts/test-cases/<name>.json`
   - **Actual**: `packages/sync-integration-tests/sandboxes/.tests/failed-<name>/.mmaappss/sync-manifest.json` (or the path from the test case config if it sets `syncManifestPath`)
3. **Compare** using the same logic the runner uses: `diff-manifest` (see below). Identify added/removed/modified paths.
4. **Fix the expected JSON**: Update `scripts/test-cases/<name>.json` to match the actual manifest (add missing keys, remove extra keys, fix modified values). Re-run the single case; repeat until it passes.
5. **If expected and actual are identical** but the diff still reports differences: the bug is likely in the **diff-manifest** logic. **Stop immediately** and escalate:

   **🚨 🚨 EXPECTED AND ACTUAL MANIFESTS ARE IDENTICAL — DIFF ENGINE MAY BE WRONG 🚨 🚨**
   Tell the developer: "The test case expected JSON and the generated sync-manifest.json appear to be the same, but the diff is still reporting added/removed/modified. This suggests a bug in the diff-manifest comparison logic. Do you want to debug `packages/sync-integration-tests/scripts/utils/diff-manifest.ts` and `diff-manifest.config.ts`?"

   Do not keep editing the test case JSON; the next step is to fix the diff implementation.
6. **Last resort**: If the failure is unclear (sync script errors, discovery issues), enable **Pino file logging** and re-run:
   - In the test case **config** (the `.ts` file), set `loggingEnabled: true` (see `packages/sync/scripts/core/marketplaces-config.ts`). Or run with `MMAAPPSS_LOGGING_ENABLED=true`.
   - Use the [debug-pino-logger](../../../../sync/.agents/plugins/pino-logger/skills/debug-pino-logger/SKILL.md) skill to inspect logs under the output root (e.g. `sandboxes/.tests/current` or `failed-<name>` after a run). Then fix config or sync behavior, re-run the case, and remove `loggingEnabled` when done.

## How the diff-manifest engine works

- **Code**: `packages/sync-integration-tests/scripts/utils/diff-manifest.ts` and `diff-manifest.config.ts`.
- **Deep equality** (from `diff-manifest.config.ts`):
  - Primitives compared by value; object key order is **ignored**.
  - **Arrays**: **Order-sensitive** for arrays that contain objects; **order-insensitive** for arrays of **primitives only** (sorted by string value before comparison).
- When you interpret "added" / "removed" / "modified": "added" = in actual but not expected; "removed" = in expected but not actual; "modified" = same path, different value. If you believe two values are the same but the engine reports "modified", consider array order (for arrays of objects, order matters) or a bug in the diff logic — then use the escalation in step 5 above.

## Reference

- Harness and failure rename: `scripts/integration-test-harness.ts` (clears `sandboxes/.tests/` at start; renames `current` to `failed-<name>` on failure).
- Runner: `scripts/integration-test-case-runner.ts` (clones template to `current`, compares expected JSON to actual manifest, uses `diffManifest.run()`).
- Config options: `packages/sync/scripts/core/marketplaces-config.ts` (`syncManifestPath`, `syncOutputRoot`, `loggingEnabled`).
- Create-case skill: use together when adding a new case and then stabilizing it.
