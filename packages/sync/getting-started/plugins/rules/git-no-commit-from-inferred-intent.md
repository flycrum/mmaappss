# Do not commit or push from inferred intent

## Scope

**This rule does not apply to commands or skills.** When the user invokes a command (e.g. `/git-commit-staged-files`) or a skill that runs a git workflow, follow that command’s or skill’s document only. Those documents define the flow; this rule does not add confirmation steps or overrides.

This rule applies to **general conversation**: do not run `git commit` or `git push` when the user’s intent is **inferred** or **implicit** from vague or indirect language.

## Rule

- Do not run `git commit` or `git push` when the user has not clearly asked for a commit or push in this turn. Do not infer commit/push intent from earlier turns or from phrases like “take care of it”, “finish this”, or “ship it”.
- If the user’s request could mean “commit” but is ambiguous, ask for confirmation before running commit/push.
- Staging with `git add` is allowed during the session; only commit/push are restricted when intent is inferred.

## When commit/push is allowed

- The user’s message in this turn clearly asks for commit or push (e.g. “commit staged files”, “commit this”, “run /git-commit-staged-files”, “commit and push”), or
- The user invoked a command or skill whose instructions include running commit/push (follow that command/skill; this rule does not apply).

## When it is not allowed (inferred/implicit)

- “Take care of it”, “finish this task”, “ship it” without direct git commit/push language
- Assuming “they probably want me to commit” from context or prior turns
