# plugins-mmaappss-integrations

Local plugin for **@mmaappss/sync-integration-tests**: skills to run all tests, run one test case, and create a new test case (by example, then run-one).

## Skills

| Skill | Purpose |
|--------|--------|
| **mmaappss-integrations-run-all** | Run all integration test cases (`pnpm run test:integrations` from root). |
| **mmaappss-integrations-run-one** | Run a single test case by name (`tsx scripts/integration-test-harness.ts <name>`). |
| **mmaappss-integrations-create-case** | Create a new test case: follow examples in scripts/test-cases/, add .ts and .json, then run with run-one. |

## Location

This plugin lives under `packages/sync-integration-tests/.agents/plugins-mmaappss-integrations/`. Tests live in `packages/sync-integration-tests/scripts/` (harness, case runner, test-cases). Sandbox is cloned from sandbox-template per case and destroyed after.
