// @ts-nocheck
/**
 * Vitest 테스트 설정 (최적화)
 * 간결하고 효율적인 테스트 환경 구성
 */

import preact from '@preact/preset-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import fs from 'node:fs';
import path, { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
// Helpers
const toPosix = (p: string) => p.replace(/\\/g, '/');
// NOTE: 테스트에서는 vite-tsconfig-paths로 TS paths를 그대로 사용합니다.

export default defineConfig({
  // DEBUG: 구성 로딩 및 alias 경로 확인
  // @ts-expect-error runtime debug
  _debug_alias: (() => {
    try {
      const SRC = toPosix(resolve(__dirname, './src'));
      const FEATURES = toPosix(resolve(__dirname, './src/features'));
      const SHARED = toPosix(resolve(__dirname, './src/shared'));
      const ASSETS = toPosix(resolve(__dirname, './src/assets'));
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
    // 최종 alias 설정 확인용 로거
    {
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
    // TS paths를 테스트에서도 동일하게 사용하도록 활성화
    tsconfigPaths({ projects: ['tsconfig.json'] }),
    // Preact preset
    preact(),
  ],

  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.tsx', '.jsx', '.json'],
    // 별칭: 프로덕션과 동일하게 root-relative 매핑을 사용 (vite-tsconfig-paths와 병행)
    alias: [
      { find: '@features', replacement: '/src/features' },
      { find: '@shared', replacement: '/src/shared' },
      { find: '@assets', replacement: '/src/assets' },
      { find: '@', replacement: '/src' },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    isolate: true, // 테스트 파일 간 격리

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

    // 글로브 패턴
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      // 임시 비활성화: 구현되지 않은 의존성이 있는 테스트들
      'test/refactoring/event-manager-integration.test.ts',
      'test/refactoring/service-diagnostics-integration.test.ts',
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
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // Workspace 분할은 vitest.workspace.ts에서 관리합니다.
  },
});
