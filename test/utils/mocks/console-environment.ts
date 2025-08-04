/**
 * Ultimate Console Environment for TDD Testing
 * 🎯 모든 console API를 완전히 모킹하여 테스트 안정성 보장
 */

import { vi } from 'vitest';

/**
 * Ultimate Console API Mock
 * Node.js 환경에서 브라우저의 모든 console 메서드를 완전 구현
 */
export interface UltimateConsole {
  debug: (..._args: any[]) => void;
  log: (..._args: any[]) => void;
  info: (..._args: any[]) => void;
  warn: (..._args: any[]) => void;
  error: (..._args: any[]) => void;
  trace: (..._args: any[]) => void;
  group: (..._args: any[]) => void;
  groupCollapsed: (..._args: any[]) => void;
  groupEnd: () => void;
  clear: () => void;
  count: (_label?: string) => void;
  countReset: (_label?: string) => void;
  time: (_label?: string) => void;
  timeEnd: (_label?: string) => void;
  timeLog: (_label?: string, ..._args: any[]) => void;
  assert: (_condition: boolean, ..._args: any[]) => void;
  dir: (_obj: any) => void;
  dirxml: (..._args: any[]) => void;
  table: (_data: any) => void;
  profile: (_label?: string) => void;
  profileEnd: (_label?: string) => void;
}

/**
 * Ultimate Console 환경 설정
 * 🚀 모든 console 메서드를 완전 모킹하여 테스트 안정성 보장
 */
export function setupUltimateConsoleEnvironment(): void {
  // Ultimate Console Mock 객체 생성
  const ultimateConsole: UltimateConsole = {
    debug: vi.fn((...args: any[]) => {
      // 개발 환경에서만 실제 출력 (테스트 중에는 조용함)
      if (process.env.NODE_ENV === 'development') {
        // console 참조 에러 방지를 위해 global.console 사용
        global.console?.log?.('[DEBUG]', ...args);
      }
    }),
    log: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[LOG]', ...args);
      }
    }),
    info: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[INFO]', ...args);
      }
    }),
    warn: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[WARN]', ...args);
      }
    }),
    error: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[ERROR]', ...args);
      }
    }),
    trace: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[TRACE]', ...args);
      }
    }),
    group: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[GROUP]', ...args);
      }
    }),
    groupCollapsed: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[GROUP_COLLAPSED]', ...args);
      }
    }),
    groupEnd: vi.fn(() => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[GROUP_END]');
      }
    }),
    clear: vi.fn(() => {
      // console.clear 시뮬레이션 (테스트에서는 무작용)
    }),
    count: vi.fn((label?: string) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.(`[COUNT] ${label || 'default'}: 1`);
      }
    }),
    countReset: vi.fn((label?: string) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.(`[COUNT_RESET] ${label || 'default'}`);
      }
    }),
    time: vi.fn((label?: string) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.(`[TIME] ${label || 'default'}: timer started`);
      }
    }),
    timeEnd: vi.fn((label?: string) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.(`[TIME_END] ${label || 'default'}: 0ms`);
      }
    }),
    timeLog: vi.fn((label?: string, ...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.(`[TIME_LOG] ${label || 'default'}:`, ...args);
      }
    }),
    assert: vi.fn((condition: boolean, ...args: any[]) => {
      if (!condition && process.env.NODE_ENV === 'development') {
        global.console?.log?.('[ASSERT]', ...args);
      }
    }),
    dir: vi.fn((obj: any) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[DIR]', obj);
      }
    }),
    dirxml: vi.fn((...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[DIRXML]', ...args);
      }
    }),
    table: vi.fn((data: any) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.('[TABLE]', data);
      }
    }),
    profile: vi.fn((label?: string) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.(`[PROFILE] ${label || 'default'}: started`);
      }
    }),
    profileEnd: vi.fn((label?: string) => {
      if (process.env.NODE_ENV === 'development') {
        global.console?.log?.(`[PROFILE_END] ${label || 'default'}: finished`);
      }
    }),
  };

  // Global console 객체에 Ultimate Console 적용
  Object.assign(global.console, ultimateConsole);

  console.log('[Ultimate Console Environment] 🎯 모든 console API 모킹 완료!');
}

/**
 * Ultimate Console 환경 정리
 */
export function cleanupUltimateConsoleEnvironment(): void {
  // console mocks를 원래 상태로 복원
  vi.restoreAllMocks();

  console.log('[Ultimate Console Environment] 환경 정리 완료 ✅');
}

/**
 * Console 호출 통계 수집 (디버깅용)
 */
export function getConsoleCallStats(): Record<string, number> {
  const stats: Record<string, number> = {};

  Object.keys(global.console).forEach(method => {
    const consoleFn = (global.console as any)[method];
    if (vi.isMockFunction(consoleFn)) {
      stats[method] = consoleFn.mock.calls.length;
    }
  });

  return stats;
}
