/**
 * Vitest Workspace Configuration
 * 목적: 방대한 테스트 스위트를 목적별 프로젝트로 분할해 선택 실행을 쉽게 함.
 * 각 프로젝트는 기본 설정(vitest.config.ts)을 상속하고 include/exclude만 세분화합니다.
 */

import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // 최소 스모크: 빠르게 핵심 경계만 확인
  {
    extends: './vitest.config.ts',
    test: {
      name: 'smoke',
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
    extends: './vitest.config.ts',
    test: {
      name: 'fast',
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
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      include: ['test/unit/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },

  // 스타일 관련 테스트(토큰/테마/정책)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'styles',
      include: [
        'test/styles/**/*.{test,spec}.{ts,tsx}',
        'test/unit/styles/**/*.{test,spec}.{ts,tsx}',
      ],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },

  // 성능/벤치마크 전용
  {
    extends: './vitest.config.ts',
    test: {
      name: 'performance',
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
    extends: './vitest.config.ts',
    test: {
      name: 'phases',
      include: ['test/phase-*.*', 'test/final/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },

  // 리팩토링 진행/가드 스위트
  {
    extends: './vitest.config.ts',
    test: {
      name: 'refactor',
      include: ['test/refactoring/**/*.{test,spec}.{ts,tsx}'],
      // 기본 설정의 임시 exclude(특정 refactoring 통합 테스트)는 그대로 유지합니다.
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'test/refactoring/event-manager-integration.test.ts',
        'test/refactoring/service-diagnostics-integration.test.ts',
      ],
    },
  },
]);
