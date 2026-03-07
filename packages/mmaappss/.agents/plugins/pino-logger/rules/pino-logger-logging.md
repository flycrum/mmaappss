# Pino logging in mmaappss

When editing or adding code under `packages/mmaappss/.agents/plugins/mmaappss/scripts/` (sync runner, adapters, discovery, config, etc.):

- Use the shared logger — import `getLogger` and `setLoggerContext` from `../common/logger.js` (or correct relative path). Do not add `console.log`/`console.warn`/`console.error` for operational flow; use `getLogger().info()`, `.debug()`, `.error()` with a short `msg` and structured fields. Keep `console.error` only for user-facing errors that must always appear on stderr (optionally duplicate with `getLogger().error()`).
- Structured fields — one message string plus an object of context, e.g. `log.info({ agents, configSource }, 'sync started')`. Avoid logging large objects or full stack traces unless at error level and useful for debugging.
- No PII or secrets — do not log tokens, passwords, or full absolute user paths when a relative path or label is enough. Prefer `path.relative(repoRoot, filePath)` or a label when logging paths.
- Context once — `setLoggerContext(repoRoot, tsConfig)` must be called once at process start (e.g. in sync-runner) before any `getLogger()` use. Entry scripts already do this; new entry points should too.

See [pino-logger plugin README](../README.md) for logging strategy and how to enable.
