/**
 * @fileoverview 환경 감지 유틸리티
 * @description 다양한 환경을 감지하는 통합 유틸리티
 */

/**
 * 테스트 환경인지 확인
 */
export function isTestEnvironment(): boolean {
  // Node.js 환경 체크
  if (typeof window === 'undefined' || typeof global !== 'undefined') {
    return true;
  }

  // Vitest 환경 체크
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
      return true;
    }
  }

  // globalThis에서 Vitest 관련 속성 체크
  if (typeof globalThis !== 'undefined') {
    if ('__vitest_worker__' in globalThis || '__vite_test__' in globalThis) {
      return true;
    }
  }

  return false;
}

/**
 * 브라우저 환경인지 확인
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * 개발 환경인지 확인
 */
export function isDevelopmentEnvironment(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  return false;
}

/**
 * 프로덕션 환경인지 확인
 */
export function isProductionEnvironment(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production';
  }
  return false;
}

/**
 * UserScript 환경인지 확인
 */
export function isUserScriptEnvironment(): boolean {
  return typeof GM_getValue !== 'undefined' && typeof GM_setValue !== 'undefined';
}
