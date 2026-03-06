import { defineVitestConfig } from '@mmaappss/vitest-config';

export default defineVitestConfig({
  test: {
    include: ['.agents/**/*.spec.ts', '**/*.spec.ts'],
    exclude: ['**/*-test*.ts'],
  },
});
