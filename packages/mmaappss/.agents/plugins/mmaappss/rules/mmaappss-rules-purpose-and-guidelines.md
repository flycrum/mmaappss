# rules/ purpose and guidelines

**Purpose:** Plugin `rules/` holds agent-agnostic guidance symlinked by mmaappss into `.claude/rules/<plugin-name>/` and `.cursor/rules/<plugin-name>/`. One source; all agents. Use for patterns, constraints, and references that apply whenever the plugin is active.

**Format:** Use **`.md`** only. Do not use `.mdc` or platform-specific frontmatter (e.g. `globs`, `alwaysApply`) — those are not agent-agnostic. Plain markdown works for every agent after sync.

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
