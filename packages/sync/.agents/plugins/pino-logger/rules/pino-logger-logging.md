# Pino logging in mmaappss

When editing or adding code under `packages/sync/.agents/plugins/mmaappss/scripts/` (sync runner, adapters, discovery, config, etc.):

- Use the shared logger — import `getLogger` and `setLoggerContext` from `../common/logger.js` (or correct relative path). Do not add `console.log`/`console.warn`/`console.error` for operational flow; use `getLogger().info()`, `.debug()`, `.error()` with a short `msg` and structured fields. Keep `console.error` only for user-facing errors that must always appear on stderr (optionally duplicate with `getLogger().error()`).
- Structured fields — one message string plus an object of context, e.g. `log.info({ agents, configSource }, 'sync started')`. Avoid logging large objects or full stack traces unless at error level and useful for debugging.
- No PII or secrets — do not log tokens, passwords, or full absolute user paths when a relative path or label is enough. Prefer `path.relative(repoRoot, filePath)` or a label when logging paths.
- Context once — `setLoggerContext(repoRoot, tsConfig)` must be called once at process start (e.g. in sync-runner) before any `getLogger()` use. Entry scripts already do this; new entry points should too.

**Compliance verification:** To validate adherence, search for raw console usage (e.g. `rg "console\.(log|warn|error)"` under `scripts/`) and fix or justify any hits. Confirm entry points call `setLoggerContext(repoRoot, tsConfig)` before `getLogger()`, and that operational logs use structured calls such as `getLogger().info()`, `.debug()`, or `.error()` with a message and context object (e.g. `log.info({ ... }, 'sync started')`). Prefer `path.relative(repoRoot, filePath)` (or a label) when logging paths instead of absolute paths. Add or use ESLint rules (e.g. `no-console` with allow list for intentional stderr) or CI checks if not already present to enforce no-console and structured-logging expectations.

See [pino-logger plugin README](../README.md) for logging strategy and how to enable.
