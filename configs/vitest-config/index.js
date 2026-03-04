import { defineConfig } from 'vitest/config';
import { vitestBase } from './base.js';

/**
 * Merges shared Vitest base (test globals/env, typecheck.include) with workspace overrides,
 * and passes the result to defineConfig with a type assertion so typecheck is accepted.
 * @param {Record<string, unknown>} [override]
 * @returns {ReturnType<typeof defineConfig>}
 */
export function defineVitestConfig(override = {}) {
  const config = { ...vitestBase, ...override };
  return defineConfig(/** @type {Parameters<typeof defineConfig>[0]} */ (config));
}

export { vitestBase } from './base.js';
