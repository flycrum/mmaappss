# npm-release publish steps

Run from **packages/sync** (or monorepo root with `pnpm --filter @mmaappss/sync run ...`):

1. **Tests:** `pnpm run test` and `pnpm run type-check` (and lint if desired).
2. **Version:** `npm version <version>` (e.g. `0.1.0-beta.1` or `patch`). This updates package.json, creates a git commit, and creates a git tag for all versions by default (including prerelease versions like `0.1.0-beta.1`); tags are skipped only when `--no-git-tag-version` is provided.
3. **Publish:** `npm publish --tag <tag>` (e.g. `--tag beta`). Ensure you are logged in (`npm whoami`) and that the package name/scope is correct.
4. **Git push:** `git push` and optionally `git push --tags` (if not already pushed with the version commit).

No release tool or new deps. Do not run `npm publish` without setting the intended dist-tag for prereleases.
