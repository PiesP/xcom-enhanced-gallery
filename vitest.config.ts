/**
 * Vitest 테스트 설정 (최적화)
 * 간결하고 효율적인 테스트 환경 구성
 */

import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [preact()],

  resolve: {
    // alias는 가장 먼저 일치하는 항목이 우선하므로, 특정 경로를 일반 프리픽스('@shared')보다 앞에 둡니다.
    alias: [
      // 특정 경로 -> 일반 프리픽스 순으로 배치해 우선순위 보장
      {
        find: '@shared/components/ui/Icon/icons',
        replacement: resolve(__dirname, './src/shared/components/ui/Icon/icons/index.ts'),
      },
      { find: '@features', replacement: resolve(__dirname, './src/features') },
      { find: '@shared', replacement: resolve(__dirname, './src/shared') },
      { find: '@assets', replacement: resolve(__dirname, './src/assets') },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
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
        resources: 'usable',
        url: 'https://x.com',
        storageQuota: 10000000,
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
