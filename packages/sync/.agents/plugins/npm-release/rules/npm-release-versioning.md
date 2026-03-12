# npm-release versioning and dist-tag

- **Semver:** Use `npm version <version>` with a concrete version (e.g. `0.1.0-beta.1`) or with `patch` / `minor` / `major`. For prerelease: `npm version prerelease --preid=beta` or set the version explicitly (e.g. `0.2.0-beta.0`).
- **Pre-publish verification:** Before `npm publish` and Git tag steps, run verification: `pnpm run test`, `pnpm run type-check`, `pnpm run lint` (and `pnpm run build` if the package defines it). Confirm no uncommitted changes (e.g. `git status` clean).
- **Dist-tag:** Publish with `npm publish --tag <tag>`. Use `beta` for prereleases so installs are `pnpm add @mmaappss/sync@beta`; use `latest` for stable. Default to `beta` for 0.x prereleases.
- **Git tag:** This repo uses npm's automatic git commit and tag: `npm version` creates both by default. After publish, push the version commit and tags with `git push` and `git push --tags` (or `git push --follow-tags`). To use manual tagging instead, run `npm version` with `--no-git-tag-version`, then create the tag yourself (`git tag v0.1.0-beta.1`) and push. Avoid duplicate tags: do not run both automatic `npm version` tagging and a manual `git tag` for the same release.
