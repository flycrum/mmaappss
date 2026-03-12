---
name: mmaappss-integrations-run-all
description: Run all @mmaappss/sync integration tests. Use when you need to run the full integration test suite.
---

# Run all integration tests

Use this skill when you need to **run the full integration test suite** (all config-driven test cases).

## When to use

- User asks to "run integration tests", "run all integration tests", or "run sync integration tests"
- After changing sync behaviors, config, or manifest logic and you want to verify all cases pass
- CI or local verification before release

## How to run

From **monorepo root**:

```bash
pnpm run test:integrations
```

From **packages/sync-integration-tests**:

```bash
pnpm run test
```

Or with filter from root: `pnpm -F @mmaappss/sync-integration-tests run test`.

## Reference

- Harness behavior, test case layout, and commands: [references/integration-tests-overview.md](../references/integration-tests-overview.md)
- Test cases: `packages/sync-integration-tests/scripts/test-cases/` (each `<name>.ts` + `<name>.json`). See package [README.md](../../../README.md) for format and how to add cases.
