import { defineVitestConfig } from '@mmaappss/vitest-config';

export default defineVitestConfig({
  test: {
    include: ['scripts/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  },
});
