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
import { env, argv as nodeArgv } from 'node:process';
import { cpus } from 'node:os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 환경변수로 테스트 모드 결정 (ci / optimized / fix / refactoring / turbo / default)
const testMode = env.VITEST_MODE || 'default';
const isOptimized = testMode === 'optimized';
const isFixMode = testMode === 'fix';
const isDefault = testMode === 'default';
const isCiMode = testMode === 'ci';
const isTurboMode = testMode === 'turbo';
// "npm run test -- ... test/refactoring" 또는 스크립트에 직접 디렉터리 인자가 포함될 때 자동 감지
const argv = ` ${nodeArgv.join(' ')} `; // 앞뒤 공백으로 경계 매칭 안정화
const lifecycle = env.npm_lifecycle_script || '';
const refPattern = /test[\\\/]refactoring/;
// npm이 전달한 원본 인자까지 확인 (npm_config_argv는 JSON 문자열)
let npmArgvMatches = false;
try {
  const npmArgvRaw = env.npm_config_argv;
  if (npmArgvRaw) {
    const parsed: { original?: string[]; cooked?: string[] } = JSON.parse(npmArgvRaw);
    const combined: string = [...(parsed.original ?? []), ...(parsed.cooked ?? [])].join(' ');
    npmArgvMatches = refPattern.test(combined);
  }
} catch {
  // 파싱 실패는 무시
}
// 환경 힌트(VITEST_WORKSPACE_DIR, VITEST_DIR 등)도 보조로 확인
const envHints = `${env.VITEST_WORKSPACE_DIR || ''} ${env.VITEST_DIR || ''}`;
const isRefactoring =
  testMode === 'refactoring' ||
  refPattern.test(argv) ||
  refPattern.test(lifecycle) ||
  refPattern.test(envHints) ||
  npmArgvMatches;

// 환경 감지
const isCI = !!(env.CI || env.GITHUB_ACTIONS);
const isGitHubActions = !!env.GITHUB_ACTIONS;
const cpuCount = cpus().length;

// 환경별 최적 스레드 수 계산 (threads 풀 사용 시)
function calculateOptimalThreads() {
  // 명시적 환경변수 우선 (CI에서 미세조정 가능)
  const envMin = env.VITEST_MIN_THREADS ? parseInt(env.VITEST_MIN_THREADS, 10) : undefined;
  const envMax = env.VITEST_MAX_THREADS ? parseInt(env.VITEST_MAX_THREADS, 10) : undefined;

  // Fix 모드는 항상 단일 스레드 (forks)
  if (isFixMode) return { min: 1, max: 1, strategy: 'forks', single: true };

  // Turbo 모드: 최대 성능 (CPU의 85% 사용, 최대 12스레드)
  if (isTurboMode) {
    const max = envMax || Math.min(Math.max(Math.floor(cpuCount * 0.85), 4), 12);
    const min = envMin || Math.max(Math.floor(max * 0.7), 2);
    return { min, max, strategy: 'threads', single: false };
  }

  // CI 모드 / GitHub Actions → 낮은 동시성 + threads 풀 (sandbox 격리 속도 확보)
  if (isGitHubActions || isCiMode) {
    const max = envMax || Math.min(Math.max(cpuCount - 1, 1), 2);
    const min = envMin || 1;
    return { min, max, strategy: 'threads', single: max === 1 };
  }

  // 로컬 기본: threads 풀로 적절한 병렬성 (CPU의 60% 사용, Windows 안정성 고려)
  const computed = Math.min(Math.max(Math.floor(cpuCount * 0.6), 2), 6);
  return {
    min: Math.max(computed - 1, 1),
    max: computed,
    strategy: 'threads',
    single: false,
  };
}

let {
  min: minThreads,
  max: maxThreads,
  strategy: poolStrategy,
  single: singleThread,
} = calculateOptimalThreads();

// Refactoring 모드: Windows 멀티파일 종료 시점 RPC 에러 회피를 위해 threads 단일 스레드로 강제
if (isRefactoring) {
  poolStrategy = 'threads' as const;
  minThreads = 1;
  maxThreads = 1;
  singleThread = true;
}

// 로컬 환경 최적화: Windows에서도 멀티스레드 사용 (turbo 모드 아닐 때만 안정성을 위해 제한)
if (process.platform === 'win32' && isDefault && !isTurboMode) {
  // Windows 기본 모드: 안정성을 위해 스레드 수 제한 (완전히 단일로 하지 않음)
  maxThreads = Math.min(maxThreads, 2);
  minThreads = 1;
}

