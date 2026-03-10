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

Single entry point: **harness** with optional case name. From **`packages/sync-integration-tests`**:

```bash
# Run one case by name
pnpm exec tsx scripts/integration-test-harness.ts <case-name>

# Run all cases (no arg)
pnpm exec tsx scripts/integration-test-harness.ts
```

Examples:

```bash
pnpm exec tsx scripts/integration-test-harness.ts basic
pnpm exec tsx scripts/integration-test-harness.ts disable-claude-rules
pnpm exec tsx scripts/integration-test-harness.ts excluded-one-file
```

The harness clones sandbox-template to sandbox per case, runs clear, injects that case's config at repo root, runs sync with output root = sandbox, asserts manifest diff and paths, restores config, removes sandbox. Exit code 0 only if the case(s) pass.

## Reference

- Case names are the base name of files in `packages/sync-integration-tests/scripts/test-cases/` (e.g. `basic` for `basic.ts` / `basic.json`).
