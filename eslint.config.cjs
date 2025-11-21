// Flat ESLint config used by the CLI and GitHub Actions. It provides a
// deterministic linting environment on CI without relying on editor settings.
/* eslint-disable unicorn/prevent-abbreviations */
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
<<<<<<< HEAD
module.exports = [
  // Use TypeScript plugin's flat recommended config as the base set of rules
  // TypeScript plugin's flat recommended config
=======

module.exports = [
  // Use TypeScript plugin's flat recommended config as the base set of rules
>>>>>>> refactor/CSS
  ...typescriptPlugin.configs['flat/recommended'],
  // Minimal project specific overrides
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist/', 'node_modules/', 'build/', 'coverage/'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      // Conservative overrides to avoid large CI churn
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
