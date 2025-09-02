/**
 * ESLint Configuration for X.com Enhanced Gallery
 * Clean Architecture 원칙에 따른 균형잡힌 린팅 규칙
 *
 * 설계 원칙:
 * - 타입 안전성은 보장하되 과도하게 엄격하지 않음
 * - Clean Architecture 의존성 규칙 준수
 * - 개발 생산성과 코드 품질의 균형
 * - 실용적이고 현실적인 규칙 적용
 */

import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';

export default [
  eslint.configs.recommended,

  // 전역 무시 패턴
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
      '*.config.js.backup',
      '*.backup.*',
    ],
  },

  // === 메인 TypeScript 규칙 ===
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: {
        // 브라우저 환경
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

        // Node.js 환경 (빌드 시)
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
      react,
      'jsx-a11y': jsxA11y,
      prettier,
    },
    rules: {
      // === 코드 품질 - 기본적인 것들 ===
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'no-useless-escape': 'warn',

      // === TypeScript 규칙 - 균형잡힌 수준 ===
      '@typescript-eslint/no-explicit-any': 'warn', // 완전 금지보다는 경고
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-unused-vars': 'off', // TypeScript 버전 사용
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',

      // === React/Preact 규칙 ===
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off', // TypeScript 사용
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-key': 'error',

      // === 접근성 - 기본적인 것만 ===
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/click-events-have-key-events': 'off', // 너무 엄격함

      // === 코드 스타일 ===
      'prettier/prettier': 'error',

      // === Clean Architecture 의존성 규칙 ===
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../../*', '../../../../*'],
              message: '3단계 이상의 상대 경로는 절대 경로를 사용하세요',
            },
            {
              group: ['preact', 'preact/hooks', '@preact/signals', 'fflate', 'motion'],
              message: '외부 라이브러리는 vendors getter를 통해 접근하세요',
            },
          ],
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
        pragma: 'h',
        pragmaFrag: 'Fragment',
      },
      'import/resolver': {
        alias: {
          '@': './src',
          '@features': './src/features',
          '@shared': './src/shared',
          '@assets': './src/assets',
        },
      },
    },
  },

  // === 레이어별 의존성 규칙 - 간소화 ===

  // Features 레이어
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn', // error에서 warn으로 완화
        {
          patterns: [
            {
              group: ['../app/**', '../../app/**'],
              message: 'Features는 App 레이어에 의존하지 말아주세요',
            },
          ],
        },
      ],
    },
  },

  // Shared 레이어
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../app/**', '../../app/**', '../features/**', '../../features/**'],
              message: 'Shared는 상위 레이어에 의존하지 말아주세요',
            },
          ],
        },
      ],
    },
  },

  // Core 레이어
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../app/**', '../features/**', '../shared/**'],
              message: 'Core는 infrastructure에만 의존해주세요',
            },
          ],
        },
      ],
    },
  },

  // === 특수 파일들 - 완화된 규칙 ===

  // 설정 파일들
  {
    files: [
      '*.config.{ts,js}',
      'vite.config.*',
      'eslint.config.*',
      'vitest.config.*',
      'scripts/**/*.{ts,js}',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': 'off',
    },
  },

  // 테스트 파일들
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: { project: './tsconfig.json', ecmaFeatures: { jsx: true } },
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-restricted-imports': 'off',
    },
  },

  // 타입 정의 파일들
  {
    files: ['**/*.d.ts', 'types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // 디버그/성능 파일들 (console 사용 허용)
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
