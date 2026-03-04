import { config } from '@mmaappss/eslint-config/base.js';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'] },
  ...config,
  {
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    ignores: ['node_modules/**', 'dist/**', '.turbo/**', '**/dist/**'],
  },
  {
    files: ['scripts/**/*.ts', 'packages/mmaappss/scripts/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
];
