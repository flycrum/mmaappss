---
name: getting-started-updates
description: Refresh sample plugins and templates in the target project. Use when new sample plugins or templates are available in getting-started.
---

# Updates for @mmaappss/sync

Use this skill when the user wants to refresh sample plugins or templates in the target project.

## When to use

- User says "update mmaappss", "refresh plugins", "new templates", or "sync templates"
- A new sample plugin was added to getting-started and should be copied
- env.example or mmaappss.config.example.ts changed and target should be updated

## Update steps

1. **Identify target** — Use cwd or prompt for project path.
2. **Compare source** — List `node_modules/@mmaappss/sync/getting-started/` (plugins/, env.example, mmaappss.config.example.ts).
3. **Compare target** — List target `.agents/plugins/`, .env, mmaappss.config.ts.
4. **Suggest additions** — If getting-started has plugins not in target (e.g. new sample), offer to copy. Do not overwrite existing plugins without user confirmation.
5. **Suggest config refresh** — If env.example or mmaappss.config.example.ts changed, show diff and offer to merge or replace (user chooses).
6. **Run sync** — After any changes, run mmaappss-sync and verify outputs.

## Notes

- Never overwrite user customizations without explicit confirmation
- Prefer merge (append new MMAAPPSS_* vars, merge agentsConfig) over full replace for config
