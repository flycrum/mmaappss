---
name: mmaappss-integrations-run-one
description: Run a single @mmaappss/sync integration test case by name. Use when you need to run one test case (e.g. basic, disable-claude-rules).
---

# Run one integration test case

Use this skill when you need to **run a single integration test case** by name (e.g. `basic`, `disable-claude-rules`, `excluded-one-file`).

## When to use

- User asks to "run integration test basic" or "run one integration test"
- Debugging a specific scenario without running the full suite

## How to run

From **packages/sync-integration-tests**:

```bash
# One case (note: use -- to pass the case name to the script)
pnpm run test -- <case-name>

# All cases (no arg)
pnpm run test
```

Or directly: `pnpm exec tsx scripts/integration-test-harness.ts <case-name>`.

From **monorepo root** with filter:

```bash
pnpm -F @mmaappss/sync-integration-tests run test -- basic
```

Examples: `pnpm run test -- basic`, `pnpm run test -- disable-claude-rules`, `pnpm run test -- excluded-one-file`.

## Reference

- Harness behavior and case names: [references/integration-tests-overview.md](../references/integration-tests-overview.md)
- Case names = base name of files in `packages/sync-integration-tests/scripts/test-cases/` (e.g. `basic` for `basic.ts` / `basic.json`).
