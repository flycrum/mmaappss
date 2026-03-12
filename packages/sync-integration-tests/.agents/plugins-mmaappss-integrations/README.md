# plugins-mmaappss-integrations

Local plugin for **@mmaappss/sync-integration-tests**: skills to run tests, create a test case, and debug a failing case.

## Skills

| Skill | Purpose |
|--------|--------|
| **mmaappss-integrations-run-all** | Run all integration test cases (`pnpm run test` from package or `pnpm run test:integrations` from root). |
| **mmaappss-integrations-run-one** | Run a single test case by name (`pnpm run test -- <name>` from package). |
| **mmaappss-integrations-create-case** | Create a new test case: follow examples in scripts/test-cases/, add .ts and .json, then run with run-one. |
| **mmaappss-integrations-debug-case** | Diagnose and fix a failing case: use failed-<name> artifact, compare expected .json to actual manifest, update expected and re-run. |

## Shared reference

**references/integration-tests-overview.md** — Harness behavior (current, failed-<name>, clear at start), how to run (all vs one, from package vs root), test case layout, manifest location, and diff-manifest semantics. All skills point here for details to avoid duplication and keep context lean.

## Location

This plugin lives under packages/sync-integration-tests/.agents/plugins-mmaappss-integrations/. Tests live in packages/sync-integration-tests/scripts/. The active sandbox is sandboxes/.tests/current (cloned from sandboxes/sandbox-template per case); on failure it is renamed to failed-<name> for inspection.
