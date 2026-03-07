# Explicit commit authorization rule

## Rule

- Do not run `git commit` or `git push` unless the user explicitly asks for it in the current turn or as part of another command/skill that explicitly instructs to do so
- Do not infer commit/push intent from earlier turns or general requests
- If intent is ambiguous, ask for confirmation before running any commit/push command

## Allowed explicit intents (examples)

- `git commit staged files`
- `commit this`
- `run /git-commit-staged-files`
- `commit and push`

## Not explicit enough (examples)

- `take care of it`
- `finish this task`
- `ship it` without direct git commit/push language
