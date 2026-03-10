---
name: mmaappss-integrations-run-all
description: Run all @mmaappss/sync integration tests (all test cases). Use when you need to run the full integration test suite.
---

# Run all integration tests

Use this skill when you need to **run the full integration test suite** for @mmaappss/sync (all config-driven test cases in `scripts-integration-tests/test-cases/`).

## When to use

- User asks to "run integration tests", "run all integration tests", or "run sync integration tests"
- After changing sync behaviors, config, or manifest logic and you want to verify all cases pass
- CI or local verification before release

## How to run

From **monorepo root**:

```bash
pnpm run test:integrations
```

From **`packages/sync`**:

```bash
pnpm run test:integrations
```

Or directly:

```bash
cd packages/sync && tsx scripts-integration-tests/integration-test-harness.ts
```

The harness runs clear, then for each test case injects that case's config into `mmaappss.config.ts`, runs sync, asserts manifest shape and that all registered paths exist, then restores config. Exit code 0 only if all cases pass.

## Reference

- Test cases live in `packages/sync/scripts-integration-tests/test-cases/` (each `<name>.ts` + `<name>.json`).
- See [scripts-integration-tests/README.md](../../../README.md) for test case format and how to add cases.
