# npm-release plugin

Guidance for publishing **@mmaappss/sync** to npm. No release tool or new dependencies: use `npm version` and `npm publish` only. This plugin provides rules and a deploy wizard skill so an agent can walk the developer through version choice, dist-tag, and publish steps.

## Purpose

- Version bump (major, minor, patch, prerelease) and dist-tag (e.g. `beta`, `latest`)
- Pre-publish checklist and commands
- Optional: test locally (e.g. pnpm link or npm pack) before publishing

See **AGENTS.md** for agent-facing summary and links to rules. Use the **npm-release-deploy-wizard** skill when the user wants to release or publish the package.
