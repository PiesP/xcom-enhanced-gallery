/**
 * Viewport/Container constraint helpers (PC-only)
 * - Pure calculator + DOM hook to expose values via CSS variables
 */
import { globalTimerManager } from './timer-management';
import { addListener, removeEventListenerManaged } from './events';

export interface ChromeOffsets {
  readonly toolbarHeight?: number; // px
  readonly paddingTop?: number; // px
  readonly paddingBottom?: number; // px
}

export interface ViewportConstraints {
  readonly viewportW: number; // px
  readonly viewportH: number; // px
  readonly constrainedH: number; // px
}

export function computeViewportConstraints(
  rect: { width: number; height: number },
  chrome: ChromeOffsets = {}
): ViewportConstraints {
  const vw = Math.max(0, Math.floor(rect.width));
  const vh = Math.max(0, Math.floor(rect.height));
  // px 단위 정합성을 위해 보정값도 정수로 내림
  const top = Math.max(0, Math.floor(chrome.paddingTop ?? 0));
  const bottom = Math.max(0, Math.floor(chrome.paddingBottom ?? 0));
  const toolbar = Math.max(0, Math.floor(chrome.toolbarHeight ?? 0));
  const constrained = Math.max(0, vh - top - bottom - toolbar);
  return { viewportW: vw, viewportH: vh, constrainedH: constrained };
}

/**
 * Apply CSS variables to an element (root of gallery container)
 */
export function applyViewportCssVars(el: HTMLElement, v: ViewportConstraints): void {
  el.style.setProperty('--xeg-viewport-w', `${v.viewportW}px`);
  el.style.setProperty('--xeg-viewport-h', `${v.viewportH}px`);
  el.style.setProperty('--xeg-viewport-height-constrained', `${v.constrainedH}px`);
}

/**
 * Observe changes and update CSS vars. Returns cleanup function.
 */
export function observeViewportCssVars(
  el: HTMLElement,
  getChrome: () => ChromeOffsets
): () => void {
  // 전역 타이머 매니저 사용 (정책상 직접 타이머 금지)
  let disposed = false;

  const calcAndApply = (): void => {
    if (disposed) return;
    const rect = el.getBoundingClientRect();
    const v = computeViewportConstraints({ width: rect.width, height: rect.height }, getChrome());
    applyViewportCssVars(el, v);
  };

  // raf-throttle
  let pending = false;
  const schedule = (): void => {
    if (pending) return;
    pending = true;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        pending = false;
        calcAndApply();
      });
    } else {
      globalTimerManager.setTimeout(() => {
        pending = false;
        calcAndApply();
      }, 0);
    }
  };

  // Initial
  calcAndApply();

  // ResizeObserver if available
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => schedule());
    try {
      ro.observe(el);
    } catch {
      /* ignore */
    }
  }

  // window resize fallback
  const onResize = (): void => schedule();
  let resizeListenerId: string | null = null;
  if (typeof window !== 'undefined') {
    // 통합 이벤트 유틸로 등록하여 추적/정리가 용이하도록 함
    // 설계상 필수 타입 단언 (Phase 103): UIEvent 핸들러를 EventListener로 변환
    // 이유: addEventListener는 EventListener 타입만 허용하지만, 핸들러는 구체적인 UIEvent 타입
    // 배경: TypeScript의 EventListener 정의는 모든 이벤트 타입을 커버하지 못함
    // 대안: 제네릭 래퍼 함수 추가 시 복잡도/성능 오버헤드 증가 (Phase 105+)
    resizeListenerId = addListener(
      window,
      'resize',
      onResize as unknown as EventListener,
      { passive: true },
      'viewport:resize'
    );
  }

  return () => {
    disposed = true;
    if (ro) {
      try {
        ro.disconnect();
      } catch {
        /* ignore */
      }
    }
    if (resizeListenerId) {
      removeEventListenerManaged(resizeListenerId);
      resizeListenerId = null;
    }
    // 전역 매니저 사용으로 개별 정리 불필요
  };
}
