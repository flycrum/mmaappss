---
name: npm-release-deploy-wizard
description: Walk the developer through publishing @mmaappss/sync to npm. Use when the user wants to release, publish, or deploy the package to npm. Guides version bump, dist-tag, and runs the publish steps.
---

# Deploy @mmaappss/sync to npm (wizard)

Use this skill when the developer wants to **publish or release** the package to npm. No release tool — use only `npm version` and `npm publish`. Guide them step-by-step with clear choices.

## When to use

- User says "publish to npm", "release", "deploy the package", "cut a release", or "publish beta"
- User asks for version bump or release steps

## Pre-flight: must be on main

**Always release from `main`, not a feature branch.**

- Reason: npm publish is permanent — the version tag must point to a commit on `main` for clean traceability; tagging a feature branch commit that later gets squash-merged leaves the tag pointing to an orphaned commit
- If on a feature branch: stop, remind the user to squash-merge the PR into `main` first, then checkout `main` and pull before continuing

Check: `git rev-parse --abbrev-ref HEAD` → if not `main`, abort and instruct.

## Wizard flow

1. **Branch check:** Confirm on `main` (see Pre-flight above).
2. **Version bump:** Use **AskQuestion**: "Version bump?" with options: `major` | `minor` | `patch` | `prerelease` (e.g. beta) | `custom (specify)`. If custom, ask for the exact version string (e.g. `0.2.0-beta.0`).
3. **Prerelease id (if prerelease):** If they chose prerelease, ask for identifier: `beta` | `alpha` or custom. Default `beta`.
4. **Dist-tag:** Use **AskQuestion**: "Publish as dist-tag?" → `beta` | `latest`. Default `beta` for 0.x prereleases, `latest` for stable.
5. **Confirm:** Show the planned version and tag; confirm before running any destructive commands.
6. **Run steps (in order):**
   - From **packages/sync**: run tests and type-check (`pnpm test`, `pnpm type-check`).
   - Run `npm version <version>` (e.g. `npm version 0.1.0-beta.2` or `npm version patch`). For prerelease with id: `npm version prerelease --preid=beta`. Note: `npm version` creates a version bump commit and a git tag by default for all version types (including prereleases) unless `--no-git-tag-version` is passed; use that flag only for workflows that need to skip tag creation.
   - Run `npm publish --tag <tag>` (e.g. `npm publish --tag beta`).
   - Push: `git push && git push --tags`. The release tag ends up on `main` pointing to the version bump commit.

## Reference

- Version/tag rules: [npm-release-versioning](../../rules/npm-release-versioning.md)
- Step order: [npm-release-publish-steps](../../rules/npm-release-publish-steps.md)

## Notes

- Do not run `git push` or `npm publish` unless the user has confirmed. Do not infer commit/push from vague intent (see git-no-commit-from-inferred-intent).
- If the user only wants to know the steps, list them from the rules instead of running commands.
