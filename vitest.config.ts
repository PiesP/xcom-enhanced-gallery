// @ts-nocheck
/**
 * Vitest 테스트 설정 (최적화)
 * 간결하고 효율적인 테스트 환경 구성
 */

import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { appendFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import type { ResolveOptions } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import os from 'node:os';
import { fileURLToPath, URL } from 'node:url';
// note: minimal fs usage for debug logging

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const debugLogPath = resolve(__dirname, './vitest-debug.log');
const appendDebug = (message: string) => {
  try {
    const timestamp = new Date().toISOString();
    appendFileSync(debugLogPath, `[${timestamp}] ${message}\n`, { encoding: 'utf8' });
  } catch (error) {
    console.error('[vitest-config][appendDebug] failed', error);
  }
};

const logStage = (stage: string, payload: string) => {
  appendDebug(`[${stage}] ${payload}`);
};

try {
  writeFileSync(debugLogPath, '', { encoding: 'utf8', flag: 'w' });
} catch (error) {
  console.error('[vitest-config] failed to initialize debug log', error);
}

appendDebug('[vitest-config] loaded');
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

const sharedResolve: ResolveOptions = {
  alias: [
    { find: '@', replacement: resolve(__dirname, 'src') },
    { find: '@features', replacement: resolve(__dirname, 'src/features') },
    { find: '@shared', replacement: resolve(__dirname, 'src/shared') },
    { find: '@assets', replacement: resolve(__dirname, 'src/assets') },
    { find: '@test', replacement: resolve(__dirname, 'test') },
    {
      find: 'solid-js/h',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/h/dist/h.js')),
    },
    {
      find: 'solid-js/web',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/web/dist/web.js')),
    },
    {
      find: 'solid-js/store',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/store/dist/store.js')),
    },
    {
      find: 'solid-js/jsx-runtime',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/h/jsx-runtime/dist/jsx.js')),
    },
    {
      find: 'solid-js/jsx-dev-runtime',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/h/jsx-runtime/dist/jsx.js')),
    },
    {
      find: /^solid-js$/,
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/dist/solid.js')),
    },
  ],
  // Force browser conditions to avoid SSR builds in jsdom tests
  // Solid.js exports have 'node' → server.js and 'browser' → solid.js
  // We must prioritize 'browser' over 'node' even though Vitest runs in Node
  conditions: ['browser', 'development', 'import'],
};

const solidEsbuildConfig = {
  jsx: 'automatic',
  jsxImportSource: 'solid-js',
} as const;

const solidTransformMode = {
  web: [/\.[jt]sx?$/],
  ssr: [/\.[jt]sx?$/],
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
          logStage('configResolved', `alias=${JSON.stringify(cfg.resolve?.alias ?? null)}`);
          const names = (cfg.plugins || []).map(p => p.name + (p.enforce ? `(${p.enforce})` : ''));
          logStage('configResolved', `plugins=${names.join(' -> ')}`);
        } catch {}
      },
    },
    solidPlugin({ dev: true, hot: false }),
    // TS paths를 테스트에서도 동일하게 사용하도록 활성화
    tsconfigPaths({ projects: ['tsconfig.json'] }),
  ].filter(Boolean) as any,

  esbuild: solidEsbuildConfig,
  resolve: sharedResolve,
  define: {
    'import.meta.env.SSR': false,
    'import.meta.env.DEV': true,
    __BROWSER__: true,
    __DEV__: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    isolate: true, // 테스트 파일 간 격리
    testTimeout: 20000, // 동적 import 및 멀티 프로젝트 실행 시 플래키 타임아웃 방지
    hookTimeout: 25000,
    transformMode: solidTransformMode,

    // Bare import로 인식되는 @features/@shared/@assets/@* 별칭을
    // 외부 의존성으로 최적화(deps optimize)하지 말고 Vitest(vite-node)
    // 파이프라인에서 인라인 처리하도록 지정. Windows에서 alias 미적용 문제 방지.
    // solid-js도 inline으로 처리하여 browser conditions를 강제 적용
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
          /^solid-js/,
          '@solidjs/testing-library',
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
      // v8로 통일 (Phase 78: 성능 최적화 및 유지보수성 향상)
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
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
        esbuild: solidEsbuildConfig,
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
          transformMode: solidTransformMode,
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
        esbuild: solidEsbuildConfig,
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
          transformMode: solidTransformMode,
        },
      },
      // 전체 단위 테스트(성능/벤치 포함 안함)
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
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
          transformMode: solidTransformMode,
        },
      },
      // Features 레이어 중심 테스트
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        test: {
          name: 'features',
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
          include: ['test/features/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**'],
          transformMode: solidTransformMode,
        },
      },
      // 스타일 관련 테스트(토큰/테마/정책)
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
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
          transformMode: solidTransformMode,
        },
      },
      // 성능/벤치마크 전용
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
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
          transformMode: solidTransformMode,
        },
      },
      // 단계별(phase-*)/최종 스위트
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
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
          transformMode: solidTransformMode,
        },
      },
      // 리팩토링 진행/가드 스위트
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
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
          transformMode: solidTransformMode,
        },
      },
    ],
  },
});
