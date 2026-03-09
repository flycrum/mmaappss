# npm-release plugin

Publish **@mmaappss/sync** to npm using only npm built-ins (no release-it, np, or semantic-release).

- **Version and tag:** Use [npm-release-versioning](rules/npm-release-versioning.md) for semver and dist-tag (e.g. beta).
- **Steps:** Use [npm-release-publish-steps](rules/npm-release-publish-steps.md) for the order of commands and checks.
- **Wizard:** When the user wants to release, use the **npm-release-deploy-wizard** skill (AskQuestion for version bump and tag, then run the steps).
