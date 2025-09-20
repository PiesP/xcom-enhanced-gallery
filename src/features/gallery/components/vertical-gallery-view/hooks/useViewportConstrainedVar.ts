/**
 * @file useViewportConstrainedVar
 * @description 컨테이너 엘리먼트에 '--xeg-viewport-height-constrained' CSS 변수를
 *              window.innerHeight 기반으로 설정하고, resize 변화에 따라 갱신합니다.
 * @note PC 전용 이벤트만 사용(resize). 테스트 환경(JSDOM)에서도 동작하도록 구현.
 */

import { getPreactHooks } from '@shared/external/vendors';

export interface UseViewportConstrainedVarOptions {
  /** resize 처리 디바운스(ms). 기본 150ms */
  debounceMs?: number;
}

/** 내부 유틸: 간단한 디바운스 구현 (의존성 최소화) */
function debounce<T extends (...args: unknown[]) => void>(fn: T, wait = 150) {
  let t: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, wait);
  };
  debounced.cancel = () => {
    if (t) {
      clearTimeout(t);
      t = null;
    }
  };
  return debounced as T & { cancel: () => void };
}

/** 현재 뷰포트 높이를 px 문자열로 반환 */
function getViewportHeightPx(): string {
  try {
    const hasWindow = typeof window !== 'undefined';
    const h = hasWindow && typeof window.innerHeight === 'number' ? window.innerHeight : 0;
    return `${Math.max(0, h)}px`;
  } catch {
    return '0px';
  }
}

/** 컨테이너에 CSS 변수 적용 */
function applyViewportVar(el: HTMLElement | null): void {
  if (!el) return;
  try {
    el.style.setProperty('--xeg-viewport-height-constrained', getViewportHeightPx());
  } catch {
    // ignore in non-browser/test edge cases
  }
}

/**
 * 컨테이너 엘리먼트에 '--xeg-viewport-height-constrained' 설정 및 갱신 훅
 */
export function useGalleryViewportConstrainedVar(
  containerRef: { current: HTMLElement | null },
  options: UseViewportConstrainedVarOptions = {}
): void {
  const { useLayoutEffect } = getPreactHooks();
  const debounceMs = options.debounceMs ?? 150;

  // 초기 마운트 시점에 즉시 적용되도록 layoutEffect 사용
  useLayoutEffect(() => {
    const el = containerRef.current;
    // 초기 적용
    applyViewportVar(el);

    // resize에 반응 (PC 전용)
    const handler = debounce(() => applyViewportVar(containerRef.current), debounceMs);
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', handler);
    }

    return () => {
      try {
        handler.cancel?.();
      } catch {
        /* noop */
      }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('resize', handler as unknown as EventListener);
      }
    };
    // containerRef는 ref 객체 그 자체가 안정적이므로 의존성에 포함하지 않음
  }, [debounceMs]);
}

// 호환성: 기존 이름을 유지한 채 도메인 특화 네이밍으로 이전
export { useGalleryViewportConstrainedVar as useViewportConstrainedVar };
