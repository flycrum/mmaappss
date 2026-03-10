# Integration tests (old / deprecated)

**Deprecated.** This folder holds the previous adapter-based integration tests. Use the config-driven tests in **packages/sync-integration-tests** instead (`pnpm run test:integrations` from repo root).

---

Integration tests for marketplace sync and clear (Claude, Cursor, Codex). **Not part of vitest** — run via package scripts (e.g. `pnpm -F @mmaappss/sync run mmaappss:sync:test`).

## What they do

- **Sync test** (`mmaappss-sync-integration-test.ts`): Backs up agent-specific dirs, runs a sequence of steps (disabled → enabled → disabled → …) with `runSync([agent])`, and asserts expected filesystem state after each step. Restores backups when done.
- **Clear test** (`mmaappss-sync-clear-integration-test.ts`): For each agent, enables sync, asserts output exists, runs `runClear([agent])`, then asserts output is torn down.

## How to run

From repo root or package root:

- `pnpm -F @mmaappss/sync run mmaappss:sync:test` — all agents, sync integration test
- `pnpm -F @mmaappss/sync run mmaappss:sync:clear:test` — all agents, clear integration test
- `tsx scripts/integration-test/mmaappss-sync-integration-test.ts cursor enabled` — Cursor only, single condition (enabled)

## Data flow

You run a **sync test** or **clear test** for one agent (e.g. `cursor`) or `all`. The script resolves the **adapter** for each agent (Claude / Cursor / Codex). The adapter defines what to back up and how to assert enabled/disabled/excluded. The two tests use that adapter differently:

```mermaid
flowchart TB
  START["Run: sync-test or clear-test + agent(s)"]
  ADAPTER["Resolve adapter(s)\n(backup paths, assertEnabled / assertDisabled)"]
  START --> ADAPTER
  ADAPTER --> SYNC_TEST
  ADAPTER --> CLEAR_TEST

  subgraph SYNC_TEST["Sync test"]
    direction TB
    S1["Backup agent dirs"]
    S2["For each DEFAULT_STEP"]
    S3["Set env for step.mode\nOptional: write configOverride to mmaappss.config.ts"]
    S4["runSync(agent)"]
    S5["Assert: assertEnabled or assertDisabled\nor assertExcludedFile / assertExcludedPlugin"]
    S6["If step had configOverride: restore mmaappss.config.ts"]
    S1 --> S2
    S2 --> S3 --> S4 --> S5
    S5 --> S6
    S6 --> S2
  end

  subgraph CLEAR_TEST["Clear test"]
    direction TB
    C1["Backup agent dirs"]
    C2["runSync (enabled)"]
    C3["Assert output exists"]
    C4["runClear(agent)"]
    C5["Assert output removed"]
    C1 --> C2 --> C3 --> C4 --> C5
  end

  SYNC_TEST --> RESTORE
  CLEAR_TEST --> RESTORE
  RESTORE["Restore backups"]
  EXIT["Exit 0 only if all steps PASS"]
  RESTORE --> EXIT
```

- **Sync test** loops over `DEFAULT_STEPS` (clean slate, create, remove, idempotent runs, excluded-path variants). Some steps set `configOverride` (e.g. `excluded: ['packages']`); the test backs up `mmaappss.config.ts`, writes the override, runs sync, asserts, then restores config. Assertions use the adapter’s `assertEnabled`, `assertDisabled`, or exclusion helpers.
- **Clear test** does not use steps: it runs sync once (enabled), asserts output exists, runs clear, asserts output is gone, then restores backups.
- **Adapter** (in `integration-test-adapters.ts`): implements `backupPaths`, `assertEnabled(root)`, `assertDisabled(root)`, and optionally `assertExcludedFileRemoved` / `assertExcludedPluginRemoved`. To add an agent or change what gets asserted, edit the adapter and (for sync) `DEFAULT_STEPS` or step `configOverride`s.
