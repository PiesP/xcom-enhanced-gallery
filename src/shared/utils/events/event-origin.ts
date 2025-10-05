/**
 * @fileoverview Event Origin Detector
 * @description 이벤트가 특정 컨테이너 내부에서 발생했는지 판별하는 유틸리티
 */

const BODY_ELEMENTS = new Set<EventTarget | null>([
  typeof document !== 'undefined' ? document.body : null,
  typeof document !== 'undefined' ? document.documentElement : null,
  typeof document !== 'undefined' ? document : null,
  typeof window !== 'undefined' ? window : null,
]);

export interface EventOriginOptions {
  checkComposedPath?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodyLikeElements?: Set<any>;
}

function isBodyLike(container: HTMLElement | null): boolean {
  if (!container || typeof document === 'undefined') return false;
  return container === document.body || container === document.documentElement;
}

/**
 * 이벤트가 특정 컨테이너 내부에서 발생했는지 판별
 * @param event - 확인할 이벤트
 * @param container - 대상 컨테이너
 * @param options - 추가 옵션
 * @returns 컨테이너 내부 이벤트 여부
 */
export function isEventWithinContainer(
  event: Event,
  container: HTMLElement | null,
  options: EventOriginOptions = {}
): boolean {
  if (!container) return false;

  const { checkComposedPath = true, bodyLikeElements = BODY_ELEMENTS } = options;

  const target = event.target as Node | null;

  // 1. 기본 contains 체크
  if (target && container.contains(target)) {
    return true;
  }

  // 2. composedPath 체크 (Shadow DOM 대응)
  if (checkComposedPath && typeof event.composedPath === 'function') {
    const path = event.composedPath();
    if (path.includes(container)) {
      return true;
    }

    // body-like 특별 처리
    if (isBodyLike(container) && path.some(node => bodyLikeElements.has(node))) {
      return true;
    }
  }

  // 3. Direct match
  if (isBodyLike(container)) {
    return bodyLikeElements.has(target);
  }

  return target === container;
}

export { BODY_ELEMENTS };
