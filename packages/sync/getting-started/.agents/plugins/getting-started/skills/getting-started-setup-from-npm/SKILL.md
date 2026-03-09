---
name: getting-started-setup-from-npm
description: Initial setup of @mmaappss/sync as part of or after npm install. Use when the user has run pnpm add @mmaappss/sync and needs config, sample plugin, and script.
---

# Setup @mmaappss/sync from npm

Use this skill when the developer wants to set up @mmaappss/sync from npm — either before or after running `pnpm add @mmaappss/sync` — and needs install (if not done), config, sample plugin, and run sync.

## When to use

- User says "set up mmaappss", "install mmaappss npm package", "configure sync install", "just installed @mmaappss/sync", or wants to add @mmaappss/sync to a project (before or after npm install).

## Wizard flow

1. **Target project** — Use current repo (cwd) or prompt for path if different.
2. **Npm install** — AskQuestion: "Is @mmaappss/sync already installed in the target?" → `Yes` | `No`. If No, from target root run `pnpm add @mmaappss/sync` (or npm/yarn equivalent) before wire-up.
3. **Config style** — AskQuestion: "mmaappss config?" → `Environment variables` (.env) | `TypeScript` (mmaappss.config.ts).
4. **Target state** — AskQuestion or infer: greenfield vs add alongside existing (.agents, mmaappss.config.ts, or MMAAPPSS_* env).

## Wire-up steps

**Sample plugin:** Copy `node_modules/@mmaappss/sync/getting-started/plugins/git` into `<target>/.agents/plugins/git`. If add-to-existing, copy only if `git` plugin is not present.

**Config:**
- Env: Create or append to `<target>/.env` from `node_modules/@mmaappss/sync/getting-started/env.example`. Append only missing MMAAPPSS_* for add-to-existing.
- TypeScript: If greenfield, write `<target>/mmaappss.config.ts` from `node_modules/@mmaappss/sync/getting-started/mmaappss.config.example.ts` (imports from `@mmaappss/sync/config`). If add-to-existing, merge marketplacesEnabled.

**Script:** Add to target package.json: `"mmaappss:sync": "mmaappss-sync"`.

## Verify

From target root: run `pnpm exec mmaappss-sync`. Check Claude, Cursor, and Codex outputs; report OK/missing.
