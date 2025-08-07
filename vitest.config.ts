/**
 * @fileoverview 통합된 Vitest 설정 - 환경별 최적화
 * @description 기본, 최적화, 수정 설정을 하나로 통합하고 환경별 스레드 수 자동 최적화
 * @version 3.0.0 - Environment-Aware Thread Optimization
 *
 * 환경별 최적 스레드 설정:
 * - 로컬 환경: CPU 코어 수 기반 동적 계산 (현재: 24코어 → 8스레드)
 * - GitHub Actions: 4 vCPU 기준 최적화 (기본: 2스레드, 최적화: 3스레드)
 * - Fix 모드: 1스레드 (디버깅용)
 */

import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vitest/config';
import { env } from 'node:process';
// import { cpus } from 'node:os'; // 현재 단일 스레드 강제로 사용하지 않음

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 환경변수로 테스트 모드 결정
const testMode = env.VITEST_MODE || 'default';
const isOptimized = testMode === 'optimized';
const isFixMode = testMode === 'fix';
const isDefault = testMode === 'default';

// 환경별 최적 스레드 수 계산 (현재는 사용하지 않음 - 단일 스레드로 강제)
// function calculateOptimalThreads() {
//   const isCI = !!(env.CI || env.GITHUB_ACTIONS);
//   const cpuCount = cpus().length;
//   // ... 구현 생략
// }

// 현재는 단일 스레드로 강제하므로 사용하지 않음
// const { min: minThreads, max: maxThreads } = calculateOptimalThreads();

export default defineConfig({
  plugins: [preact()],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@app': resolve(__dirname, './src/app'),
      '@features': resolve(__dirname, './src/features'),
      '@shared': resolve(__dirname, './src/shared'),
      '@core': resolve(__dirname, './src/core'),
      '@infrastructure': resolve(__dirname, './src/infrastructure'),
      '@utils': resolve(__dirname, './src/utils'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },

  test: {
    // 글로벌 설정
    globals: true,
    environment: 'jsdom',

    // 모드별 setup 파일
    setupFiles: [isOptimized ? './test/setup.optimized.ts' : './test/setup.ts'],

    isolate: true,

    // JSDOM 환경 설정
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        url: 'http://localhost:3000',
        storageQuota: 10000000,
        pretendToBeVisual: true,
        // Navigation 에러 방지
        runScripts: 'dangerously',
      },
    },

    // 타입 정의 파일 포함
    typecheck: {
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },

    // 모드별 파일 패턴 설정
    include: isOptimized
      ? [
          // 최적화 모드: 통합 테스트 위주
          'test/consolidated/**/*.consolidated.test.ts',
          'test/unit/main/**/*.test.ts',
          'test/unit/features/gallery-app-activation.test.ts',
          'test/features/gallery/**/*.test.ts',
          'test/unit/shared/external/**/*.test.ts',
          'test/architecture/**/*.test.ts',
          'test/infrastructure/**/*.test.ts',
          'test/core/**/*.test.ts',
          'test/shared/utils/**/*.test.ts',
          'test/unit/shared/utils/**/*.test.ts',
          'test/behavioral/**/*.test.ts',
        ]
      : [
          // 기본 모드: 모든 테스트
          './test/**/*.{test,spec}.{ts,tsx}',
          './src/**/*.{test,spec}.{ts,tsx}',
        ],

    // 모드별 제외 패턴
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      ...(isOptimized
        ? [
            // 최적화 모드에서는 중복/레거시 테스트 제외
            'test/refactoring/tdd-style-consolidation-*.test.ts',
            'test/refactoring/tdd-*-consolidation.test.ts',
            'test/refactoring/structure-analysis.test.ts',
            'test/refactoring/naming-standardization.test.ts',
            'test/refactoring/refactoring-completion.test.ts',
            'test/unit/shared/services/MediaExtractionService.test.ts',
            'test/features/media/media.behavior.test.ts',
            'test/integration/extension.integration.test.ts',
            'test/integration/gallery-activation.test.ts',
            'test/integration/utils.integration.test.ts',
            'test/integration/master-test-suite.test.ts',
            'test/features/toolbar/toolbar-hover-consistency*.test.ts',
            'test/unit/shared/services/ServiceManager.test.ts',
            'test/optimization/memo-optimization.test.ts',
            'test/shared/styles/**/*.test.ts',
            'test/**/*.legacy.test.ts',
            'test/**/*.deprecated.test.ts',
          ]
        : []),
    ],

    // 모드별 타임아웃 설정 - teardownTimeout 증가
    testTimeout: isFixMode ? 15000 : isOptimized ? 10000 : 5000,
    hookTimeout: isFixMode ? 10000 : isOptimized ? 10000 : 5000,
    teardownTimeout: isFixMode ? 10000 : 8000,

    // 모드별 리포터 설정
    reporters: isOptimized ? ['verbose', 'html'] : ['default'],
    ...(isOptimized && {
      outputFile: {
        html: './test-results/index.html',
      },
    }),

    // 커버리지 설정
    coverage: {
      provider: isOptimized ? 'v8' : 'istanbul',
      reporter: ['text', 'json-summary', 'html', ...(isOptimized ? ['lcov'] : [])],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.{test,spec}.{ts,tsx}',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        global: isOptimized
          ? {
              branches: 85,
              functions: 85,
              lines: 85,
              statements: 85,
            }
          : {
              branches: 15,
              functions: 15,
              lines: 15,
              statements: 15,
            },
        // 핵심 모듈은 점진적으로 커버리지 향상
        'src/core/**/*.ts': {
          branches: 5,
          functions: 25,
          lines: 25,
          statements: 25,
        },
        'src/shared/**/*.ts': {
          branches: 5,
          functions: 15,
          lines: 15,
          statements: 15,
        },
      },
    },

    // 성능 최적화 - 워커 스레드 문제 해결을 위한 단순화
    pool: isFixMode ? 'forks' : 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // 항상 단일 스레드로 강제
        minThreads: 1,
        maxThreads: 1,
        isolate: false, // 격리 비활성화로 성능 향상
        // 스레드 간 메모리 공유 최소화
        useAtomics: false,
      },
      forks: {
        singleFork: true,
        minForks: 1,
        maxForks: 1,
        isolate: false,
      },
    },

    // 메모리 관리 (Fix 모드)
    ...(isFixMode && {
      forceRerunTriggers: ['**/test/**/*.{test,spec}.{js,ts}'],
      sequence: {
        shuffle: false, // 메모리 누수 테스트 시 순서 고정
      },
    }),

    // 감시 모드 설정 (최적화 모드)
    ...(isOptimized && {
      watch: true,
      watchExclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/test-results/**'],
    }),

    // 로깅 및 디버깅
    logHeapUsage: isFixMode,
    printConsoleTrace: isDefault,

    // Vitest 설정에는 onUnhandledRejection이 없으므로 test setup에서 처리
  },
});
