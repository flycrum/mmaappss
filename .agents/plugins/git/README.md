# git plugin

Local agent plugin for **git workflow commands**: commit staged files, craft message, push with guards (no main, no empty staged, no force-push workarounds).

## Purpose

- One command: **Commit staged files** — pre-checks (branch ≠ main, staged files exist), story ID from branch, diff review, commit message by complexity, commit, push `--force-with-lease`, post-commit checks (adjacent .md, .agents/plugins, tests). Target audience: AI agents; terse output.

## Layout

- **commands/** — `git-commit-staged-files.md`: full workflow and rules for `/git-commit-staged-files`.
