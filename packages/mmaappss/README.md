# mmaappss

**pronounced:** `maps`

**stands for:**
> mutant marketplaces and agent portable plugins super sync
> or 
> mega marketplaces and adaptive pretend plugins sync system
> or
> magic marketplaces and aggressively pungent plugins sync sauce 
> ...idk, don't really care 😆

## purpose

- support local marketplaces and plugins!
- unify the fragmented state of sharing rules, commands, skills, agents, etc
- define once, empower developers on teams to use with their preferred coding agent(s)
- prioritze minimal configurations to get start, but powerful options for when you need them
- keep it simple dumb-ass (kisda) & don't reinvent the wheel
- provide a way to group releated rules, commands, skills, agents, etc. together
- leverage available APIs and -- as of the moment I'm typing this -- that's marketplaces and plugins!

## different ways to sync

our goal is to support **four ways** of syncing contexts/rules/commands/skills/agents/etc

1. **root marketplace** — root-level local marketplace manifest and plugins
2. **nested marketplaces** — nested directories local marketplaces and plugins
3. **root context** — instructions that apply everywhere (e.g. `AGENTS.md` / `CLAUDE.md` in user home or app config)
4. **nested context** — instructions per repo or per directory (e.g. `AGENTS.md` / `CLAUDE.md` in project and subdirs)

Focus here is **local marketplaces** (repo-as-marketplace), not public Cursor Marketplace or team marketplaces.

<table>
  <thead>
    <tr>
      <th></th>
      <th>claude</th>
      <th>codex</th>
      <th>cursor</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>root marketplace</strong></td>
      <!-- CLAUDE -->
      <td>
        <div>✅ official support</div>
        <ul>
          <li><code>.claude-plugin/marketplace.json</code></li>
          <li>script to sync</li>
          <li>symlink rules</li>
        </ul>
        <a href="https://code.claude.com/docs/en/plugin-marketplaces">Create and distribute a plugin marketplace</a>
      </td>
      <!-- CODEX -->
      <td>
        <div>❓ no official support</div>
        <ul>
          <li>no plugin marketplace</li>
          <li>workaround: sync rules to AGENTS.md or add MCP to config??</li>
        </ul>
        <a href="https://developers.openai.com/codex">Codex</a>, <a href="https://developers.openai.com/codex/mcp">MCP</a>
      </td>
      <!-- CURSOR -->
      <td>
        <div>✅ official support</div>
        <ul>
          <li><code>.cursor-plugin/marketplace.json</code></li>
          <li>script to sync</li>
          <li>symlink rules</li>
        </ul>
        <a href="https://cursor.com/docs/plugins/building">Building plugins</a>
      </td>
    </tr>
    <tr>
      <td><strong>nested marketplaces</strong></td>
      <!-- CLAUDE -->
      <td>
        <div>❓ no official support</div>
        <ul>
          <li>script could do recursive search for these?</li>
          <li>...and also symlink rules?</li>
        </ul>
      </td>
      <!-- CODEX -->
      <td>❓ no official support</td>
      <!-- CURSOR -->
      <td>
        <div>❓ no official support</div>
        <ul>
          <li>script could do recursive search for these?</li>
          <li>...and also symlink rules?</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>root context</strong></td>
      <!-- CLAUDE -->
      <td>
        <div>✅ official support</div>
        <ul>
          <li><code>~/CLAUDE.md</code></li>
          <li>symlink <code>AGENTS.md</code></li>
          <li>can also have `CLAUDE.local.md`</li>
        <a href="https://code.claude.com/docs/en/memory#claude-md-files">CLAUDE.md files</a>
        </ul>
      </td>
      <!-- CODEX -->
      <td>
        <div>✅ official support</div>
        <ul>
          <li><code>~/AGENTS.md</code></li>
          <li>can also have `AGENTS.override.md`</li>
        </ul>
        <a href="https://developers.openai.com/codex/guides/agents-md">Custom instructions with AGENTS.md</a>
      </td>
      <!-- CURSOR -->
      <td>
        <div>✅ official support</div>
        <ul>
          <li><code>~/AGENTS.md</code></li>
          <li>✖︎ no known overrides</li>
        </ul>
        <a href="https://cursor.com/docs/context/rules#agentsmd">AGENTS.md support</a>
      </td>
    </tr>
    <tr>
      <td><strong>nested context</strong></td>
      <!-- CLAUDE -->
      <td>
        <div>✅ official support</div>
        <ul>
          <li><code>~/CLAUDE.md</code></li>
          <li>symlink <code>AGENTS.md</code></li>
          <li>can also have `CLAUDE.local.md`</li>
        </ul>
      </td>
      <!-- CODEX -->
      <td>
        <div>✅ official support</div>
        <ul>
          <li><code>~/AGENTS.md</code></li>
          <li>can also have `AGENTS.override.md`</li>
        </ul>
      </td>
      <!-- CURSOR -->
      <td>
        <div>✅ official 3rd-party support</div>
        <ul>
          <li><code>~/AGENTS.md</code></li>
          <li>❓ unsure about `AGENTS.override.md`</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

## Plugins

### General

Plugins are extensions that add rules, skills, agents, commands, hooks, MCP, etc., with their own schema per coding agent. They generally store a manifest (name, version, description, author) plus directories like `skills/`, `rules/`, `commands/`, `agents/`, `hooks/`, etc.

