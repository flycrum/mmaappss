# git plugin

Local agent plugin for **git workflow commands**: commit staged files with push guards, and generate PR descriptions from the repo template based on parent-branch diffs.

## Purpose

- **Commit staged files** — pre-checks (branch ≠ main, staged files exist), story ID from branch, diff review, commit message by complexity, commit, push `--force-with-lease`, post-commit checks (adjacent .md, .agents/plugins, tests)
- **Fill PR template** — detect parent branch (reflog-first strategy), diff parent...HEAD, analyze change themes, fill `.github/pull_request_template.md`, emit copy-ready markdown

## Layout

- **commands/** — `git-commit-staged-files.md`: workflow and rules for `/git-commit-staged-files`
- **commands/** — `git-pr-fillout-template.md`: workflow and rules for `/git-pr-fillout-template`
- **rules/** — `git-no-commit-from-inferred-intent.md`: do not run commit/push when intent is inferred (does not apply to commands/skills)
