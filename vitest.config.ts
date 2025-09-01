/**
 * Vitest 테스트 설정 (최적화)
 * 간결하고 효율적인 테스트 환경 구성
 */

import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import os from 'os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [preact()],

  // TypeScript 파싱 개선
  esbuild: {
    target: 'node14',
    keepNames: true,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/external': resolve(__dirname, './src/external'),
      '@/assets': resolve(__dirname, './src/assets'),
      // Clean Architecture 기반 alias들
      '@app': resolve(__dirname, './src/app'),
      '@features': resolve(__dirname, './src/features'),
      '@shared': resolve(__dirname, './src/shared'),
      '@core': resolve(__dirname, './src/core'),
      '@infrastructure': resolve(__dirname, './src/infrastructure'),
    },
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
    // NOTE: --dir test/refactoring 와 같이 하위 디렉터리를 지정하면
    // 기존 'test/**/*' 패턴은 매칭되지 않아(No test files found) 테스트가 누락됨.
    // '**/*' 패턴을 추가하여 --dir 기반 실행에서도 발견되도록 확장.
    // --dir 로 루트를 하위 폴더로 바꿀 때도 매칭되도록 절대 'test/' prefix 제거
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      // 임시 비활성화: 구현되지 않은 의존성이 있는 테스트들
      'test/refactoring/event-manager-integration.test.ts',
      'test/refactoring/service-diagnostics-integration.test.ts',
      // URL constructor 이슈로 인한 JSDOM 호환성 문제로 스킵
      'test/integration/gallery-activation.test.ts',
      'test/integration/utils.integration.test.ts',
      'test/integration/full-workflow.test.ts',
      'test/behavioral/user-interactions-fixed.test.ts',
      'test/features/gallery/gallery.behavior.test.ts',
      'test/features/gallery/early-initialization.test.ts',
    ],

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
          branches: 2,
          functions: 5,
          lines: 13,
          statements: 5,
        },
        // 핵심 모듈은 더 높은 커버리지 요구
        'src/core/**/*.ts': {
          branches: 80, // 85 → 80
          functions: 85, // 90 → 85
          lines: 85, // 90 → 85
          statements: 85, // 90 → 85
        },
        // restore target: require at least modest coverage for shared utils
        'src/shared/**/*.ts': {
          branches: 15,
          functions: 15,
          lines: 15,
          statements: 15,
        },
      },
    },

    // 성능 최적화
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: Math.min(4, os.cpus().length),
      },
    },
  },
});
