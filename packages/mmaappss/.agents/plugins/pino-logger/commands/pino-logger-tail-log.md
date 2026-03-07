# Tail mmaappss log

**What it does:** Shows how to watch the mmaappss file log live or inspect the last lines.

**When to use:** You have enabled file logging (`loggingEnabled: true` or `MMAAPPSS_LOGGING_ENABLED=true`) and want to see sync/clear activity as it happens, or inspect the last entries after a run.

**Steps:**

1. Ensure logging is enabled (see [pino-logger README](../README.md) or the skill "Debug mmaappss with file logging").
2. From repo root:
   - **Live tail:** `tail -f .mmaappss/logs/mmaappss.log`
   - **Last N lines:** `tail -n 50 .mmaappss/logs/mmaappss.log`
   - **Pretty-print with jq** (requires jq to be installed): `tail -n 20 .mmaappss/logs/mmaappss.log | jq .`
3. Run your sync or clear in another terminal; log lines will appear as JSON (one object per line).

**Log path:** `.mmaappss/logs/mmaappss.log` (created only when logging is enabled). The `.mmaappss/` directory is gitignored.
