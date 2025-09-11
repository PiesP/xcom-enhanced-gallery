/**
 * Focus Restore Manager
 * Phase 5 (Accessibility) 최소 구현 – 포커스 스코프 진입 시 현재 activeElement를 기억하고
 * 반환된 clean-up 함수를 호출하면 안전하게 포커스를 복원한다.
 *
 * 요구사항 (RED 테스트 기준):
 *  - beginFocusScope() 호출 시 restore 함수 반환
 *  - restore() 실행 시 원래 포커스 요소가 아직 DOM 내에 있으면 재포커스
 *  - 제거되었으면 body 또는 documentElement로 graceful fallback
 *  - 예외 발생하지 않아야 함
 *  - (중첩 스코프는 추후 확장) – 현재 단일 스코프만 지원
 */

// 명시적 타입 정의 (strict 모드)
export type FocusRestoreFn = () => void;

/**
 * 포커스 스코프 시작 – 현재 activeElement를 기억하고 restore 함수를 반환
 */
export function beginFocusScope(): FocusRestoreFn {
  // jsdom/브라우저 환경 모두 고려 (SSR 환경 방어)
  if (typeof document === 'undefined') {
    return () => {};
  }
  const original: Element | null = document.activeElement;

  return function restore(): void {
    if (typeof document === 'undefined') return;

    if (original && original instanceof HTMLElement && document.contains(original)) {
      try {
        original.focus({ preventScroll: true });
        return;
      } catch {
        // 실패 시 fallback 진행
      }
    }

    // Fallback: body 우선, 없으면 documentElement
    const fallback: HTMLElement | null =
      (document.body as HTMLElement | null) ?? document.documentElement;
    if (fallback) {
      // body/html이 기본적으로 focus 불가할 수 있으므로 tabindex 부여
      if (!fallback.hasAttribute('tabindex')) {
        try {
          fallback.setAttribute('tabindex', '-1');
        } catch {
          /* ignore */
        }
      }
      try {
        // 현재 활성 요소 blur 후 focus 이동
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
          try {
            (document.activeElement as HTMLElement).blur();
          } catch {
            /* ignore */
          }
        }
        fallback.focus({ preventScroll: true });
      } catch {
        // 최종 실패는 조용히 무시
      }
    }
  };
}
