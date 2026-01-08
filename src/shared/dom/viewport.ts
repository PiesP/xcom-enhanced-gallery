/**
 * @fileoverview Viewport/Container constraint helpers (PC-only)
 * @description Pure calculator and DOM hook to expose viewport values via CSS variables.
 */
import { EventManager } from '@shared/services/event-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { createEventListener } from '@shared/utils/types/guards';

interface ChromeOffsets {
  readonly toolbarHeight?: number;
  readonly paddingTop?: number;
  readonly paddingBottom?: number;
}

interface ViewportConstraints {
  readonly viewportW: number;
  readonly viewportH: number;
  readonly constrainedH: number;
}

/**
 * Compute viewport constraints after applying chrome offsets.
 * All measurements are floored for pixel-perfect rendering.
 * @param rect - Element bounding rectangle (width/height)
 * @param chrome - UI chrome offsets (toolbar, padding) in pixels
 * @returns Calculated viewport constraints
 */
function computeViewportConstraints(
  rect: { readonly width: number; readonly height: number },
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
 * Apply viewport constraints as CSS custom properties.
 * Sets --xeg-viewport-w, --xeg-viewport-h, and --xeg-viewport-height-constrained.
 * @param el - Target HTML element (typically gallery container root)
 * @param v - Viewport constraints to apply
 */
function applyViewportCssVars(el: HTMLElement, v: ViewportConstraints): void {
  el.style.setProperty('--xeg-viewport-w', `${v.viewportW}px`);
  el.style.setProperty('--xeg-viewport-h', `${v.viewportH}px`);
  el.style.setProperty('--xeg-viewport-height-constrained', `${v.constrainedH}px`);
}

/**
 * Observe viewport changes and update CSS custom properties.
 * Uses ResizeObserver and window resize events, RAF-throttled.
 * @param el - Target HTML element to observe and apply CSS vars to
 * @param getChrome - Function returning current chrome offsets
 * @returns Cleanup function to disconnect observers and remove listeners
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

  // RAF-throttle update scheduling
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

  // Initial calculation
  calcAndApply();

  // ResizeObserver if available (preferred for element-specific resize detection)
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => schedule());
    try {
      ro.observe(el);
    } catch {
      /* ignore */
    }
  }

  // Window resize fallback (broader scope, still necessary for viewport changes)
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

  return (): void => {
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
