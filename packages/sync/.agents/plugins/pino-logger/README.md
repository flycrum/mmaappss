# pino-logger plugin

Documentation and agent guidance for **Pino-based file logging** in mmaappss. This plugin does not implement logging itself (that lives in the mmaappss driver); it describes the strategy, how to enable it, where logs go, and how to use them when debugging.

---

## Package goal: script entrypoints for consumers

As an npm package, **mmaappss** aims to give consuming projects a clear way to **point to and run** its scripts (e.g. marketplace sync, clear, post-merge) from **their own automation**—git hooks, CI, or other tooling. Consumers keep full control: they choose which hooks to install and when to call our scripts. The package exposes named npm scripts (e.g. `mmaappss:marketplaces:all:sync`, `mmaappss:post-merge`) and, when installed, the script paths under the package so that projects can wire `post-merge`, `post-checkout`, or custom hooks to run these commands with no lock-in.

---

## Purpose

- **Strategy** — When and what we log, and how to keep volume useful without noise.
- **Enable/disable** — Config and env to turn file logging on or off.
- **Where logs go** — Single file location, format, and how to inspect.
- **Debugging** — How to interpret log levels and events when something goes wrong.

Use this plugin's rules and skills so agents (and humans) can consistently enable and use mmaappss file logging.

---

## Logging strategy (architecture)

### Principles

1. **Off by default** — Logging is disabled unless `loggingEnabled: true` or `MMAAPPSS_LOGGING_ENABLED=true`. No file I/O when not needed.
2. **Single file** — All logs go to one file: **`.mmaappss/logs/mmaappss.log`** at repo root. Easy to find and add to `.gitignore`.
3. **Structured JSON** — Pino writes one JSON object per line. Good for grepping, tooling, and future log aggregation.
4. **Judicious volume** — We log:
   - **Info**: sync/clear start and completion, config source, per-adapter enable/disable.
   - **Debug**: discovery (plugin dirs, marketplace/plugin counts), detailed flow when needed.
   - **Error**: failures (e.g. unlink, sync error) with context; user-facing errors stay on stderr too.
5. **No PII/sensitive paths in logs** — Prefer relative paths and avoid logging secrets or full user paths when not necessary.

### What is logged (when enabled)

| Event              | Level | Contents (typical)                          |
|--------------------|-------|---------------------------------------------|
| Sync started       | info  | `configSource`, `agents`                    |
| Sync completed     | info  | `outcomes`                                  |
| Clear started      | info  | `agents`                                    |
| Clear completed    | info  | `outcomes`                                  |
| Adapter run        | info  | `agent`, `enabled`                           |
| Discovery scan     | debug | `pluginsDirsCount`, `pluginsDirs`          |
| Discovery complete | debug | `marketplacesCount`, `totalPlugins`         |
| Sync/clear failure | error | `err`, `agent` (and/or `filePath` etc.)     |

When logging is disabled, `getLogger()` returns a no-op logger; no file is created.

---

## Enabling file logging

### Option 1: TypeScript config (repo root)

In `mmaappss.config.ts` (or your copy of the example):

```ts
export default {
  // ... other options
  loggingEnabled: true,
};
```

### Option 2: Environment variable

- **Name:** `MMAAPPSS_LOGGING_ENABLED`
- **Values:** `true` / `1` = enabled; `false` / `0` or unset = use config default (or false).
- Env **overrides** TS config when set. Useful for one-off debugging without editing config.

Example (bash):

```bash
MMAAPPSS_LOGGING_ENABLED=true pnpm run mmaappss:marketplaces:cursor:sync
```

### Option 3: `.env` or `.envrc.local`

Set `MMAAPPSS_LOGGING_ENABLED=true` in `.env` or `.envrc.local` at repo root. Load order is the same as other mmaappss env (e.g. `.env` then `.envrc.local`; process env overrides file).

---

## Log file location and format

- **Path:** `<repo-root>/.mmaappss/logs/mmaappss.log`
- **Format:** One JSON object per line (NDJSON). Fields typically include:
  - `level` (number or label)
  - `time` (ISO or ms)
  - `name`: `"mmaappss"`
  - `msg`: short message
  - Additional keys: `agents`, `outcomes`, `agent`, `err`, `configSource`, etc.

**Inspect:**

```bash
# Tail live
tail -f .mmaappss/logs/mmaappss.log

# Pretty-print last 20 lines (requires jq; use "jq ." for pretty-printed JSON, "jq -c" for compact single-line)
tail -20 .mmaappss/logs/mmaappss.log | jq .

# Grep for errors
grep '"level":50' .mmaappss/logs/mmaappss.log
# or
grep '"msg":"sync agent failed"' .mmaappss/logs/mmaappss.log
```

The directory `.mmaappss/` is listed in the repo `.gitignore` so log files are not committed.

---

## Debugging with logs

1. **Enable logging** (config or env) and run the failing command (e.g. sync or clear).
2. **Open** `.mmaappss/logs/mmaappss.log` (or tail it during the run).
3. **Find the failure:** search for `"level":50` (error) or messages like `sync agent failed`, `clear agent failed`, `failed to unlink marketplace file`.
4. **Context:** each line includes `time`, `msg`, and extra fields (e.g. `agent`, `err`, `filePath`). Use the preceding `sync started` / `adapter run` / `discovery` lines to see the path that led to the error.

For integration or local debugging, enable logging only when needed to avoid clutter and disk use.

---

## Plugin layout

- **rules/** — Agent-agnostic `.md` only; prefix with plugin name. `pino-logger-logging.md` for mmaappss scripts; see [mmaappss rules purpose](../mmaappss/rules/mmaappss-rules-purpose-and-guidelines.md).
- **skills/** — Skill(s) for "debug mmaappss with file logging": when to use, how to enable, how to read logs.
- **commands/** — Optional command docs (e.g. "Tail mmaappss log") for discoverability.

This plugin follows the same agent-agnostic layout as the mmaappss driver plugin (see [mmaappss plugin README](../mmaappss/README.md)).
