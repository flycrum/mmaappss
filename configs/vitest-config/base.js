/**
 * Shared Vitest options: test globals/env and typecheck spec-d pattern.
 * Merge into workspace configs via defineVitestConfig() or manually.
 */
export const vitestBase = {
  test: {
    globals: true,
    environment: 'node',
  },
  typecheck: {
    include: ['src/**/*.spec-d.ts'],
  },
};
