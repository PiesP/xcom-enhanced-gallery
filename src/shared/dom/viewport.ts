/**
 * Viewport/Container constraint helpers (PC-only)
 * - Pure calculator + DOM hook to expose values via CSS variables
 */
import { EventManager } from '@shared/services/event-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { createEventListener } from '@shared/utils/types/guards';

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
  // Floor adjustment values for px unit consistency
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
  // Use global timer manager (policy: direct timers forbidden)
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
    // Register with EventManager for unified event tracking/cleanup
    resizeListenerId = EventManager.getInstance().addListener(
      window,
      'resize',
      createEventListener(onResize),
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
      EventManager.getInstance().removeListener(resizeListenerId);
      resizeListenerId = null;
    }
    // Global manager handles individual cleanup
  };
}
