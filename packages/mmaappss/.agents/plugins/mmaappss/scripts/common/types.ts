/**
 * Core types for the mmaappss sync framework.
 * Agent-agnostic; adapters map these to platform-specific manifests.
 */

/** Supported coding agents for marketplace sync. */
export type Agent = 'claude' | 'cursor' | 'codex';

/** A plugin discovered under .agents/plugins/<name>/ */
export interface DiscoveredPlugin {
  /** Parsed manifest description */
  description?: string;
  /** Whether this plugin has .claude-plugin/plugin.json */
  hasClaudeManifest: boolean;
  /** Whether this plugin has .codex-plugin/plugin.json (parity; Codex sync currently uses the same plugin list and writes AGENTS.override.md) */
  hasCodexManifest: boolean;
  /** Whether this plugin has .cursor-plugin/plugin.json */
  hasCursorManifest: boolean;
  /** Parsed manifest name (from plugin.json) or directory name */
  manifestName?: string;
  /** Plugin directory name (e.g. 'mmaappss', 'git') */
  name: string;
  /** Absolute path to plugin directory */
  path: string;
  /** Path relative to repo root (for manifests) */
  relativePath: string;
  /** Parsed manifest version */
  version?: string;
}

/** A marketplace location: root or nested .agents/plugins/ directory */
export interface DiscoveredMarketplace {
  /** Label for display (e.g. 'Root marketplace' or 'packages/foo marketplace') */
  label: string;
  /** Plugins in this marketplace */
  plugins: DiscoveredPlugin[];
  /** Absolute path to .agents/plugins directory */
  pluginsDir: string;
  /** Path relative to repo root (e.g. '.agents/plugins' or 'packages/foo/.agents/plugins') */
  relativePath: string;
}

/** Result of a sync operation (enable or disable). */
export interface SyncOutcome {
  agent: Agent;
  success: boolean;
  message?: string;
}
