import { config } from '@mmaappss/eslint-config/base.js';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ['node_modules/**'] },
  ...config,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
];
