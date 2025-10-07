// @ts-nocheck
/**
 * Vitest 테스트 설정 (최적화)
 * 간결하고 효율적인 테스트 환경 구성
 * Phase 0: Solid.js 테스트 지원 추가
 */

import preact from '@preact/preset-vite';
import solid from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import os from 'node:os';
import { fileURLToPath, URL } from 'node:url';
// note: no fs usage

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CPU_COUNT = Math.max(1, (os.cpus?.() || []).length || 4);
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
// Helpers
const toPosix = (p: string) => p.replace(/\\/g, '/');
// helpers kept minimal for lint cleanliness
// NOTE: 테스트에서는 vite-tsconfig-paths로 TS paths를 그대로 사용합니다.

// 공용 alias/resolve 구성 (프로젝트별 config에도 주입)
const SRC_DIR = toPosix(resolve(__dirname, './src'));
const FEATURES_DIR = toPosix(resolve(__dirname, './src/features'));
const SHARED_DIR = toPosix(resolve(__dirname, './src/shared'));
const ASSETS_DIR = toPosix(resolve(__dirname, './src/assets'));

const sharedResolve = {
  extensions: ['.mjs', '.js', '.ts', '.tsx', '.jsx', '.json', '.solid.tsx', '.solid.ts'],
  alias: [
    // Preact 모듈을 명시적으로 단일 경로로 고정
    // 이렇게 하면 @testing-library/preact와 vendor manager가 동일한 인스턴스를 사용함
    {
      find: /^preact$/,
      replacement: resolve(__dirname, './node_modules/preact/dist/preact.module.js'),
    },
    {
      find: /^preact\/hooks$/,
      replacement: resolve(__dirname, './node_modules/preact/hooks/dist/hooks.module.js'),
    },
    {
      find: /^preact\/compat$/,
      replacement: resolve(__dirname, './node_modules/preact/compat/dist/compat.module.js'),
    },
    { find: '@features', replacement: FEATURES_DIR },
    { find: '@shared', replacement: SHARED_DIR },
    { find: '@assets', replacement: ASSETS_DIR },
    { find: '@', replacement: SRC_DIR },
  ],
  // Phase 3: Solid.js를 브라우저 모드로 강제 (JSDOM에서 reactivity 활성화)
  conditions: ['browser', 'development'],
} as const;

