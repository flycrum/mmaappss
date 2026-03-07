# Commit staged files, craft message, push

**Scope:** Only commit files that are already staged. Do not run `git add` or stage any files as part of this command.

**What it does:** Run pre-checks, derive story ID, analyze staged diff, write commit message, commit, push with `--force-with-lease`, then post-commit checks. No user verification checkpoints. All output/responses: terse.

**Usage:** `/git-commit-staged-files` → pre-checks → story ID, analyze staged, message, commit, push, run checks.

---

## ⛔ CRITICAL - NEVER

- Rename/delete local branches (unless user says so)
- Delete remote branches (never)
- Force-push to fix branch issues → report, wait

Push fails → stop, report, wait. No workarounds.

---

## STOP IF ON MAIN

**First check.** Before anything else.

1. `git rev-parse --abbrev-ref HEAD`
2. If `main`: STOP. No staged check, no git ops. Tell user CRITICAL: Cannot commit on main branch (commits on feature branches only). Abort.
3. Else: continue.

---

## STOP IF NO STAGED FILES

**Second check.**

1. `git diff --cached --name-only`
2. If none: STOP. Tell user, suggest `git add`. Do not run steps below.
3. Else: continue.

---

## Writing guidelines

- Write for the target audience of AI Agents
- Keep condensed and succinct; sacrifice grammar for concision
- Exclude punctuation at end of bullet points or end of linesVerify each finding against the current code and only fix it if needed.

In @.agents/plugins/git/commands/git-commit-staged-files.md at line 91, Update the "Good" example to include the required emoji at the end of the subject line: replace the example string "feat(auth): [LADA-1980] Add token expiry handling in AuthService" with the same text but append the proper emoji (e.g., "🔒") so the example demonstrates the full semantic commit format including the emoji.

---

## Steps (only if pre-checks pass)

1. **Story ID**
   - `git rev-parse --abbrev-ref HEAD` → extract ID from branch. Patterns: `flycrum/LADA-XXXX`, `flycrum/AI-XXXX`, `LADA-1234`, `AI-XXXX` (prefix-dash-numbers OR folder/prefix-dash-numbers).
   - No match → no prefix.

2. **Commit message**
   - Use `git diff --cached` and `git diff --cached --stat` to see what changed when drafting subject and body.
   - **Subject**: `type(scope): [STORY-ID] Verb + specific change`. Required prefix: **type** from allowed list (feat, inc, issue, refactor, test, docs, config, deps, wip, poc); **(scope)** optional (e.g. component/util/folder). No "fix bug"/"update code".
   - **Body**: For future AI agents. Quick summary of what changed so they have context for what was done. Follow writing guidelines above (audience AI agents, condensed/succinct, no trailing punctuation).
   - Format: `type(scope): [ID] Subject\n\nBody`.

3. **Commit**
   - `git commit -m "<subject>" -m "<body>"`. Fold in any user context if given.

4. **Push**
   - `git push --force-with-lease`. Fail → stop, report, do not fix.

5. **Confirm**
   - Hash + summary. Push success. (Included in final commit summary table.)

6. **Post-commit checks** (identify + report only; don't auto-fix)
   - Committed list: `git show --name-only --pretty=format: HEAD`
   - **6a. Adjacent .md**: Same dir — same-base `.md`, `README.md`, `CHANGELOG.md`. Stale refs/examples? → report critical + paths.
   - **6b. .agents/plugins/**: Grep `.agents/plugins/` for file paths, component/API names, examples. Stale? → report + paths.
   - **6c. Tests**: Expected locations — Ruby: `app/…` → `test/…_test.rb`; TS/JS/Vue: colocated `*.spec.ts`/`*.test.ts`. Exists? Needs updates for new/changed/removed? Missing for testable code? → report only.
   - **Final response — tabular**
     - Emit a **commit summary table** then a **post-commit checks table** (markdown). No prose before tables; optional one-line verdict after.
     - **Commit summary table** (columns: Field | Value):
       - Field: Branch, Story ID, Hash, Push
       - Value: branch name, story ID or "—", short hash, "OK" or error
     - **Post-commit checks table** (columns: Category | Status | Details):
       - Category: Adjacent .md | .agents/plugins/ | Tests | Related code
       - Status: up-to-date or needs attention or critical
       - Details: short reason, paths, or "—". Stale/missing → list paths or one-line reason
     - All up-to-date → verdict line: "in sync." Else → verdict: "needs attention" + which categories

---

## Examples

**Subjects:**
- Good: `feat(auth): [LADA-1980] Add token expiry handling in AuthService`
- Bad: `Fix bug`, `Update code`, subject without type prefix

**Body:** Quick summary for future AI agents (what changed, for context). Apply writing guidelines above.
