# Cursor, Claude Code, and Codex Skills: Comparison

A research document comparing standalone skills systems across the three agents. **Fact-checked against official documentation** (see [Documentation sources](#documentation-sources) below).

---

## Documentation sources

All factual claims are taken from these official docs unless otherwise noted:

| Source | URL | What it covers |
|--------|-----|----------------|
| **Claude Code – Skills** | [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) | Where skills live, SKILL.md, frontmatter, nested discovery, bundled skills |
| **Codex – Agent Skills** | [developers.openai.com/codex/skills/](https://developers.openai.com/codex/skills/) | Where Codex reads skills, `.agents/skills`, open standard, agents/openai.yaml |
| **Cursor – Agent Skills** | [cursor.com/docs/skills](https://cursor.com/docs/skills) | Skill directories, SKILL.md format, frontmatter, optional dirs |
| **Agent Skills spec** | [agentskills.io/specification](https://agentskills.io/specification) | Open standard: directory structure, frontmatter, optional scripts/references/assets |

---

## 1. High-level overlap

| Aspect | Claude Code | Codex | Cursor |
|--------|-------------|-------|--------|
| **Format** | Agent Skills standard: dir with `SKILL.md` | Same | Same |
| **Invocation** | Implicit (by description) + explicit (`/skill-name`) | Implicit + explicit (`$skill-name` or `/skills`) | Implicit + explicit (`/skill-name`) |
| **Optional dirs** | `scripts/`, `references/`, `assets/`, templates | `scripts/`, `references/`, `assets/` | `scripts/`, `references/`, `assets/` |
| **Progressive disclosure** | Metadata at startup; full instructions when skill is used | Same | Same |

---

## 2. Where skills live (project-level)

### Claude and `.agents/skills`

**Claude Code does not support `.agents/skills`:** creating a skill in `.claude/skills/` works; moving that same skill to `.agents/skills/` breaks—Claude Code does not discover or load it. Cursor and Codex, by contrast, discover skills in `.agents/skills/` natively.

### Per-product locations

| Scope | Claude Code | Codex | Cursor |
|-------|-------------|-------|--------|
| **Project** | `.claude/skills/` only | `.agents/skills` (from CWD up to repo root) | `.agents/skills/`, `.cursor/skills/` |
| **User/global** | `~/.claude/skills/` | `$HOME/.agents/skills` | `~/.cursor/skills/` |
| **Other** | Plugin `skills/`; enterprise (managed settings) | `/etc/codex/skills`, bundled | Compatibility: `.claude/skills/`, `.codex/skills/` (and user-level) |

**Nested discovery**

- **Claude:** Nested `.claude/skills/` (e.g. `packages/frontend/.claude/skills/`).
- **Codex:** Scans `.agents/skills` in every directory from CWD up to repo root.
- **Cursor:** Project-level dirs listed; compatibility dirs also loaded.

---

## 3. SKILL.md and frontmatter

### Required / recommended

| Field | Claude Code | Codex | Cursor |
|-------|-------------|-------|--------|
| `name` | Optional (defaults to directory name) | Required (in SKILL.md) | Required; must match folder name |
| `description` | Recommended (for auto-invocation) | Required | Required |

### Optional frontmatter

| Field | Claude Code | Codex | Cursor |
|-------|-------------|-------|--------|
| `disable-model-invocation` | Yes | — | Yes |
| `allowed-tools`, `context`, `agent`, `argument-hint`, `user-invocable`, `hooks`, `model` | Yes | — | Not in Skills docs |
| `license`, `compatibility`, `metadata` | Not in plugin reference | — | Yes |
| **Codex-specific** | — | `agents/openai.yaml` (UI, `allow_implicit_invocation`, icons) | — |

---

## 4. Optional directories (scripts, references, assets)

All three support the same optional layout under each skill dir:

| Directory | Purpose |
|-----------|---------|
| `scripts/` | Executable code the agent can run |
| `references/` | Additional docs loaded on demand |
| `assets/` | Templates, configs, static resources |

---

## 5. Enable / disable

| Product | Mechanism |
|---------|-----------|
| **Claude** | Frontmatter `disable-model-invocation: true`; `user-invocable: false` to hide from `/` menu |
| **Codex** | `~/.codex/config.toml`: `[[skills.config]]` with `path` and `enabled = false` |
| **Cursor** | Frontmatter `disable-model-invocation: true` |

---

## 6. Unique vs shared summary

### Shared

- Agent Skills open standard; `SKILL.md` + optional dirs.
- Implicit (description-based) and explicit (slash or `$`) invocation.
- Progressive loading (metadata first, full content when used).

### Claude-only (in skills docs)

- `.claude/skills/` only for project skills; **does not** read `.agents/skills`.
- Extra frontmatter: `allowed-tools`, `context`, `agent`, `hooks`, `argument-hint`, `user-invocable`, `model`.
- String substitutions: `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`.

### Codex-only

- `agents/openai.yaml` for UI and policy (`allow_implicit_invocation`).
- Disable via `~/.codex/config.toml` without deleting the skill.

### Cursor-only (in skills docs)

- Explicit `license`, `compatibility`, `metadata` in frontmatter.
- Loads `.agents/skills/` and `.cursor/skills/`; also compatibility dirs for Claude/Codex.

---

## 7. Quick reference

| Item | Claude | Codex | Cursor |
|------|--------|-------|--------|
| Project skills path | `.claude/skills/` | `.agents/skills` | `.agents/skills/`, `.cursor/skills/` |
| Supports `.agents/skills` natively | **No** | Yes | Yes |
| SKILL.md required | Yes | Yes | Yes |
| Open standard | Yes (agentskills.io) | Yes | Yes |

---

## Not in official documentation (but known to be true)

- **Claude and `.agents/skills`:** Empirically confirmed that moving a skill from `.claude/skills/` to `.agents/skills/` causes Claude Code to stop discovering it. Official docs list only `.claude/skills/`, `~/.claude/skills/`, and plugin skills.
- **Codex/Cursor native `.agents/skills`:** Both document `.agents/skills` as a project-level location; no additional caveat here.

---

## References

- [Claude Code – Skills](https://code.claude.com/docs/en/skills)
- [Codex – Agent Skills](https://developers.openai.com/codex/skills/)
- [Cursor – Agent Skills](https://cursor.com/docs/skills)
- [Agent Skills specification](https://agentskills.io/specification)

*This document was fact-checked against the linked official documentation. Claims are attributed to those sources; anything not stated there is called out in [Not in official documentation](#not-in-official-documentation-but-known-to-be-true).*
