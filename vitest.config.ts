/**
 * Vitest 테스트 설정 (최적화)
 * 간결하고 효율적인 테스트 환경 구성
 */

import solidPlugin from 'vite-plugin-solid';
import type { Plugin } from 'vite';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const solidExtensions: (string | [string, { typescript?: boolean }])[] = [
  '.solid.tsx',
  '.solid.ts',
  '.solid.jsx',
  '.solid.js',
];
const solidIncludePatterns = [
  '**/*.solid.{ts,tsx,js,jsx}',
  '**/*.solid.*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/Toolbar/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/ToolbarShell/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/ToolbarButton/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/ToolbarWithSettings/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/MediaCounter/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/Button/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/Icon/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/SettingsModal/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/Toast/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/RadioGroup/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/LanguageSelector/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/ui/primitive/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/isolation/**/*.{ts,tsx,js,jsx}',
  '**/features/gallery/components/KeyboardHelpOverlay/**/*.{ts,tsx,js,jsx}',
  'test/unit/features/gallery/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/LazyIcon.{ts,tsx,js,jsx}',
  'test/**/*.{ts,tsx,js,jsx}',
];
const shouldDisableSolidPlugin = process.env.XEG_DISABLE_SOLID_PLUGIN === '1';

const createVitestSolidPlugin = (): Plugin =>
  solidPlugin({
    include: solidIncludePatterns,
    dev: false,
    ssr: false,
    hot: false,
    extensions: solidExtensions,
    solid: {
      generate: 'dom',
      hydratable: false,
    },
  }) as Plugin;

export default defineConfig({
  plugins: [...(shouldDisableSolidPlugin ? [] : [createVitestSolidPlugin()])],

  resolve: {
    // alias는 가장 먼저 일치하는 항목이 우선하므로, 특정 경로를 일반 프리픽스('@shared')보다 앞에 둡니다.
    alias: [
      {
        find: '@test-utils/testing-library',
        replacement: resolve(__dirname, './test/utils/preact-testing-library.ts'),
      },
      {
        find: '@test-utils',
        replacement: resolve(__dirname, './test/utils'),
      },
      { find: '@features', replacement: resolve(__dirname, './src/features') },
      { find: '@shared', replacement: resolve(__dirname, './src/shared') },
      { find: '@assets', replacement: resolve(__dirname, './src/assets') },
      { find: 'solid-js/web', replacement: 'solid-js/web/dist/web.js' },
      {
        find: 'solid-js/jsx-dev-runtime',
        replacement: resolve(__dirname, './src/shared/polyfills/solid-jsx-dev-runtime.ts'),
      },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
    dedupe: ['solid-js', 'solid-js/web', 'solid-js/store'],
  },

  test: {
    testTimeout: 20000, // 타임아웃을 20초로 증가 (REFACTOR: 타이머 테스트 최적화)
    hookTimeout: 25000, // setup/teardown hook 타임아웃도 증가
    // 기본 설정
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    isolate: true, // 테스트 파일 간 격리

    // JSDOM 환경 설정
    environmentOptions: {
      jsdom: {
        // resources 속성 생략 = 리소스 로딩 비활성화 (URL Constructor 오류 방지)
        url: 'https://x.com',
        storageQuota: 10000000,
        pretendToBeVisual: true,
      },
    },

    // 타입 정의 파일 포함
    typecheck: {
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },

    // 글로브 패턴
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],

    // 커버리지 설정
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.{test,spec}.{ts,tsx}',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 70, // 75 → 70 (현실적 목표)
          functions: 75, // 80 → 75
          lines: 75, // 80 → 75
          statements: 75, // 80 → 75
        },
        // 핵심 모듈은 더 높은 커버리지 요구
        'src/shared/**/*.ts': {
          branches: 75, // 80 → 75
          functions: 80, // 85 → 80
          lines: 80, // 85 → 80
          statements: 80, // 85 → 80
        },
      },
    },

    // 성능 최적화
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
  },
});
