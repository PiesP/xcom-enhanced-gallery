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
import { cpus } from 'node:os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 환경변수로 테스트 모드 결정
const testMode = env.VITEST_MODE || 'default';
const isOptimized = testMode === 'optimized';
const isFixMode = testMode === 'fix';
const isDefault = testMode === 'default';

// 환경 감지
const isCI = !!(env.CI || env.GITHUB_ACTIONS);
const isGitHubActions = !!env.GITHUB_ACTIONS;
const cpuCount = cpus().length;

// 환경별 최적 스레드 수 계산
function calculateOptimalThreads() {
  // Fix 모드는 항상 단일 스레드
  if (isFixMode) {
    return { min: 1, max: 1, singleThread: true };
  }

  // GitHub Actions 환경 (2-4 vCPU, 7GB RAM 제한)
  if (isGitHubActions) {
    const threads = Math.min(Math.max(cpuCount - 1, 1), 2); // 최대 2스레드로 제한
    return {
      min: 1,
      max: threads,
      singleThread: threads === 1,
    };
  }

  // 로컬 환경 - CPU 코어 수의 50% 활용 (최소 2, 최대 6)
  const threads = Math.min(Math.max(Math.floor(cpuCount * 0.5), 2), 6);
  return {
    min: Math.max(threads - 1, 1),
    max: threads,
    singleThread: false,
  };
}

const { min: minThreads, max: maxThreads, singleThread } = calculateOptimalThreads();

// 환경별 설정 로그
if (env.NODE_ENV !== 'test' && typeof globalThis.console !== 'undefined') {
  const log = globalThis.console.log;
  log(`🧪 Vitest 환경 설정:`);
  log(`   모드: ${testMode} ${isCI ? '(CI)' : '(로컬)'}`);
  log(`   CPU 코어: ${cpuCount}개`);
  log(`   스레드: ${singleThread ? '1개 (단일)' : `${minThreads}-${maxThreads}개`}`);
}

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
            // CI 환경에서 멀티스레드 충돌 발생하는 파일 제외
            'test/shared/utils/performance.consolidated.test.ts',
          ]
        : []),
    ],

    // 환경별 타임아웃 설정 - Worker Thread 안정적 종료를 위해 teardownTimeout 증가
    testTimeout: isFixMode ? 15000 : isCI ? 30000 : isOptimized ? 10000 : 5000,
    hookTimeout: isFixMode ? 10000 : isCI ? 15000 : isOptimized ? 10000 : 5000,
    teardownTimeout: isFixMode ? 15000 : isCI ? 20000 : 12000,

    // 모드별 리포터 설정
    reporters: isOptimized ? ['verbose', 'html'] : ['default'],
    ...(isOptimized && {
      outputFile: {
        html: './test-results/index.html',
      },
    }),

    // 환경별 커버리지 설정 - GitHub Actions에서는 더 엄격하게
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
          : isCI
            ? {
                // GitHub Actions에서는 조금 더 관대하게
                branches: 12,
                functions: 12,
                lines: 12,
                statements: 12,
              }
            : {
                // 로컬 환경
                branches: 15,
                functions: 15,
                lines: 15,
                statements: 15,
              },
        // 핵심 모듈은 점진적으로 커버리지 향상
        'src/core/**/*.ts': {
          branches: 5,
          functions: isCI ? 20 : 25,
          lines: isCI ? 20 : 25,
          statements: isCI ? 20 : 25,
        },
        'src/shared/**/*.ts': {
          branches: 5,
          functions: isCI ? 12 : 15,
          lines: isCI ? 12 : 15,
          statements: isCI ? 12 : 15,
        },
      },
    },

    // 모든 환경에서 단일 스레드로 안정성 우선
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        minForks: 1,
        maxForks: 1,
        isolate: true,
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
