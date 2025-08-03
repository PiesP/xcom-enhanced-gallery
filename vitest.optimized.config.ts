/**
 * @fileoverview 최적화된 Vitest 설정
 * @description 통합된 테스트 구조에 맞는 테스트 실행 최적화
 * @version 1.0.0 - Optimized Configuration
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // 통합된 테스트 파일들 포함
    include: [
      // 통합 테스트들 (우선순위)
      'test/consolidated/**/*.consolidated.test.ts',

      // 핵심 기능 테스트들
      'test/unit/main/**/*.test.ts',
      'test/unit/features/gallery-app-activation.test.ts',

      // 특화 기능 테스트들
      'test/features/gallery/**/*.test.ts',
      'test/unit/shared/external/**/*.test.ts',

      // 아키텍처 및 인프라 테스트들
      'test/architecture/**/*.test.ts',
      'test/infrastructure/**/*.test.ts',
      'test/core/**/*.test.ts',

      // 유틸리티 테스트들
      'test/shared/utils/**/*.test.ts',
      'test/unit/shared/utils/**/*.test.ts',

      // 행위 테스트들
      'test/behavioral/**/*.test.ts',
    ],

    // 제거된 중복/레거시 테스트들 제외
    exclude: [
      // TDD 리팩토링 중복 파일들
      'test/refactoring/tdd-style-consolidation-*.test.ts',
      'test/refactoring/tdd-*-consolidation.test.ts',
      'test/refactoring/structure-analysis.test.ts',
      'test/refactoring/naming-standardization.test.ts',
      'test/refactoring/refactoring-completion.test.ts',

      // 미디어 서비스 중복 테스트들
      'test/unit/shared/services/MediaExtractionService.test.ts',
      'test/unit/shared/services/OptimizedMediaExtractor.test.ts',
      'test/features/media/media.behavior.test.ts',

      // 통합 테스트 중복들
      'test/integration/extension.integration.test.ts',
      'test/integration/gallery-activation.test.ts',
      'test/integration/utils.integration.test.ts',
      'test/integration/master-test-suite.test.ts',

      // 툴바 테스트 중복들
      'test/features/toolbar/toolbar-hover-consistency*.test.ts',

      // 서비스 매니저 중복들
      'test/unit/shared/services/ServiceManager.test.ts',

      // 구식 최적화 테스트들
      'test/optimization/memo-optimization.test.ts',

      // 스타일 관련 중복들
      'test/shared/styles/**/*.test.ts',

      // 성능 관련 중복들
      'test/unit/shared/utils/performance-timer.test.ts',
      'test/shared/utils/performance/throttle.test.ts',

      // 레거시 파일들
      'test/**/*.legacy.test.ts',
      'test/**/*.deprecated.test.ts',
    ],

    // 병렬 실행 최적화
    threads: true,
    maxThreads: 4,
    minThreads: 2,

    // 테스트 환경 설정
    environment: 'jsdom',
    setupFiles: ['test/setup.optimized.ts'],

    // 글로벌 설정
    globals: true,

    // 리포터 설정
    reporter: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },

    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/constants.ts'],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },

    // 테스트 타임아웃 설정
    testTimeout: 10000,
    hookTimeout: 10000,

    // 감시 모드 설정
    watch: true,
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/test-results/**'],

    // 테스트 순서 최적화
    sequence: {
      hooks: 'parallel',
      setupFiles: 'parallel',
    },

    // 메모리 및 성능 최적화
    isolate: true,
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        useAtomics: true,
      },
    },

    // 에러 처리
    bail: 1, // 첫 번째 실패시 중단 (CI에서는 false로 설정)
    retry: 2, // 불안정한 테스트 재시도

    // 로깅 레벨
    logLevel: 'info',

    // 테스트 파일 매칭 최적화
    typecheck: {
      enabled: true,
      include: ['test/**/*.test.ts'],
    },
  },

  // 경로 별칭 설정
  resolve: {
    alias: {
      '@': resolve('./src'),
      '@shared': resolve('./src/shared'),
      '@features': resolve('./src/features'),
      '@core': resolve('./src/core'),
      '@test': resolve('./test'),
      '@mocks': resolve('./test/__mocks__'),
    },
  },

  // 빌드 최적화 (테스트용)
  esbuild: {
    target: 'es2020',
    keepNames: true,
    minify: false,
  },
});
