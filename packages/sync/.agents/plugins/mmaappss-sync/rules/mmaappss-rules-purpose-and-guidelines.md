# rules/ purpose and guidelines

**Purpose:**
- Plugin `rules/` = agent-agnostic guidance symlinked by mmaappss into each agent’s rules dir (e.g. `.claude/rules/<plugin-name>/`, `.cursor/rules/<plugin-name>/`)
- Intent: patterns, constraints, references used whenever the plugin is active
- One source; symlinks give all agents the same content
- Keep short critical info in AGENTS.md; use [plugin README](../README.md) (or docs) for expanded guidance

**Format:** Use **`.md`** only; do not use `.mdc` or platform-specific frontmatter.
- Avoid `.mdc`, `globs`, `alwaysApply` — not agent-agnostic; plain markdown works for every agent after sync.

**Guidelines (for AI agents):**
- Keep text condensed, succinct, no trailing punctuation; sacrifice grammar for concision
- Keep things DRY — one canonical source per concern; link from README/AGENTS.md/other rules instead of restating
- One concern per file; split large rules
- Reference code or docs; do not paste long snippets
- Bullet fragments over prose; no trailing punctuation on bullets
- Keep files short; agents ignore buried instructions
- Commands = step lists; put context in rules
- Skills = purpose + when to use; no essays

Base new plugins on the mmaappss plugin layout and this convention. See [mmaappss plugin README](../README.md). See also [mmaappss-file-naming.md](./mmaappss-file-naming.md).
