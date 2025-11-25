import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

// Shared constants
const PRETTIER_RULE = ['error', { singleQuote: true }];
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

// Tampermonkey/Greasemonkey globals
const GM_GLOBALS = Object.fromEntries(
  [
    'GM_getValue',
    'GM_setValue',
    'GM_deleteValue',
    'GM_listValues',
    'GM_getResourceText',
    'GM_getResourceURL',
    'GM_addStyle',
    'GM_registerMenuCommand',
    'GM_unregisterMenuCommand',
    'GM_xmlhttpRequest',
    'GM_download',
    'GM_openInTab',
    'GM_setClipboard',
    'GM_notification',
    'GM_info',
    'unsafeWindow',
  ].map(name => [name, 'readonly']),
);

// JSX A11y rules (all warn level)
const JSX_A11Y_RULES = Object.fromEntries(
  [
    'alt-text',
    'aria-role',
    'aria-props',
    'aria-proptypes',
    'aria-unsupported-elements',
    'role-has-required-aria-props',
    'role-supports-aria-props',
  ].map(rule => [`jsx-a11y/${rule}`, 'warn']),
);

// Path alias enforcement rules
const PATH_ALIAS_RULES = {
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
};

export default [
  { ignores: IGNORES },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021, ...GM_GLOBALS },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      ...PATH_ALIAS_RULES,
      ...JSX_A11Y_RULES,
      'no-undef': 'off',
      'prettier/prettier': PRETTIER_RULE,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'no-debugger': 'warn',
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
      'prettier/prettier': PRETTIER_RULE,
    },
  },
];
