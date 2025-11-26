import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const IGNORES = [
  'dist/**',
  'node_modules/**',
  'coverage/**',
  'test-results/**',
  'test/archive/**',
  '**/*.d.ts',
  'docs/**',
  'scripts/lib/**',
];

const GM_GLOBALS = {
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
} as const;

export default tseslint.config(
  { ignores: IGNORES },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...GM_GLOBALS,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...prettierConfig.rules,

      // Prettier
      'prettier/prettier': ['error', { singleQuote: true }],

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // General
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'no-debugger': 'warn',
      'no-undef': 'off',

      // Path Aliases
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'Use path aliases (e.g., @shared/, @features/) instead of relative parent imports.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/^\\.\\./]',
          message: 'Use path aliases in dynamic imports.',
        },
        {
          selector: 'CallExpression[callee.name="require"] > Literal[value=/^\\.\\./]',
          message: 'Use path aliases in require().',
        },
      ],

      // JSX A11y
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: { globals: globals.node },
    plugins: { prettier: prettierPlugin },
    rules: {
      ...prettierConfig.rules,
      'no-undef': 'error',
      '@typescript-eslint/no-var-requires': 'off',
      'prettier/prettier': ['error', { singleQuote: true }],
    },
  },
  {
    files: ['playwright/**/*.ts', 'test/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
