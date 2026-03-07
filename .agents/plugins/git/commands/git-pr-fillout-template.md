# Fill PR template from git diff vs parent branch

**What it does:** Detect current branch + most likely parent branch, analyze changes between parent and `HEAD`, and fill `.github/pull_request_template.md` into a copy-ready markdown PR description for AI agents

**Usage:** `/git-pr-fillout-template` -> detect parent -> inspect diff/log/stat -> output completed markdown in a fenced code block

---

## Output contract

- Always return final PR text inside a markdown code fence
- Do not write files
- Keep phrasing terse and high-signal for AI agent reviewers
- Bullets: no trailing punctuation

---

## Steps

1. **Read template and current branch**
   - Read `.github/pull_request_template.md`
   - `git rev-parse --abbrev-ref HEAD` -> `CURRENT_BRANCH`

2. **Detect parent branch** (priority order; stop at first valid match)

   a. **Reflog branch-creation signals** (highest confidence)
   - `git reflog show --all | grep "CURRENT_BRANCH" | grep -E "branch:|checkout: moving from" | head -20`
   - Extract candidate names from patterns:
     - `branch: Created from refs/heads/X`
     - `checkout: moving from X to CURRENT_BRANCH`
   - Normalize names:
     - Remove `refs/heads/`
     - Convert `origin/flycrum/X` -> `flycrum/X`
   - Validate each candidate:
     - Exists: `git branch -a | grep "CANDIDATE"`
     - Reachability: `git merge-base HEAD CANDIDATE` succeeds
   - Pick first valid candidate from newest reflog entries

   b. **Merge-base branch tip match**
   - `git merge-base HEAD main` as baseline anchor if needed
   - Collect branch candidates:
     - `git for-each-ref --format='%(refname:short)' refs/heads refs/remotes`
   - For each candidate not equal to `CURRENT_BRANCH`:
     - `MB=$(git merge-base HEAD CANDIDATE)`
     - `TIP=$(git rev-parse CANDIDATE)`
     - Candidate matches if `MB == TIP` (branch likely created from candidate tip)
   - If multiple matches, pick most recent by commit date:
     - `git log -1 --format=%ct CANDIDATE`

   c. **Sequential naming heuristic**
   - Parse ticket-like token from branch (e.g. `MR-8088`)
   - Find nearby lower numbers with same prefix
   - Validate each with merge-base tip match (`merge-base == candidate tip`)
   - Pick nearest lower valid branch

   d. **Fallback**
   - Use `main`, else `master`, else first existing default-like branch

3. **Gather change context**
   - `git diff PARENT_BRANCH...HEAD --stat`
   - `git diff PARENT_BRANCH...HEAD --name-only`
   - `git log PARENT_BRANCH..HEAD --oneline`
   - `git diff PARENT_BRANCH...HEAD`

4. **Analyze for PR narrative**
   - Identify primary problem solved and approach used
   - Group changes by theme/component
   - Note config/flags/toggles/trebuchets if present
   - Extract testing actions from changed areas
   - Detect deploy-impacting changes (env, migrations, infra, breaking behavior)

5. **Fill template sections**
   - Use repo template section names as source of truth
   - Add prominent parent-branch banner right under summary/description:
     - `** 🎯 PARENT BRANCH DETECTED: <branch> 🎯 **`
   - Section guidance:
     - `Summary`: 2-3 concise sentences on problem + approach
     - `Screenshots`: `N/A` unless visual/UI behavior changed
     - `What changed`: numbered list by importance; brief sub-bullets allowed
     - `Checklist`: keep checkbox lines from template; mark `[x]` only if directly verifiable from available evidence, otherwise keep `[ ]`
     - `Notes for reviewers`: testing steps, risky areas, flags/toggles, reviewer focus
   - If no deployment concerns, mention none in reviewer notes instead of inventing

6. **Return result**
   - Output one fenced markdown block only
   - Content should be ready to paste as PR description with minimal edits

---

## Writing style

- Audience: AI agents
- Dense and concise over polished prose
- Focus on what changed + why it matters
- Avoid trivial line-by-line implementation noise
