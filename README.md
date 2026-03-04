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

- unify the fragmented state of sharing rules, commands, skills, agents, etc
- define once, empower developers on teams to use with their preferred coding agent(s)
- prioritze minimal configurations to get start, but powerful options for when you need them
- keep it simple dumb-ass (kisda) & don't reinvent the wheel
- provide a way to group releated rules, commands, skills, agents, etc. together
- leverage available APIs and -- as of the moment I'm typing this -- that's marketplaces and plugins!

## repo structure

- **pnpm + Turborepo** monorepo
- `configs/` — shared configs (eslint, prettier, typescript, vitest, vite)
- `packages/mmaappss/` — scripts and tooling

## development

- **install:** `pnpm install`
- **commands:** `pnpm run type-check` | `lint` | `format`
- **layout:** `configs/` = shared configs (eslint, prettier, typescript, vitest, vite); `packages/mmaappss/` = scripts
- **run a script:** `pnpm exec tsx path/to/script.ts` or via package script (e.g. `pnpm run hello`)
