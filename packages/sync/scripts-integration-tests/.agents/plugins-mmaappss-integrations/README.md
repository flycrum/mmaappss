# plugins-mmaappss-integrations

Local marketplace plugin for **@mmaappss/sync integration tests**: skills to run all tests, run one test case, and create a new test case (by example, then run-one).

## Skills

| Skill | Purpose |
|--------|--------|
| **mmaappss-integrations-run-all** | Run all integration test cases (`pnpm run test:integrations`). |
| **mmaappss-integrations-run-one** | Run a single test case by name (`tsx scripts-integration-tests/run-one-integration-test.ts <name>`). |
| **mmaappss-integrations-create-case** | Create a new test case: follow examples in test-cases/, add .ts and .json, then run with run-one. |

## Location

This plugin lives under `packages/sync/scripts-integration-tests/.agents/plugins-mmaappss-integrations/`. Integration tests live in `packages/sync/scripts-integration-tests/` (harness, case runner, test-cases/).
