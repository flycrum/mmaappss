/**
 * Shared constants for agent presets and plugin content layout.
 * Single exported object; one runtime import for consumers.
 * Used by cursor config and rules-sync (integration tests keep their own literals to catch breaking changes).
 */

export const presetConstants = {
  /** Regex for agent .md/.mdc/.markdown files. */
  AGENT_EXT: /\.(md|mdc|markdown)$/i,
  /** Plugin subdir name for agent files. */
  AGENTS_SUBDIR: 'agents',
  /** Regex for command files (.md, .mdc, .markdown, .txt). */
  COMMAND_EXT: /\.(md|mdc|markdown|txt)$/i,
  /** Plugin subdir name for command files. */
  COMMANDS_SUBDIR: 'commands',
  /** Default name for the local marketplace in agent configs (e.g. marketplace.json, settings.json). */
  DEFAULT_MARKETPLACE_NAME: 'mmaappss-plugins',
  /** Owner name written into marketplace.json for the local marketplace. */
  MARKETPLACE_OWNER: 'mmaappss',
  /** Ordered list of plugin content subdirs (rules, commands, skills, agents). */
  get PLUGIN_CONTENT_DIRS(): readonly ['rules', 'commands', 'skills', 'agents'] {
    return [
      this.RULES_SUBDIR,
      this.COMMANDS_SUBDIR,
      this.SKILLS_SUBDIR,
      this.AGENTS_SUBDIR,
    ] as const;
  },
  /** Regex for rule .md/.mdc/.markdown files. */
  RULE_EXT: /\.(md|mdc|markdown)$/i,
  /** Plugin subdir name for rule files. */
  RULES_SUBDIR: 'rules',
  /** Plugin subdir name for skill dirs. */
  SKILLS_SUBDIR: 'skills',
} as const;
