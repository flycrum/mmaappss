---
name: Run mmaappss local marketplace sync scripts
description: Invoke mmaappss sync or clear scripts so local marketplace manifests and plugin discovery stay up to date. Use when adding/editing plugins, after pull, or when user asks to sync marketplaces.
---

# Run marketplace sync scripts

Use this skill when you need to **run the mmaappss agent-plugins-for-local-marketplace scripts** (sync or clear) so Cursor/Claude/Codex see the latest `.agents/plugins/`. Claude uses marketplace manifests; Cursor uses content sync into `.cursor/` (rules, commands, skills, agents); Codex uses the generated section in AGENTS.override.md.

## When to use

- After adding or changing a plugin under `.agents/plugins/`
- After `git pull` / merge (or use post-merge hook if enabled)
- User asks to "sync agent marketplaces", "refresh plugins", or "run mmaappss sync"

## How to run

Scripts live in **`packages/mmaappss`** (`@mmaappss/mmaappss`). From **monorepo root**:

```bash
pnpm --filter @mmaappss/mmaappss run <script>
```

From **`packages/mmaappss`**:

```bash
pnpm run <script>
```

## Scripts (package.json)

| Script | What it does |
|--------|----------------|
| `mmaappss:marketplaces:all:sync` | Sync all agents (Claude, Cursor, Codex) |
| `mmaappss:marketplaces:claude:sync` | Sync Claude only |
| `mmaappss:marketplaces:cursor:sync` | Sync Cursor only |
| `mmaappss:marketplaces:codex:sync` | Sync Codex only |
| `mmaappss:marketplaces:all:clear` | Clear all agents (teardown manifests/symlinks) |
| `mmaappss:marketplaces:claude:clear` | Clear Claude only |
| `mmaappss:marketplaces:cursor:clear` | Clear Cursor only |
| `mmaappss:marketplaces:codex:clear` | Clear Codex only |
| `mmaappss:post-merge` | Sync all only if `postMergeSyncEnabled` (for git hooks) |

**Tests (integration):** `mmaappss:marketplaces:all:sync:test`, `...:claude:sync:test`, `...:cursor:sync:test`, `...:codex:sync:test`, and `...:all:clear:test` / `...:claude:clear:test`, etc.

## Config

Sync respects `mmaappss.config.ts` and env (`MMAAPPSS_MARKETPLACE_*`). Per-agent enable/disable; excluded dirs apply. See [plugin README](../../README.md#configuration).
