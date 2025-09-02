/**
 * requestAnimationFrame / cancelAnimationFrame 안전 래퍼
 * JSDOM 또는 테스트 teardown 이후에도 ReferenceError 없이 동작하도록 보호.
 *
 * 문제가 되었던 케이스:
 *  - 모듈 내부에서 `cancelAnimationFrame` 식별자를 직접 참조하는 비동기 콜백이
 *    테스트 환경 teardown 이후 실행되면서 전역 lexical binding 이 사라져
 *    ReferenceError 발생.
 *
 * 해결 전략:
 *  - 전역 객체 프로퍼티 존재 여부를 매 호출 시점에서 동적으로 검사
 *  - fallback: setTimeout / clearTimeout 사용
 *  - 모듈 로컬 함수 (`raf`, `caf`) 로 캡슐화하여 비동기 지연 후에도 안전
 */

/** Frame request 함수 */
export function raf(cb: FrameRequestCallback): number {
  try {
    if (typeof globalThis !== 'undefined') {
      const impl = globalThis.requestAnimationFrame;
      if (typeof impl === 'function') {
        return impl(cb);
      }
    }
  } catch {
    // ignore and fallback
  }
  // fallback: emulate ~60fps
  const timeoutId = setTimeout(() => {
    try {
      cb(Date.now());
    } catch {
      /* noop */
    }
  }, 16) as unknown as number; // ensure numeric id
  return timeoutId;
}

/** Cancel frame request (safe) */
export function caf(id: number | null | undefined): void {
  if (id == null) return;
  try {
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.cancelAnimationFrame === 'function'
    ) {
      globalThis.cancelAnimationFrame(id);
      return;
    }
  } catch {
    // ignore and try timeout fallback
  }
  try {
    clearTimeout(id as unknown as number);
  } catch {
    // ignore
  }
}

/** Convenience: pair object */
export const rafSafe = { raf, caf };
