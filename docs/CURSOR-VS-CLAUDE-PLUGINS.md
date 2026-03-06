# Cursor vs Claude Code Plugins: Deep Comparison

A research document comparing plugin systems, component overlap, naming/format differences, and unique features. **Fact-checked against the official documentation** (see [Documentation sources](#documentation-sources) and [Not in official documentation](#not-in-official-documentation-but-known-to-be-true) below).

---

## Documentation sources

All factual claims in sections 1–14 are taken from these official docs unless otherwise noted:

| Source | URL | What it covers |
|--------|-----|----------------|
| **Cursor – Building plugins** | [cursor.com/docs/plugins/building](https://cursor.com/docs/plugins/building) | Plugin structure, manifest, discovery, rules/skills/agents/commands/hooks/MCP, logos, marketplace |
| **Cursor – Rules** | [cursor.com/docs/context/rules](https://cursor.com/docs/context/rules) | Rule types, frontmatter, AGENTS.md (project-level, not plugin-only) |
| **Cursor – Agent Skills** | [cursor.com/docs/context/skills](https://cursor.com/docs/context/skills) | Skill dirs, SKILL.md format, frontmatter (name, description, license, compatibility, metadata, disable-model-invocation) |
| **Cursor – Hooks** | [cursor.com/docs/agent/hooks](https://cursor.com/docs/agent/hooks) | Hook events, types (command, prompt), locations (~/.cursor, .cursor) |
| **Claude Code – Create plugins** | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | When to use plugins, quickstart, structure overview, settings.json, LSP |
| **Claude Code – Plugins reference** | [code.claude.com/docs/en/plugins-reference](https://code.claude.com/docs/en/plugins-reference) | Manifest schema, path behavior, components (skills, agents, hooks, MCP, LSP), file locations, CLI, debugging |
| **Claude Code – Hooks reference** | [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) | Full hook event list (e.g. InstructionsLoaded, ConfigChange, WorktreeCreate, WorktreeRemove), input/output, decision control |

Skill frontmatter fields beyond the plugin manifest (e.g. Claude’s `allowed-tools`, `context`, `agent`; Cursor’s `license`, `compatibility`, `metadata`) come from each product’s **Skills** documentation, not only the plugin building/reference pages.

---

## 1. High-Level Overlap

| Concept | Cursor | Claude Code | Overlap |
|--------|--------|-------------|--------|
| **Manifest** | `.cursor-plugin/plugin.json` | `.claude-plugin/plugin.json` | Same idea, different dir/file prefix |
| **Skills** | `skills/` + `SKILL.md` | `skills/` or `commands/` + `SKILL.md` | Strong overlap; same open standard (Agent Skills) |
| **Rules** | `rules/` (.mdc, .md) | *(no plugin rules)* | Cursor-only in plugins |
| **Agents** | `agents/` (.md) | `agents/` (.md) | Same concept and layout |
| **Commands** | `commands/` (.md, .mdc, .txt) | `commands/` (legacy; merged into skills) | Similar; Claude treats commands as skills |
| **Hooks** | `hooks/hooks.json` | `hooks/hooks.json` or inline | Same concept, different event sets |
| **MCP** | `.mcp.json` or manifest `mcpServers` | `.mcp.json` or manifest `mcpServers` | Same concept and config shape |
| **LSP** | *(not in Cursor plugin docs)* | `.lsp.json` / `lspServers` | Claude-only in plugins |
| **Settings** | *(not in Cursor plugin docs)* | `settings.json` (e.g. default agent) | Claude-only in plugins |
| **Output styles** | *(none)* | `outputStyles` in manifest | Claude-only |
| **Marketplace** | `.cursor-plugin/marketplace.json` (multi-plugin repo) | Plugin marketplaces (separate docs) | Both support multi-plugin repos |

---

## 2. Manifest: Same Idea, Different Names and Paths

### Path and required field

| | Cursor | Claude Code |
|---|--------|-------------|
| **Manifest path** | `.cursor-plugin/plugin.json` | `.claude-plugin/plugin.json` |
| **Required** | **Manifest required.** Cursor: "Every plugin requires" the manifest. `name` required (lowercase, kebab-case; must start and end with alphanumeric). | **Manifest optional.** Claude: "If omitted... derives the plugin name from the directory name." If present, `name` only required field. |

### Metadata (both support)

- **Both:** `name`, `description`, `version`, `author` (Cursor: `name`, `email` optional; Claude: `name`, `email`, `url` in schema), `homepage`, `repository`, `license`, `keywords`
- **Cursor only (official):** `logo` in [Building plugins](https://cursor.com/docs/plugins/building)—optional; relative path or URL.
- **Claude:** No `logo` in [Plugins reference](https://code.claude.com/docs/en/plugins-reference) manifest schema.

### Component path overrides (manifest)

Both let you point to custom paths instead of default folders:

| Field | Cursor | Claude Code |
|-------|--------|-------------|
| Rules | `rules` (string or array) | — |
| Skills | `skills` (string or array) | `skills` (string or array) |
| Agents | `agents` (string or array) | `agents` (string or array) |
| Commands | `commands` (string or array) | `commands` (string or array) |
| Hooks | `hooks` (string or object) | `hooks` (string, array, or object) |
| MCP | `mcpServers` (string, object, or array) | `mcpServers` (string, array, or object) |
| LSP | — | `lspServers` (string, array, or object) |
| Output styles | — | `outputStyles` (string or array) |

**Path behavior** (official)

- **Cursor:** "If a manifest field is specified (e.g., `\"skills\": \"./my-skills/\"`), it **replaces** folder discovery for that component. The default folder is not also scanned." [Building plugins](https://cursor.com/docs/plugins/building#component-discovery)
- **Claude:** "Custom paths **supplement** default directories - they don't replace them." "If `commands/` exists, it's loaded in addition to custom command paths." [Plugins reference](https://code.claude.com/docs/en/plugins-reference#path-behavior-rules)

---

## 3. Skills and Commands

### Same idea, different naming and structure

- **Cursor:** Skills only. Directory = `skills/<skill-name>/` with `SKILL.md`. Commands are separate: `commands/` with `.md`, `.mdc`, `.markdown`, `.txt`.
- **Claude:** “Commands” and “skills” merged. `commands/` = legacy location (simple Markdown files). `skills/` = directory per skill with `SKILL.md`. Both create slash commands; skills can have supporting files and frontmatter (e.g. `disable-model-invocation`).

So:

- **Overlap:** Same Agent Skills standard (`SKILL.md`, frontmatter, description, when to use). Same idea of “slash command” + optional auto-invocation.
- **Difference:** Cursor has a distinct **commands** concept (agent-executable steps); Claude has only skills + legacy commands-as-skills.

### Skill frontmatter

**Sources:** Cursor [Building plugins](https://cursor.com/docs/plugins/building#skill-frontmatter-fields) lists only `name`, `description`. Cursor [Agent Skills](https://cursor.com/docs/context/skills#frontmatter-fields) adds `license`, `compatibility`, `metadata`, `disable-model-invocation`. Claude plugin reference points to [Skills](https://code.claude.com/docs/en/skills); full frontmatter (e.g. `allowed-tools`, `context`, `agent`) is in the Skills doc.

| Field | Cursor | Claude Code |
|-------|--------|-------------|
| `name` | Required, must match folder [Agent Skills] | Optional (defaults to directory name) [Skills] |
| `description` | Required [Building plugins, Agent Skills] | Recommended (for auto-invocation) [Skills] |
| `disable-model-invocation` | Yes [Agent Skills] | Yes [Skills] |
| `allowed-tools`, `context`, `agent`, `argument-hint`, `user-invocable`, `hooks`, `model` | Not in Cursor plugin/Skills docs | Yes [Claude Skills doc] |
| `license`, `compatibility`, `metadata` | Yes [Agent Skills] | Not in plugin reference |

### Where they live

- **Cursor:** `.cursor/skills/`, `.agents/skills/`, `~/.cursor/skills/`; also `.claude/skills/`, `.codex/skills/` for compatibility. In plugins: `skills/` (or path in manifest).
- **Claude:** `.claude/skills/`, `~/.claude/skills/`, plus plugin `skills/` (and legacy `commands/`). Nested discovery in monorepos (e.g. `packages/frontend/.claude/skills/`).

---

## 4. Rules (Cursor-Only in Plugins)

- **Cursor (official):** Plugins ship **rules** in `rules/`. Discovery: "All `.md`, `.mdc`, or `.markdown` files" [Building plugins](https://cursor.com/docs/plugins/building#component-discovery). Writing rules: `.mdc` with frontmatter `description`, `alwaysApply`, `globs`.
- **Claude:** No rules component in [Plugins reference](https://code.claude.com/docs/en/plugins-reference) or [Create plugins](https://code.claude.com/docs/en/plugins). Project guidance via CLAUDE.md, memory, settings.

So: **rules are a Cursor-only plugin concept** in the official plugin docs.

---

## 5. Agents (Subagents)

- **Same:** Both have `agents/` with Markdown files, YAML frontmatter (`name`, `description`), and system-prompt-style content. Both list agents in the UI (e.g. Cursor “agents”, Claude “/agents”).
- **Cursor:** Can set default agent via plugin only if documented elsewhere (not in the building doc); no `settings.json` in plugin spec.
- **Claude:** Plugin can ship `settings.json` with `agent` to set the default agent when the plugin is enabled.

---

## 6. Commands (Cursor) vs Commands (Claude)

- **Cursor:** `commands/` = agent-executable commands; `.md`, `.mdc`, `.markdown`, `.txt`; frontmatter `name`, `description`. Distinct from skills.
- **Claude:** `commands/` = legacy location for simple Markdown “skills” (no directory, no SKILL.md). Same slash behavior; no separate “commands” concept in the modern plugin model.

So: **overlap** in “something you can run” and file format; **difference** in that Cursor keeps commands and skills as two plugin components, Claude has folded commands into skills.

---

## 7. Hooks: Same Concept, Different Events and Config

### Config file and location

| | Cursor | Claude Code |
|---|--------|-------------|
| **File** | `hooks/hooks.json` (or path/object in manifest) | `hooks/hooks.json` or inline in manifest |
| **User/project** | `~/.cursor/hooks.json`, `/.cursor/hooks.json` | `~/.claude/...`, `.claude/...` (in settings) |
| **Plugin** | `hooks/hooks.json` in plugin root | Same |

### Hook handler types

- **Cursor:** `command` (shell script), `prompt` (LLM-evaluated). No `agent` type in the building doc.
- **Claude:** `command`, `prompt`, `agent` (agentic verifier with tools).

### Event names (different naming, some overlap)

**Sources:** Cursor event list from [Building plugins](https://cursor.com/docs/plugins/building#writing-hooks) and [Hooks](https://cursor.com/docs/agent/hooks). Claude short list from [Plugins reference](https://code.claude.com/docs/en/plugins-reference#hooks); full list (including `InstructionsLoaded`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`) from [Hooks reference](https://code.claude.com/docs/en/hooks).

**Cursor (official):**  
`sessionStart`, `sessionEnd`, `preToolUse`, `postToolUse`, `postToolUseFailure`, `subagentStart`, `subagentStop`, `beforeShellExecution`, `afterShellExecution`, `beforeMCPExecution`, `afterMCPExecution`, `beforeReadFile`, `afterFileEdit`, `beforeSubmitPrompt`, `preCompact`, `stop`, `afterAgentResponse`, `afterAgentThought`, `beforeTabFileRead`, `afterTabFileEdit`.

**Claude (official, [Plugins reference](https://code.claude.com/docs/en/plugins-reference#hooks) + [Hooks reference](https://code.claude.com/docs/en/hooks)):**  
`SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `SubagentStart`, `SubagentStop`, `Stop`, `PreCompact`, `Notification`, `PermissionRequest`, `TaskCompleted`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`.

**Overlap (concept):** session start/end, tool use before/after, subagent start/stop, compact, stop, submit prompt.  
**Cursor-only:** Tab-specific (`beforeTabFileRead`, `afterTabFileEdit`), file read/edit, shell/MCP execution, agent response/thought.  
**Claude-only:** `Notification`, `PermissionRequest`, `TaskCompleted`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`.

So: **same idea** (event-driven automation), **different event sets and naming** (PascalCase vs camelCase, and different product features).

---

## 8. MCP: Same Purpose, Same Shape

| | Cursor | Claude Code |
|---|--------|-------------|
| **Default file** | `.mcp.json` at plugin root | `.mcp.json` at plugin root |
| **Manifest override** | `mcpServers` (path or inline) | `mcpServers` (path or inline) |
| **Content** | `mcpServers: { "name": { command, args, env, ... } }` | Same |
| **Plugin root variable** | — | `${CLAUDE_PLUGIN_ROOT}` for paths |

Overlap: **full** for structure and purpose; only difference is Claude’s explicit `CLAUDE_PLUGIN_ROOT` for portable paths.

---

## 9. LSP (Claude-Only in Plugin Spec)

- **Claude:** Plugins can ship `.lsp.json` or `lspServers` in manifest. Map language id to `command`, `args`, `extensionToLanguage`, etc. Used for code intelligence (go-to-definition, diagnostics, etc.).
- **Cursor:** LSP is not mentioned in the plugin building doc; code intelligence may be handled by the IDE rather than as a plugin component.

So: **LSP as a plugin component is Claude-only** in this comparison.

---

## 10. Settings and Output Styles (Claude-Only in Plugins)

- **Claude:** Plugin root can have `settings.json`. Only `agent` is documented (default agent when plugin enabled). Optional manifest field `outputStyles` points to style files/dirs (adapt output for non–software-engineering uses).
- **Cursor:** No `settings.json` or `outputStyles` in the plugin building doc.

So: **plugin-level default settings and output styles are Claude-only** here.

---

## 11. Logos and Assets

- **Cursor:** `logo` in manifest (relative path or URL). Can use `assets/` (e.g. `assets/logo.svg`). Relative paths can resolve to raw GitHub URLs.
- **Claude:** Plugin reference doesn’t stress a `logo` manifest field or assets folder in the same way; structure shows `scripts/`, not a dedicated `assets/` for logos.

So: **explicit logo and assets in the plugin spec are Cursor-oriented** in this comparison.

---

## 12. Multi-Plugin Repos (Marketplace)

- **Cursor:** `.cursor-plugin/marketplace.json` at repo root: `name`, `owner`, `metadata`, `plugins` array (each with `name`, `source`, `description`, etc.). Resolution: look for `source/.cursor-plugin/plugin.json` and merge with marketplace entry.
- **Claude:** Separate “plugin marketplaces” docs; marketplaces list plugins and installation is via marketplaces. Multi-plugin repos are supported; exact manifest format may differ.

Overlap: **same idea** (one repo, many plugins); **difference** in manifest location/name (`.cursor-plugin/marketplace.json` vs Claude’s marketplace setup).

---

## 13. Unique vs Shared Summary

### Shared / overlapping

- Manifest + metadata (name, description, version, author, etc.).
- **Skills:** Same standard (Agent Skills), `SKILL.md`, description, optional auto-invocation; Claude also has legacy `commands/` as simple skills.
- **Agents:** Same notion and layout (`agents/` + Markdown + frontmatter).
- **Hooks:** Same idea (event + matcher + handler); different event names and some extra types (e.g. Claude `agent` hook, Cursor Tab hooks).
- **MCP:** Same config shape and purpose (`.mcp.json` / `mcpServers`).
- **Custom paths** in manifest for skills, agents, commands, hooks, MCP.
- **Multi-plugin repos** / marketplace support.

### Similar but different

- **Commands:** Cursor = separate “commands” component; Claude = legacy location folded into skills.
- **Path behavior:** Cursor custom path replaces default discovery; Claude custom path adds to defaults.
- **Hook events:** Different names and sets (Cursor Tab, file read/edit, shell/MCP; Claude worktree, instructions loaded, teammate idle, etc.).

### Cursor-only (in plugin system)

- **Rules:** `rules/` (and manifest `rules`) with `.mdc`/frontmatter.
- **Logo:** Explicit `logo` and `assets/` in plugin building doc.
- **Tab hooks:** `beforeTabFileRead`, `afterTabFileEdit`.

### Claude-only (in plugin system)

- **LSP:** `.lsp.json` / `lspServers` in plugin.
- **Plugin settings:** `settings.json` with `agent` (default agent).
- **Output styles:** `outputStyles` in manifest.
- **Hook type:** `agent` (agentic verifier).
- **Plugin root variable:** `${CLAUDE_PLUGIN_ROOT}` in hooks/MCP.
- **Optional manifest:** Discovery without `plugin.json`; name from directory.

---

## 14. Quick Reference Table

| Component / concept | Cursor | Claude | Notes |
|--------------------|--------|--------|--------|
| Manifest dir | `.cursor-plugin/` | `.claude-plugin/` | |
| Rules | `rules/` | — | Cursor only |
| Skills | `skills/` + `SKILL.md` | `skills/` or `commands/` + `SKILL.md` | Same standard; Claude commands = legacy skills |
| Commands | `commands/` (separate) | `commands/` (legacy skills) | Cursor keeps both |
| Agents | `agents/` | `agents/` | Same |
| Hooks | `hooks/hooks.json` | `hooks/hooks.json` or inline | Same idea; different events |
| MCP | `.mcp.json` / `mcpServers` | `.mcp.json` / `mcpServers` | Same |
| LSP | — | `.lsp.json` / `lspServers` | Claude only |
| Settings | — | `settings.json` (e.g. agent) | Claude only |
| Output styles | — | `outputStyles` | Claude only |
| Logo | `logo` + `assets/` | Not emphasized in ref | Cursor only in building doc |
| Marketplace manifest | `.cursor-plugin/marketplace.json` | Separate marketplace docs | Both support multi-plugin |

---

## Not in official documentation (but known to be true)

The following are **not** stated in the official plugin/skills/hooks docs cited above but are widely true or inferable:

- **Cursor `author.url`:** The [Building plugins](https://cursor.com/docs/plugins/building) optional fields table lists only `author.name` and `author.email`. An `author.url` field may be supported in practice or in other Cursor docs but is not documented in the plugin manifest table.
- **Cursor LSP:** The [Building plugins](https://cursor.com/docs/plugins/building) page does not describe LSP as a plugin component. Cursor may provide code intelligence via the IDE or other mechanisms; that is inference, not from the plugin building doc.
- **Claude plugin logo:** The [Plugins reference](https://code.claude.com/docs/en/plugins-reference) manifest schema does not list a `logo` field. Plugins may still support or display logos via marketplace or other mechanisms not described in the reference.
- **Marketplace resolution order (Cursor):** [Building plugins](https://cursor.com/docs/plugins/building) states: (1) component discovery runs within the plugin directory, (2) per-plugin manifest is merged with marketplace entry if found, (3) parser looks for `my-plugin/.cursor-plugin/plugin.json`. The exact order of "look for manifest" vs "run discovery" is as stated there; no claim here goes beyond that.
- **Skill frontmatter beyond tables:** Any skill frontmatter field not listed in the official tables (e.g. Cursor Building plugins only lists `name`, `description` for skills; Agent Skills adds a few more) may still be supported by the runtime. This doc only attributes fields that appear in the cited docs.

---

## References

- [Claude Code – Create plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code – Plugins reference](https://code.claude.com/docs/en/plugins-reference)
- [Cursor – Building plugins](https://cursor.com/docs/plugins/building)
- [Cursor – Rules](https://cursor.com/docs/context/rules)
- [Cursor – Agent Skills](https://cursor.com/docs/context/skills)
- [Cursor – Hooks](https://cursor.com/docs/agent/hooks)
- [Claude Code – Hooks reference](https://code.claude.com/docs/en/hooks)
- [Codex – Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md/) (AGENTS.override.md is Codex-only.)

*This document was fact-checked against the linked official documentation. Claims in sections 1–14 are attributed to those sources; anything not stated there is called out in [Not in official documentation (but known to be true)](#not-in-official-documentation-but-known-to-be-true).*
