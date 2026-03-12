/**
 * Claude preset constants: single source of truth for agent name, paths, and option literals.
 * Used by claude-agent-preset and any Claude-specific sync behavior options.
 */

export const claudeAgentPresetConfig = {
  CONSTANTS: {
    /** Runtime agent identifier for claude. */
    AGENT_NAME: 'claude',
    /** Env var that enables/disables claude marketplace sync. */
    ENV_VAR: 'MMAAPPSS_MARKETPLACE_CLAUDE',
    /** Comment line above gitignore entry for CLAUDE.md. */
    GITIGNORE_COMMENT: '\n# mmaappss: symlinked from AGENTS.md for Claude\n',
    /** Path to Claude plugin marketplace.json. */
    MARKETPLACE_FILE: '.claude-plugin/marketplace.json',
    /** Target dir for symlinked plugin rules. */
    RULES_DIR: '.claude/rules',
    /** Legacy path for rules sync manifest (unified manifest used now). */
    RULES_SYNC_MANIFEST: '.claude/.mmaappss-claude-sync.json',
    /** Path to Claude settings.json. */
    SETTINGS_FILE: '.claude/settings.json',
    /** Source file for agents-md symlink (e.g. AGENTS.md). */
    SOURCE_FILE: 'AGENTS.md',
    /** Target symlink name for Claude (CLAUDE.md). */
    TARGET_FILE: 'CLAUDE.md',
  } as const,
};
