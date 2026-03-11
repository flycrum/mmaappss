# Troubleshooting @mmaappss/sync

Problem/solution and Q&A reference for the getting-started doctor skill and other docs.

## Claude local plugin cache

### What happens by default

Claude Code caches local plugin files under `~/.claude/plugins/cache/local-plugins/{plugin-name}/{version}/`. It does **not** invalidate that cache when you change files in the plugin source. Only a **version bump** in the plugin's `plugin.json` or **manually deleting** the cache dir causes Claude to re-read from source.

### Common gotcha

You edit or delete a command/skill/rule in `.agents/plugins/<name>/` and run sync. The marketplace and plugin are correct, but Claude still shows the old content (e.g. a removed command still appears). That's because Claude is serving the **cached** copy, not the live source.

### What mmaappss does

On every **sync**, we remove the cache dir for each plugin in our marketplace (`~/.claude/plugins/cache/local-plugins/{name}/{version}/` or `.../local-plugins/{name}/` if no version). On **clear**, we remove the cache for each plugin we're tearing down. So after sync (or after clear then sync), the next Claude restart loads fresh content from source. You don't need to bump the plugin version or manually delete the cache when using mmaappss sync/clear.

### If Claude still shows stale content

- Ensure you ran sync (or clear then sync) and restarted Claude.
- If you're not using mmaappss sync: manually remove the cache for that plugin, e.g. `rm -rf ~/.claude/plugins/cache/local-plugins/<plugin-name>`, or bump the version in the plugin's `.claude-plugin/plugin.json`.

### References

- Claude Code issue: [Local plugin cache not invalidated when source files change](https://github.com/anthropics/claude-code/issues/28492) (duplicate of #17361)
- Sync behavior: `ClaudeLocalPluginCacheBustBehavior` in `@mmaappss/sync` (Claude preset only)
