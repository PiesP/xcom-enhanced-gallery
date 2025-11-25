import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'test/archive/**',
      '**/*.d.ts',
      'docs/**',
      'scripts/lib/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // Tampermonkey / Greasemonkey Globals
        GM_getValue: 'readonly',
        GM_setValue: 'readonly',
        GM_deleteValue: 'readonly',
        GM_listValues: 'readonly',
        GM_getResourceText: 'readonly',
        GM_getResourceURL: 'readonly',
        GM_addStyle: 'readonly',
        GM_registerMenuCommand: 'readonly',
        GM_unregisterMenuCommand: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        GM_download: 'readonly',
        GM_openInTab: 'readonly',
        GM_setClipboard: 'readonly',
        GM_notification: 'readonly',
        GM_info: 'readonly',
        unsafeWindow: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,

      // Disable no-undef for TS files as TS compiler handles it
      'no-undef': 'off',

      'prettier/prettier': 'warn',

      // Path Alias Enforcement
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'Relative parent imports are not allowed. Please use path aliases (e.g., @shared/, @features/).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/^\\.\\./]',
          message:
            'Relative parent imports are not allowed in dynamic imports. Please use path aliases.',
        },
        {
          selector: 'CallExpression[callee.name="require"] > Literal[value=/^\\.\\./]',
          message: 'Relative parent imports are not allowed in require(). Please use path aliases.',
        },
      ],

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // JSX A11y
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'no-debugger': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'error',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
];
