/**
 * 테스트 환경용 로깅 헬퍼
 * JSDOM 환경에서 console 사용 시 ESLint 오류를 방지하는 안전한 래퍼
 */

/**
 * 테스트 환경용 console 래퍼
 * ESLint 오류를 방지하면서 안전하게 로깅
 */
export const testLogger = {
  log: function (message) {
    if (typeof globalThis !== 'undefined' && globalThis.console) {
      globalThis.console.log(message);
    }
  },

  warn: function (message) {
    if (typeof globalThis !== 'undefined' && globalThis.console) {
      globalThis.console.warn(message);
    }
  },

  error: function (message) {
    if (typeof globalThis !== 'undefined' && globalThis.console) {
      globalThis.console.error(message);
    }
  },
};

/**
 * silent 모드 로거 (테스트 시 출력 억제용)
 */
export const silentTestLogger = {
  log: function () {},
  warn: function () {},
  error: function () {},
};
