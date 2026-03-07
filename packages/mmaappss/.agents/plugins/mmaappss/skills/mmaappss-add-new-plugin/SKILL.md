---
name: Add new .agents/plugins plugin for local marketplace
description: Create or update a plugin under .agents/plugins/<name>/ in an mmaappss repo. Use when the user asks to add a plugin, scaffold a new plugin, or follow mmaappss plugin layout.
---

# Add new plugin

Use this skill when you need to **create or update an agents plugin for the local marketplace** under `.agents/plugins/<name>/`. Reference the `mmaappss` plugin for layout and conventions

## Steps

1. Create `.agents/plugins/<name>/` with `.cursor-plugin/plugin.json` and `.claude-plugin/plugin.json` (name, description, version, author)
2. Add at plugin root: **README.md** — purpose only; **AGENTS.md** — purpose plus optional requirements (links to rules)
3. Put context in **rules/** as `.md` only; prefix rule filenames with plugin name per [mmaappss-file-naming](../../rules/mmaappss-file-naming.md). **AGENTS.md** must exist only at the plugin root — do not place AGENTS.md inside rules/ or any other subdirectory
4. Optional: commands/, skills/, agents/, hooks/ per [mmaappss plugin README](../../README.md). Same file-naming prefix for content files
5. Keep rules/commands/skills DRY and lean per [mmaappss-writing-rules-commands-skills](../../rules/mmaappss-writing-rules-commands-skills.md)
6. After adding or modifying a plugin, run sync from repo root: `pnpm run mmaappss:marketplaces:all:sync` (or per-agent sync). Sync discovers plugins automatically; no hand-edit of marketplace list
