---
name: npm-release-deploy-wizard
description: Walk the developer through publishing @mmaappss/sync to npm. Use when the user wants to release, publish, or deploy the package to npm. Guides version bump, dist-tag, and runs the publish steps.
---

# Deploy @mmaappss/sync to npm (wizard)

Use this skill when the developer wants to **publish or release** the package to npm. No release tool — use only `npm version` and `npm publish`. Guide them step-by-step with clear choices.

## When to use

- User says "publish to npm", "release", "deploy the package", "cut a release", or "publish beta"
- User asks for version bump or release steps

## Wizard flow

1. **Version bump:** Use **AskQuestion**: "Version bump?" with options: `major` | `minor` | `patch` | `prerelease` (e.g. beta) | `custom (specify)`. If custom, ask for the exact version string (e.g. `0.2.0-beta.0`).
2. **Prerelease id (if prerelease):** If they chose prerelease, ask for identifier: `beta` | `alpha` or custom. Default `beta`.
3. **Dist-tag:** Use **AskQuestion**: "Publish as dist-tag?" → `beta` | `latest`. Default `beta` for 0.x prereleases, `latest` for stable.
4. **Confirm:** Show the planned version and tag; confirm before running any destructive commands.
5. **Run steps (in order):**
   - From **packages/sync**: run tests and type-check (`pnpm run test`, `pnpm run type-check`).
   - Run `npm version <version>` (e.g. `npm version 0.1.0-beta.2` or `npm version patch`). For prerelease with id: `npm version prerelease --preid=beta`.
   - Run `npm publish --tag <tag>` (e.g. `npm publish --tag beta`).
   - Remind to push: `git push` and `git push --tags` (or `git push --follow-tags`).

## Reference

- Version/tag rules: [npm-release-versioning](../../rules/npm-release-versioning.md)
- Step order: [npm-release-publish-steps](../../rules/npm-release-publish-steps.md)

## Notes

- Do not run `git push` or `npm publish` unless the user has confirmed. Do not infer commit/push from vague intent (see git-no-commit-from-inferred-intent).
- If the user only wants to know the steps, list them from the rules instead of running commands.
