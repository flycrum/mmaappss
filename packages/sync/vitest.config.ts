import { defineVitestConfig } from '@mmaappss/vitest-config';

export default defineVitestConfig({
  test: {
    include: ['**/*.spec.ts'],
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
  typecheck: {
    include: ['**/*.spec-d.ts'],
  },
});