- [Claude Code – Plugins](https://code.claude.com/docs/en/plugins)
- [Cursor – Building plugins](https://cursor.com/docs/plugins/building)
- Codex: no plugin marketplace yet — [Codex](https://developers.openai.com/codex), [MCP](https://developers.openai.com/codex/mcp); "no plugin marketplace (yet)" as in the table above.

### Using `.agents/plugins/`

Our convention: **`.agents/plugins/`** is the single place for agent-agnostic, locally defined plugins, for both **root** and **nested** marketplaces (items 1–2 above). Each plugin is a directory under `.agents/plugins/<plugin-name>/` (e.g. `.agents/plugins/git/`, `.agents/plugins/mmaappss/`). Colocate by logical group (what would otherwise be split across many `AGENTS.md`/`CLAUDE.md` fragments); "define once, empower developers to use with their preferred coding agent(s)". Thin agent-specific wrappers: each plugin has `.claude-plugin/` and/or `.cursor-plugin/` (with `plugin.json`) that **point to** the same content (e.g. `skills/`, `hooks/`, `rules/`, `commands/`) so one source of truth is used by Claude and Cursor.

**Plugin schema and `rules/`:** Our plugin schema includes a `rules/` directory (e.g. `.agents/plugins/mmaappss/rules/`). Neither Cursor nor Claude expose plugin `rules/` out of the box. The sync scripts **must** symlink each plugin's `rules/` into the root-level `.claude/rules/` and `.cursor/rules/` directories (e.g. `.claude/rules/<plugin-name>/*.md`, `.cursor/rules/<plugin-name>/*.md`), matching proof-of-concept behavior (e.g. colada's `.claude/rules` and `.cursor/rules`).

- [Claude – Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Cursor – Building plugins](https://cursor.com/docs/plugins/building)
- Codex: no plugin marketplace (see above). Optional reference: proof-of-concept layout at colada `.agents` (e.g. `plugins/marketplaces`, `plugins/git`, thin `.claude-plugin`/`.cursor-plugin` + shared content).

#### Claude Code

Manifest: `.claude-plugin/plugin.json`. Local marketplace: `.claude-plugin/marketplace.json` at repo root. Schema and behavior: [Claude plugins](https://code.claude.com/docs/en/plugins), [plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces).

#### Cursor

Manifest: `.cursor-plugin/plugin.json`. Local marketplace: `.cursor-plugin/marketplace.json` at repo root. Schema: [Cursor – Building plugins](https://cursor.com/docs/plugins/building) (including multi-plugin repo / marketplace manifest).

#### Codex

No plugin marketplace yet. Document current state and link to Codex/MCP docs; we may add a workaround (e.g. syncing into AGENTS.md) as implemented by the mmaappss sync scripts.

## The mmaappss plugin (driver)

The **super sync** plugin for mmaapps is **`.agents/plugins/mmaappss`** (lives under `packages/mmaappss/`). It provides **context, rules, and skills** that describe how to run, enforce, and audit the rest of the local plugins & marketplaces system (and itself — meta). It has a **non-standard `scripts/` directory** (not the same as Cursor's optional `scripts/` for hooks): these scripts are the **sync workers** that read config (env + TypeScript config), discover root and nested `.agents/plugins/`, and generate/update Claude, Cursor, and Codex local marketplace manifests in an **idempotent** way. So: mmaappss plugin = docs + rules/skills + sync scripts; the scripts are the "engine" that write `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`, and (for Codex) the `## Codex Marketplace` section in root `AGENTS.md`.

## Configuration

### Environment variables (simple on/off)

- `MMAAPPSS_MARKETPLACE_ALL` — master switch for all local marketplaces.
- `MMAAPPSS_MARKETPLACE_CLAUDE`, `MMAAPPSS_MARKETPLACE_CURSOR`, `MMAAPPSS_MARKETPLACE_CODEX` — per-agent marketplace enable/disable.

Committed defaults can live in `.env`; overrides in `.envrc.local` (gitignored). We use an npm package (e.g. dotenv) to load these; process env takes precedence over file values. Note: we could look into overridding and using a different npm package, for more flexibility, potentially.

### TypeScript config

A TypeScript config (e.g. `mmaappss.config.ts` at repo root or in package) provides enable/disable for all marketplaces, Claude, Cursor, and Codex (same semantics as env vars). Start with this basic shape; expand later. **User can use one or the other or both:** env vars and TS config can be used together; document precedence (e.g. env overrides TS config). Scripts are executed via `tsx` (e.g. `pnpm exec tsx .agents/plugins/mmaappss/scripts/...`).

### Exclusions config

- **Supported now:** Exclude entire root or nested **directories** from having their `.agents/plugins/` considered (e.g. ignore `node_modules/`, `dist/`, or specific nested repos).
- **Future:** (1) Exclude a **specific plugin** (e.g. `.agents/plugins/mmaappss` or a named plugin). (2) Exclude a **specific file** within a plugin (e.g. `.agents/plugins/git/skills/git-commit.md`). The TypeScript config shape should allow these to be added later without breaking changes.

## Root context and nested context (items 3–4)

For "root context" (e.g. repo-root `AGENTS.md`) and "nested context" (e.g. `packages/fancy-package/AGENTS.md`), instructions are colocated with code. Cursor and Codex support this natively:

- [Cursor – AGENTS.md](https://cursor.com/docs/context/rules#agentsmd)
- [Codex – Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude – CLAUDE.md files](https://code.claude.com/docs/en/memory#claude-md-files)

We do not generate `AGENTS.md` content; developers write `AGENTS.md` in any directory. Our scripts symlink **CLAUDE.md** from **AGENTS.md** (root and nested, recursively) so Claude sees the same instructions. All `CLAUDE.md` files we create (symlinks) must be in `.gitignore` so only `AGENTS.md` is committed.
