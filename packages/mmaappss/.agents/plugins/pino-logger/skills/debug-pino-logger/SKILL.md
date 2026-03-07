---
name: Debug mmaappss with file logging
description: Enable and use Pino file logging to diagnose mmaappss sync or clear failures. Use when a user reports sync/clear errors or when you need to trace discovery, config, or adapter flow.
---

# Debug mmaappss with file logging

Use this skill when you need to **diagnose why mmaappss sync or clear failed** or to **trace the flow** (config, discovery, per-agent enable/disable) without adding temporary console logs.

## When to use

- User or test reports: "sync failed", "clear failed", or an error from a marketplace sync script.
- You need to see which agents were enabled, which marketplaces were discovered, or where a failure occurred (adapter, discovery, unlink, etc.).
- You want a repeatable way to capture structured logs to a file for inspection or sharing.

## How to enable file logging

1. **One-off (no config change)**  
   Run the failing command with env set:
   ```bash
   MMAAPPSS_LOGGING_ENABLED=true pnpm run mmaappss:marketplaces:cursor:sync
   ```
   (Replace with the actual script: `mmaappss:marketplaces:claude:sync`, `mmaappss:marketplaces:all:clear`, etc.)

2. **Persistent (config)**  
   In repo root `mmaappss.config.ts` set:
   ```ts
   loggingEnabled: true,
   ```
   Or in `.env` / `.envrc.local`: `MMAAPPSS_LOGGING_ENABLED=true`.

Env overrides config when set.

## Where logs are written

- **Path:** `<repo-root>/.mmaappss/logs/mmaappss.log`
- **Format:** One JSON object per line (NDJSON). Fields include `level`, `time`, `name` ("mmaappss"), `msg`, and context (e.g. `agents`, `outcomes`, `agent`, `err`).

## How to read the log file

1. **Reproduce the failure** with logging enabled (env or config).
2. **Open or tail** the file:
   - `tail -f .mmaappss/logs/mmaappss.log` (live)
   - Or open `.mmaappss/logs/mmaappss.log` after the run.
3. **Find errors:** Search for `"level":50` (error) or messages like:
   - `sync agent failed` / `clear agent failed` — check `agent` and `err`.
   - `failed to unlink marketplace file` — check `filePath` and `err`.
4. **Context:** Use earlier lines in the same run:
   - `sync started` / `clear started` — which agents and config source.
   - `adapter run` — per-agent enabled/disabled.
   - `discovery: complete` — how many marketplaces and plugins.

Use `jq` to pretty-print or filter: e.g. `tail -50 .mmaappss/logs/mmaappss.log | jq .`

## Turning logging off

- Remove `loggingEnabled: true` from config, or set `MMAAPPSS_LOGGING_ENABLED=false`.
- Logging is off by default; leave it off when not debugging to avoid extra I/O and log growth.
