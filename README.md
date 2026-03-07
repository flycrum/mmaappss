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

- to be obsolete as soon as the industry adopts some common-sense standards 😆
- ...but in the meantime try to align to and leverage available APIs
  - and as of the moment I'm typing this, that's marketplaces and plugins!
- unify the fragmented state of sharing rules, commands, skills, agents, etc
- define once, empower developers on teams to use with their preferred coding agent(s)
- prioritze minimal configurations to get start, but powerful options for when you need them
- keep it simple dumb-ass (kisda) & don't reinvent the wheel

## repo structure

- **pnpm + Turborepo** monorepo
- `configs/` — shared configs (eslint, prettier, typescript, vitest, vite)
- `packages/mmaappss/` — scripts and tooling

## core vs usage at root (monorepo layout)

Two distinct concepts:

- **Core (source of truth):** The sync system, markdown, and plugin definitions live in **`packages/mmaappss`** (including `.agents/plugins` and the mmaappss driver plugin).
- **Usage at repo root:** The monorepo root is where the system is *used*: local marketplaces are registered at root (e.g. `.claude-plugin/`, `.cursor-plugin/`). Plugin definitions live in a **single place**: `packages/mmaappss/.agents/plugins/`. Sync runs from repo root and discovery finds both root `.agents/plugins/` (if present) and nested `packages/mmaappss/.agents/plugins/`, so no symlink is needed.
- [Read the mmaappss package docs](packages/mmaappss/README.md) for plugins, configuration, and sync details.

## development

- **install:** `pnpm install`
- **commands:** `pnpm run type-check` | `lint` | `format`
- **layout:** `configs/` = shared configs (eslint, prettier, typescript, vitest, vite); `packages/mmaappss/` = scripts
- **run a script:** `pnpm exec tsx path/to/script.ts` or via package script (e.g. `pnpm run mmaappss:marketplaces:claude:sync`)