// 환경별 설정 로그
if (env.NODE_ENV !== 'test' && typeof globalThis.console !== 'undefined') {
  const log = globalThis.console.log;
  log(`🧪 Vitest 환경 설정:`);
  log(`   모드: ${testMode} ${isCI ? '(CI)' : '(로컬)'}`);
  log(`   CPU 코어: ${cpuCount}개`);
  log(`   실행 풀: ${poolStrategy}`);
  log(`   동시성: ${singleThread ? '1 (단일)' : `${minThreads}-${maxThreads}`}`);
  if (isRefactoring) log('   감지: refactoring 모드 (coverage 임계값 완화)');
  if (isTurboMode) log('   🚀 TURBO 모드: 최대 성능 최적화');
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
    setupFiles: [isOptimized || isTurboMode ? './test/setup.optimized.ts' : './test/setup.ts'],

    // Refactoring 모드에서는 격리를 완화해 onAfterRunSuite 타이밍 이슈 회피 (Windows)
    isolate: isTurboMode ? false : isRefactoring ? false : true,

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

    // 모드별 파일 패턴 설정 (refactoring 전용 실행 시 해당 디렉터리만 한정)
    include: isRefactoring
      ? ['test/refactoring/*.{test,spec}.{ts,tsx}', 'test/refactoring/**/*.{test,spec}.{ts,tsx}']
      : isTurboMode
        ? [
            // Turbo 모드: 핵심 테스트만 빠르게
            'test/unit/main/**/*.test.ts',
            'test/unit/features/gallery-app-activation.test.ts',
            'test/features/gallery/**/*.test.ts',
            'test/unit/shared/external/**/*.test.ts',
            'test/architecture/**/*.test.ts',
            'test/core/**/*.test.ts',
            'test/shared/utils/**/*.test.ts',
          ]
        : isOptimized
          ? [
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
          : ['./test/**/*.{test,spec}.{ts,tsx}', './src/**/*.{test,spec}.{ts,tsx}'],

    // 모드별 제외 패턴
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      // Turbo 모드에서는 더 많은 파일 제외
      ...(isTurboMode
        ? [
            'test/refactoring/**',
            'test/integration/**',
            'test/behavioral/**',
            'test/infrastructure/**',
            'test/**/*.legacy.test.ts',
            'test/**/*.deprecated.test.ts',
            'test/**/*.slow.test.ts',
            'test/optimization/**',
            'test/shared/styles/**',
          ]
        : isOptimized
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

    // 환경별 타임아웃 설정 - Turbo 모드는 더 짧게
    testTimeout: isTurboMode
      ? 5000
      : isFixMode
        ? 15000
        : isCI || isCiMode
          ? 28000
          : isOptimized
            ? 10000
            : 6000,
    hookTimeout: isTurboMode
      ? 3000
      : isFixMode
        ? 10000
        : isCI || isCiMode
          ? 14000
          : isOptimized
            ? 10000
            : 6000,
    teardownTimeout: isTurboMode ? 8000 : isFixMode ? 15000 : isCI || isCiMode ? 18000 : 12000,

    // 모드별 리포터 설정
    reporters: isOptimized ? ['verbose', 'html'] : ['default'],
    ...(isOptimized && {
      outputFile: {
        html: './test-results/index.html',
      },
    }),

    // 환경별 커버리지 설정 - Turbo 모드는 커버리지 비활성화로 최대 속도
    coverage: {
      // Turbo 모드는 커버리지 비활성화, Windows default/refactoring에서는 v8 커버리지 종료 훅과 충돌 회피
      // 추가: VITEST_DISABLE_COVERAGE=1 로 강제 비활성화 가능
      enabled:
        !isTurboMode &&
        env.VITEST_DISABLE_COVERAGE !== '1' &&
        !(process.platform === 'win32' && (isDefault || isRefactoring)),
      provider: isOptimized || isCiMode || process.platform === 'win32' ? 'v8' : 'istanbul',
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
      thresholds: (() => {
        // refactoring 전용 실행에서는 부분 테스트로 인한 거짓 실패를 방지하기 위해 임계치를 완화
        if (isRefactoring) {
          return {
            global: { branches: 0, functions: 0, lines: 0, statements: 0 },
            'src/core/**/*.ts': { branches: 0, functions: 0, lines: 0, statements: 0 },
            'src/shared/**/*.ts': { branches: 0, functions: 0, lines: 0, statements: 0 },
          };
        }
        return {
          global: isOptimized
            ? { branches: 85, functions: 85, lines: 85, statements: 85 }
            : isCI || isCiMode
              ? { branches: 15, functions: 15, lines: 15, statements: 15 }
              : { branches: 15, functions: 15, lines: 15, statements: 15 },
          // 핵심 모듈은 점진적으로 커버리지 향상
          'src/core/**/*.ts': {
            branches: 5,
            functions: isCI || isCiMode ? 20 : 25,
            lines: isCI || isCiMode ? 20 : 25,
            statements: isCI || isCiMode ? 20 : 25,
          },
          'src/shared/**/*.ts': {
            branches: 5,
            functions: isCI || isCiMode ? 12 : 15,
            lines: isCI || isCiMode ? 12 : 15,
            statements: isCI || isCiMode ? 12 : 15,
          },
        };
      })(),
    },
    // 실행 풀 전략 (fix: forks 단일 / 나머지: threads 가변)
    pool: poolStrategy,
    poolOptions: {
      threads: {
        minThreads,
        maxThreads,
        isolate: true,
      },
    },

    // Turbo 모드 추가 최적화 설정
    ...(isTurboMode && {
      // 변경 감지 최적화 (외부 의존성 처리)
      server: {
        deps: {
          external: ['preact', '@preact/signals', 'fflate'],
        },
      },
    }), // 메모리 관리 (Fix 모드)
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
    printConsoleTrace: isDefault || isCiMode,

    // Windows: 기본/리팩토링 모드에서 커스텀 러너 사용해 종료 시점의 알려진 Vitest 내부 오류 무시
    ...(process.platform === 'win32' && (isDefault || isRefactoring)
      ? { runner: './test/custom-windows-suppress-runner.ts' }
      : {}),

    // Windows에서는 default/refactoring 모드 모두에서 알려진 종료 에러 억제
    dangerouslyIgnoreUnhandledErrors: process.platform === 'win32' && (isDefault || isRefactoring),

    // Refactoring 모드: 완전 순차 실행로 race 최소화
    ...(isRefactoring
      ? {
          sequence: {
            concurrent: false,
            shuffle: false,
          },
        }
      : {}),

    // Vitest 설정에는 onUnhandledRejection이 없으므로 test setup에서 처리
  },
});
