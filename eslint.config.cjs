const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const path = require('node:path');

module.exports = [
  // Use TypeScript plugin's flat recommended config as the base set of rules
  ...typescriptPlugin.configs['flat/recommended'],
  // Minimal project specific overrides
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist/', 'node_modules/', 'build/', 'coverage/'],
    languageOptions: {
      parser: typescriptParser,
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
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**', '..\\**'],
              message: 'Use registered path aliases (@shared, @features, @/) instead of parent-relative imports.',
            },
          ],
        },
      ],
    },
  },
];
