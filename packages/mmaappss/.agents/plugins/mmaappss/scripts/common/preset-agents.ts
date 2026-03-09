/**
 * Single source of truth for built-in preset agent names (runtime + types).
 * Use presetAgents for iteration/defaults; use PresetAgentName for typing.
 */

import type { ArrayValues } from 'type-fest';

/** Ordered list of built-in preset agent names. Use for runtime iteration and default lists. */
export const presetAgents = ['claude', 'cursor', 'codex'] as const;

/** Union type of preset agent names derived from presetAgents. */
export type PresetAgentName = ArrayValues<typeof presetAgents>;
