# npm-release versioning and dist-tag

- **Semver:** Use `npm version <version>` with a concrete version (e.g. `0.1.0-beta.1`) or with `patch` / `minor` / `major`. For prerelease: `npm version prerelease --preid=beta` or set the version explicitly (e.g. `0.2.0-beta.0`).
- **Dist-tag:** Publish with `npm publish --tag <tag>`. Use `beta` for prereleases so installs are `pnpm add @mmaappss/sync@beta`; use `latest` for stable. Default to `beta` for 0.x prereleases.
- **Git tag:** After a successful publish, tag the release (e.g. `v0.1.0-beta.1`) for traceability: `git tag v0.1.0-beta.1` and `git push --tags` (or push the version commit with `--follow-tags`).
