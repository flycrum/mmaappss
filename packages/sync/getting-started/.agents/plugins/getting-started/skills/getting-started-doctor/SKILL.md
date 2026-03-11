---
name: getting-started-doctor
description: Diagnose sync failures, config issues, version/schema mismatches. Use when sync fails or outputs are missing/outdated.
---

# Play doctor for @mmaappss/sync

Use this skill when sync fails, outputs are missing or outdated, or the user needs to debug mmaappss setup.

## When to use

- User says "sync failed", "doctor", "debug mmaappss", "outputs missing", or "investigate sync"
- Sync ran but Claude/Cursor/Codex outputs are empty or stale
- Version or schema changes may have broken the setup

## Doctor steps

1. **Identify target** — Use cwd or prompt for project path.
2. **Check install** — Verify `@mmaappss/sync` in node_modules (or linked). Check package.json for mmaappss:sync script.
3. **Check config** — Verify mmaappss.config.ts or .env with MMAAPPSS_MARKETPLACE_* vars. Ensure claude/cursor/codex are enabled.
4. **Check plugins** — Verify `.agents/plugins/` has at least one plugin (e.g. git). Check plugin manifests (.cursor-plugin, .claude-plugin).
5. **Run sync** — Run `mmaappss-sync` and capture stdout/stderr. If it fails, report the error.
6. **Compare outputs** — After successful sync, check .claude-plugin/marketplace.json, .cursor rules/manifest, AGENTS.override.md. Report what exists vs missing.
7. **Stale Claude plugin content** — If Claude shows old or removed commands/skills after sync, see [references/troubleshooting.md#claude-local-plugin-cache](references/troubleshooting.md#claude-local-plugin-cache).
8. **Suggest fixes** — Based on findings: missing config → add from getting-started templates; missing plugin → copy sample; version mismatch → suggest upgrade or reinstall.

## Reference

- Templates: `node_modules/@mmaappss/sync/getting-started/` (plugins/git, env.example, mmaappss.config.example.ts)
- Pino logging: Enable with MMAAPPSS_LOGGING_ENABLED=true for file logs (see pino-logger plugin)
- Claude local plugin cache / stale content: [references/troubleshooting.md](references/troubleshooting.md#claude-local-plugin-cache)
