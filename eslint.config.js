/**
 * ESLint Configuration for X.com Enhanced Gallery
 * Balanced linting rules based on Clean Architecture principles
 *
 * Design Principles:
 * - Ensure type safety without excessive strictness
 * - Compliance with Clean Architecture dependency rules
 * - Balance between developer productivity and code quality
 * - Apply practical and realistic rules
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import { loadLocalConfig } from './config/utils/load-local-config.js';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

const baseConfig = [
  eslint.configs.recommended,

  // Global ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.min.js',
      '**/*.d.ts',
      'release/**',
      'test-results/**',
      'codeql-reports/**',
      'codeql-results/**',
      'docs/temp/**',
      'docs/archive/**',
      'scripts/temp/**',
      '*.config.js.backup',
      '*.backup.*',
      // Type definitions
      'types/jsdom.d.ts',
      'src/types/solid-js-client.d.ts',
    ],
  },

  // === Main TypeScript rules ===
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir,
      },
      globals: {
        // Vite build-time globals
        __DEV__: 'readonly',
        __IS_DEV__: 'readonly',
        __VERSION__: 'readonly',
        // Phase 326.5: Feature Flags
        __FEATURE_MEDIA_EXTRACTION__: 'readonly',

        // Browser environment
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        Image: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        getComputedStyle: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        indexedDB: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        crypto: 'readonly',

        // Node.js environment (build time)
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',

        // Userscript API
        GM_getValue: 'readonly',
        GM_setValue: 'readonly',
        GM_download: 'readonly',
        GM_addStyle: 'readonly',
        GM_deleteValue: 'readonly',
        GM_registerMenuCommand: 'readonly',
        GM_notification: 'readonly',
        GM_openInTab: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsx-a11y': jsxA11y,
      prettier,
    },
    rules: {
      // === Code Quality - Basics ===
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'no-useless-escape': 'warn',

      // === TypeScript rules - Balanced level ===
      '@typescript-eslint/no-explicit-any': 'warn', // Warning instead of complete prohibition
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-unused-vars': 'off', // Use TypeScript version
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',

      // === JSX-related (Preact) ===
      // Preact 10+: Automatic JSX transformation, react/* rules not needed

      // === Accessibility - Basics only ===
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/click-events-have-key-events': 'off', // Too strict

      // === Code style ===
      'prettier/prettier': 'error',

      // === Clean Architecture dependency rules ===
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['../../../*', '../../../../*'], message: 'Use absolute path aliases' },
            {
              group: ['preact', 'preact/hooks', '@preact/signals', 'fflate'],
              message: 'Access via vendors getter',
            },
          ],
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
        pragma: 'h',
      },
    },
  },

  // === Layer-specific dependency rules - Simplified ===

  // Features layer
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn', // Relaxed from error to warn
        {
          patterns: [
            {
              group: ['../app/**', '../../app/**'],
              message: 'Features should not depend on App layer',
            },
          ],
        },
      ],
    },
  },

  // Shared layer
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../app/**', '../../app/**', '../features/**', '../../features/**'],
              message: 'Shared should not depend on higher layers',
            },
          ],
        },
      ],
    },
  },

  // Core layer
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../app/**', '../features/**', '../shared/**'],
              message: 'Core should only depend on infrastructure',
            },
          ],
        },
      ],
    },
  },

  // === Special files - Relaxed rules ===

  // Configuration files
  {
    files: [
      '*.config.{ts,js,cjs,mjs}',
      'vite.config.*',
      'eslint.config.*',
      'vitest.config.*',
      'scripts/**/*.{ts,js,cjs,mjs}',
    ],
    languageOptions: {
      parser: tsParser,
      globals: {
        // Node.js environment globals (for config/script files)
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': 'off',
      'no-empty': 'off',
    },
  },

  // Test files
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        // Vite build-time globals
        __DEV__: 'readonly',
        __IS_DEV__: 'readonly',
        __VERSION__: 'readonly',
        // Phase 326.5: Feature Flags
        __FEATURE_MEDIA_EXTRACTION__: 'readonly',

        // Vitest globals
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',

        // jsdom/browser globals (prevent no-undef during static analysis)
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        Image: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        FocusEvent: 'readonly',
        WheelEvent: 'readonly',
        EventListener: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',

        // Node globals (for test utils/environment)
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      // Disable unused parameter/variable warnings in test code to reduce noise
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-restricted-imports': 'off',
      // Prohibition: import.meta.glob usage in tests (prevent OS/bundler dependency issues)
      // AST selector explanation:
      // - Block both import.meta.glob(...) call and simple reference patterns
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.type='MetaProperty'][callee.object.meta.name='import'][callee.object.property.name='meta'][callee.property.name='glob']",
          message:
            'import.meta.glob forbidden in tests: Use Node fs/path recursive scan utils instead',
        },
        {
          selector:
            "MemberExpression[object.type='MetaProperty'][object.meta.name='import'][object.property.name='meta'][property.name='glob']",
          message:
            'import.meta.glob reference forbidden in tests: Use Node fs/path recursive scan utils instead',
        },
      ],
    },
  },

  // Vendor wrapper layer: external library direct imports allowed (central control point)
  {
    files: ['src/shared/external/vendors/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // Type definition files
  {
    files: ['**/*.d.ts', 'types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Debug/performance files (console usage allowed)
  {
    files: [
      '**/debug/**/*.{ts,tsx}',
      '**/performance/**/*.{ts,tsx}',
      '**/diagnostics/**/*.{ts,tsx}',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

const localConfig = (await loadLocalConfig(import.meta.url, 'eslint.local')) ?? [];

const localConfigArray = Array.isArray(localConfig)
  ? localConfig
  : localConfig
    ? [localConfig]
    : [];

export default [...baseConfig, ...localConfigArray];
