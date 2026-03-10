---
name: mmaappss-integrations-run-all
description: Run all @mmaappss/sync integration tests (all test cases). Use when you need to run the full integration test suite.
---

# Run all integration tests

Use this skill when you need to **run the full integration test suite** for @mmaappss/sync (all config-driven test cases in `packages/sync-integration-tests/scripts/test-cases/`).

## When to use

- User asks to "run integration tests", "run all integration tests", or "run sync integration tests"
- After changing sync behaviors, config, or manifest logic and you want to verify all cases pass
- CI or local verification before release

## How to run

From **monorepo root**:

```bash
pnpm run test:integrations
```

From **`packages/sync-integration-tests`**:

```bash
pnpm run test
```

Or directly:

```bash
cd packages/sync-integration-tests && tsx scripts/integration-test-harness.ts
```

The harness clones sandbox-template to sandbox per case, runs clear then sync with output root = sandbox, asserts manifest diff and filesystem (match/missing/extra), then removes sandbox. Exit code 0 only if all cases pass.

## Reference

- Test cases: `packages/sync-integration-tests/scripts/test-cases/` (each `<name>.ts` + `<name>.json`).
- See [README.md](../../../README.md) for test case format and how to add cases.
