import { defineVitestConfig } from '@mmaappss/vitest-config';

export default defineVitestConfig({
  test: {
    include: ['.agents/**/*.spec.ts', '**/*.spec.ts'],
    // Exclude auxiliary test helpers; use recursive globs and common Vitest defaults.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*-test*.ts',
      '**/.git/**',
      '**/.cache/**',
      'cypress/**',
      '*.config.*',
    ],
  },
});
