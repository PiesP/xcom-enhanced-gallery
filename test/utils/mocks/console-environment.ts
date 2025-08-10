/**
 * Ultimate Console Environment for TDD Testing
 * 🎯 모든 console API를 완전히 모킹하여 테스트 안정성 보장
 *
 * Note: Avoids using Vitest APIs (vi.fn, vi.restoreAllMocks) to prevent
 * teardown-time access to Vitest worker state on Windows.
 */
type AnyFn = () => void;

/**
 * Ultimate Console API Mock
 * Node.js 환경에서 브라우저의 모든 console 메서드를 완전 구현
 */
export interface UltimateConsole {
  debug: AnyFn;
  log: AnyFn;
  info: AnyFn;
  warn: AnyFn;
  error: AnyFn;
  trace: AnyFn;
  group: AnyFn;
  groupCollapsed: AnyFn;
  groupEnd: AnyFn;
  clear: AnyFn;
  count: AnyFn;
  countReset: AnyFn;
  time: AnyFn;
  timeEnd: AnyFn;
  timeLog: AnyFn;
  assert: AnyFn;
  dir: AnyFn;
  dirxml: AnyFn;
  table: AnyFn;
  profile: AnyFn;
  profileEnd: AnyFn;
}

/**
 * Ultimate Console 환경 설정
 * 🚀 모든 console 메서드를 완전 모킹하여 테스트 안정성 보장
 */
export function setupUltimateConsoleEnvironment(): void {
  // plain no-op function to avoid Vitest mock state
  const noop = (): void => {};

  // Ultimate Console Mock 객체 생성 (no vi.fn)
  const ultimateConsole: UltimateConsole = {
    debug: noop,
    log: noop,
    info: noop,
    warn: noop,
    error: noop,
    trace: noop,
    group: noop,
    groupCollapsed: noop,
    groupEnd: noop,
    clear: noop,
    count: noop,
    countReset: noop,
    time: noop,
    timeEnd: noop,
    timeLog: noop,
    assert: noop,
    dir: noop,
    dirxml: noop,
    table: noop,
    profile: noop,
    profileEnd: noop,
  };

  // Global console 객체에 Ultimate Console 적용
  Object.assign(global.console, ultimateConsole);

  console.log('[Ultimate Console Environment] 🎯 모든 console API 모킹 완료!');
}

/**
 * Ultimate Console 환경 정리
 */
export function cleanupUltimateConsoleEnvironment(): void {
  // No Vitest state to restore; keep as no-ops for stability
  // Intentionally left blank to avoid touching internal state during teardown
  console.log('[Ultimate Console Environment] 환경 정리 완료 ✅');
}
