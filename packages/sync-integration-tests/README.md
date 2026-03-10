# Integration tests

Config-driven integration tests for @mmaappss/sync. **Not published** — run via `pnpm run test:integrations` (from repo root) or `pnpm run test` from this package.

## What they do

- **Sandbox**: Each test clones `sandbox-template/` to `sandbox/`, runs sync with **output root** = sandbox (so all writes go to sandbox), then asserts and destroys sandbox.
- **Harness** (`scripts/integration-test-harness.ts`): Loops over `scripts/test-cases/`. For each case: clone sandbox, clear, inject that case's config into repo-root `mmaappss.config.ts`, run sync with `MMAAPPSS_OUTPUT_ROOT=sandbox`, assert manifest diff (added/removed/modified) and filesystem (match, missing, extra), restore config, remove sandbox.
- **Manifest diff**: Expected vs actual manifest compared as objects; report uses `+` / `-` / `~` for added/removed/modified (chalk, vitest-like).
- **File assertions**: Paths from manifest must exist in sandbox; paths in sandbox not in manifest are reported as extra.

## Layout

- `sandbox-template/` — Controlled project tree (AGENTS.md, nested dirs). Cloned to `sandbox/` per run.
- `scripts/` — Harness, case runner, test-cases, manifest-diff, file-assertions.
- `.agents/plugins-mmaappss-integrations/` — Skills to run all, run one, create case.

## Run

From repo root:

- `pnpm run test:integrations`

From this package:

- `pnpm run test`
- `tsx scripts/integration-test-harness.ts [case-name]` (no arg = all cases)

## Adding a test case

1. Add `scripts/test-cases/<name>.ts` exporting `testCase` from `defineIntegrationTestCase({ config, description, jsonPath })`. Use `marketplacesConfig` from `@mmaappss/sync/config`.
2. Add `scripts/test-cases/<name>.json` with expected agent/behavior structure (keys; values can be `true`).
