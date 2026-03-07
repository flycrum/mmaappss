import { defineVitestConfig } from '@mmaappss/vitest-config';

export default defineVitestConfig({
  test: {
    include: ['.agents/**/*.spec.ts', '**/*.spec.ts'],
    // Exclude auxiliary test helpers; include common defaults so node_modules/dist stay excluded.
    exclude: ['node_modules', 'dist', '**/*-test*.ts'],
  },
});
