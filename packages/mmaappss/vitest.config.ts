import { defineVitestConfig } from '@mmaappss/vitest-config';

export default defineVitestConfig({
  test: {
    include: ['.agents/**/*.test.ts', '**/*.test.ts'],
  },
});