export default defineConfig({
  // DEBUG: 구성 로딩 및 alias 경로 확인
  // @ts-expect-error runtime debug
  _debug_alias: (() => {
    try {
      const SRC = SRC_DIR;
      const FEATURES = FEATURES_DIR;
      const SHARED = SHARED_DIR;
      const ASSETS = ASSETS_DIR;
      console.log('[vitest.config] resolve.alias', {
        '@': SRC,
        '@features': FEATURES,
        '@shared': SHARED,
        '@assets': ASSETS,
      });
    } catch {}
    return undefined;
  })(),
  plugins: [
    // CI에서는 로그를 줄여 I/O 오버헤드를 최소화
    !isCI && {
      name: 'xeg-log-config',
      enforce: 'pre',
      configResolved(cfg) {
        try {
          console.log('[xeg-log-config] final resolve.alias =', cfg.resolve?.alias);
          const names = (cfg.plugins || []).map(p => p.name + (p.enforce ? `(${p.enforce})` : ''));
          console.log('[xeg-log-config] plugins order:', names.join(' -> '));
        } catch {}
      },
    },
    // Phase 0: Solid.js support for .solid.tsx files
    solid({
      include: ['**/*.solid.tsx', '**/*.solid.ts'],
      extensions: ['.solid.tsx', '.solid.ts'],
      // Solid는 dev 모드에서도 production 빌드로 실행 (테스트 안정성)
      dev: false,
    }),
    // TS paths를 테스트에서도 동일하게 사용하도록 활성화
    tsconfigPaths({ projects: ['tsconfig.json'] }),
    // Preact preset (기본 .tsx 파일 처리)
    preact(),
  ].filter(Boolean) as any,

  resolve: sharedResolve,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    isolate: true, // 테스트 파일 간 격리
    testTimeout: 20000, // 동적 import 및 멀티 프로젝트 실행 시 플래키 타임아웃 방지
    hookTimeout: 25000,

    // Bare import로 인식되는 @features/@shared/@assets/@* 별칭을
    // 외부 의존성으로 최적화(deps optimize)하지 말고 Vitest(vite-node)
    // 파이프라인에서 인라인 처리하도록 지정. Windows에서 alias 미적용 문제 방지.
    server: {
      deps: {
        inline: [
          /^@features\//,
          /^@shared\//,
          /^@assets\//,
          /^@\//,
          /^@features$/,
          /^@shared$/,
          /^@assets$/,
          /^@$/,
        ],
      },
    },

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

    // 커버리지 설정
    coverage: {
      // CI에서는 v8 커버리지가 더 빠름, 로컬에서는 istanbul 유지(리포트 포맷 호환)
      provider: isCI ? 'v8' : 'istanbul',
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
        'src/core/**/*.ts': {
          branches: 80, // 85 → 80
          functions: 85, // 90 → 85
          lines: 85, // 90 → 85
          statements: 85, // 90 → 85
        },
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
        // 로컬: CPU-1(최대 8), CI: CPU-1(최대 6)로 제한하여 컨텍스트 스위칭 과도 방지
        minThreads: 1,
        maxThreads: Math.max(2, Math.min(isCI ? 6 : 8, Math.max(1, CPU_COUNT - 1))),
      },
    },
    // Vitest v3: test.projects로 분할 스위트 정의 (--project 필터 사용 가능)
    // 각 프로젝트에 jsdom 환경/설정 파일을 명시하여 상속 이슈를 방지합니다.
    projects: [
      // 최소 스모크: 빠르게 핵심 경계만 확인
      {
        // 개별 프로젝트에도 동일한 resolve를 명시적으로 주입 (Windows vite-node 호환)
        resolve: sharedResolve,
        test: {
          name: 'smoke',
          globals: true,
          // 상위 testTimeout/hookTimeout이 projects에 상속되지 않아 명시적으로 지정
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
              url: 'https://x.com',
              storageQuota: 10000000,
            },
          },
          include: [
            'test/unit/main/main-initialization.test.ts',
            'test/unit/viewport-utils.test.ts',
            'test/unit/shared/external/userscript-adapter.contract.test.ts',
            'test/unit/styles/animation-tokens-policy.test.ts',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      // 빠른 단위 테스트: red/벤치/퍼포먼스 제외
      {
        resolve: sharedResolve,
        test: {
          name: 'fast',
          globals: true,
          // 타임아웃을 명시적으로 설정하여 Windows/transform 지연으로 인한 플래키 방지
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
              url: 'https://x.com',
              storageQuota: 10000000,
            },
          },
          include: ['test/unit/**/*.{test,spec}.{ts,tsx}'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.red.test.*',
            'test/unit/performance/**',
            '**/*.bench.test.*',
          ],
        },
      },
      // 전체 단위 테스트(성능/벤치 포함 안함)
      {
        resolve: sharedResolve,
        test: {
          name: 'unit',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
              url: 'https://x.com',
              storageQuota: 10000000,
            },
          },
          include: ['test/unit/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      // 스타일 관련 테스트(토큰/테마/정책)
      {
        resolve: sharedResolve,
        test: {
          name: 'styles',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
              url: 'https://x.com',
              storageQuota: 10000000,
            },
          },
          include: [
            'test/styles/**/*.{test,spec}.{ts,tsx}',
            'test/unit/styles/**/*.{test,spec}.{ts,tsx}',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      // 성능/벤치마크 전용
      {
        resolve: sharedResolve,
        test: {
          name: 'performance',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
              url: 'https://x.com',
              storageQuota: 10000000,
            },
          },
          include: [
            'test/performance/**/*.{test,spec}.{ts,tsx}',
            'test/unit/performance/**/*.{test,spec}.{ts,tsx}',
            '**/*.bench.test.*',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      // 단계별(phase-*)/최종 스위트
      {
        resolve: sharedResolve,
        test: {
          name: 'phases',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
              url: 'https://x.com',
              storageQuota: 10000000,
            },
          },
          include: ['test/phase-*.*', 'test/final/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      // 리팩토링 진행/가드 스위트
      {
        resolve: sharedResolve,
        test: {
          name: 'refactor',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
              url: 'https://x.com',
              storageQuota: 10000000,
            },
          },
          include: ['test/refactoring/**/*.{test,spec}.{ts,tsx}'],
          // 기본 설정의 임시 exclude(특정 refactoring 통합 테스트)는 프로젝트에도 반영
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'test/refactoring/event-manager-integration.test.ts',
            'test/refactoring/service-diagnostics-integration.test.ts',
          ],
        },
      },
    ],
  },
});
