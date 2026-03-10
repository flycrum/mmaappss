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

From **`packages/sync`**:

```bash
pnpm exec tsx scripts-integration-tests/run-one-integration-test.ts <case-name>
```

Examples:

```bash
pnpm exec tsx scripts-integration-tests/run-one-integration-test.ts basic
pnpm exec tsx scripts-integration-tests/run-one-integration-test.ts disable-claude-rules
pnpm exec tsx scripts-integration-tests/run-one-integration-test.ts excluded-one-file
```

The script runs clear, injects that case's config, runs sync, then asserts manifest and paths. Exit code 0 only if the case passes.

## Reference

- Case names are the base name of files in `packages/sync/scripts-integration-tests/test-cases/` (e.g. `basic` for `basic.ts` / `basic.json`).
