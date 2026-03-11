# Integration tests

Config-driven integration tests for @mmaappss/sync. **Not published** — run via `pnpm run test:integrations` (from repo root) or `pnpm run test` from this package.

## What they do

- **Sandbox**: Each test clones `sandboxes/sandbox-template/` to `sandboxes/.tests/current`, runs sync with **output root** = current, then asserts. On pass the runner removes current; on failure the harness renames current to `failed-${name}` for inspection. At harness start, `sandboxes/.tests/` is cleared.
- **Harness** (`scripts/integration-test-harness.ts`): Loops over `scripts/test-cases/`. For each case: ensure `current` exists (clone from template), clear, inject that case's config into repo-root `mmaappss.config.ts`, run sync with `MMAAPPSS_OUTPUT_ROOT=sandboxes/.tests/current`, assert manifest diff and filesystem; on pass remove current, on failure rename to `failed-${name}`.
- **Manifest diff**: Expected vs actual manifest compared as objects; report uses `+` / `-` / `~` for added/removed/modified (chalk, vitest-like).
- **File assertions**: Paths from manifest must exist in sandbox; paths in sandbox not in manifest are reported as extra.

## Layout

- `sandboxes/sandbox-template/` — Controlled project tree (AGENTS.md, nested dirs). Cloned to `sandboxes/.tests/current` per run; on failure current is renamed to `failed-<case-name>`.
- `sandboxes/.tests/` — Run artifacts (gitignored). Cleared at harness start.
- `scripts/` — Harness, case runner, test-cases, manifest-diff, file-assertions.
- `.agents/plugins-mmaappss-integrations/` — Skills to run all, run one, create case, debug case.

## Run

From repo root:

- `pnpm run test:integrations`

From this package:

- `pnpm run test`
- `tsx scripts/integration-test-harness.ts [case-name]` (no arg = all cases)

## Adding a test case

1. Add `scripts/test-cases/<name>.ts` exporting `testCase` from `defineIntegrationTestCase({ config, description, jsonPath })`. Use `marketplacesConfig` from `@mmaappss/sync/config`.
2. Add `scripts/test-cases/<name>.json` with expected agent/behavior structure (keys; values can be `true`).
