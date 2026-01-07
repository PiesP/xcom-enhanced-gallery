/**
 * Viewport/Container constraint helpers (PC-only)
 * - Pure calculator + DOM hook to expose values via CSS variables
 * @module viewport
 */
import { EventManager } from '@shared/services/event-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { createEventListener } from '@shared/utils/types/guards';

/**
 * Chrome UI offsets that affect available viewport space
 * All values in pixels (px)
 */
interface ChromeOffsets {
  /**
   * Toolbar height (px)
   */
  readonly toolbarHeight?: number;
  /**
   * Top padding (px)
   */
  readonly paddingTop?: number;
  /**
   * Bottom padding (px)
   */
  readonly paddingBottom?: number;
}

/**
 * Calculated viewport constraints
 * All values in pixels (px)
 */
interface ViewportConstraints {
  /**
   * Viewport width (px)
   */
  readonly viewportW: number;
  /**
   * Viewport height (px)
   */
  readonly viewportH: number;
  /**
   * Constrained height after subtracting chrome offsets (px)
   */
  readonly constrainedH: number;
}

/**
 * Computes viewport constraints after applying chrome offsets
 * All measurements are floored for pixel-perfect rendering consistency
 *
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
 * Applies viewport constraints as CSS custom properties to an element
 * Sets --xeg-viewport-w, --xeg-viewport-h, and --xeg-viewport-height-constrained
 *
 * @param el - Target HTML element (typically gallery container root)
 * @param v - Viewport constraints to apply
 */
function applyViewportCssVars(el: HTMLElement, v: ViewportConstraints): void {
  el.style.setProperty('--xeg-viewport-w', `${v.viewportW}px`);
  el.style.setProperty('--xeg-viewport-h', `${v.viewportH}px`);
  el.style.setProperty('--xeg-viewport-height-constrained', `${v.constrainedH}px`);
}

/**
 * Observes viewport changes and updates CSS custom properties
 * Uses ResizeObserver (if available) and window resize events for reactivity
 * Updates are RAF-throttled for performance
 *
 * @param el - Target HTML element to observe and apply CSS vars to
 * @param getChrome - Function returning current chrome offsets
 * @returns Cleanup function to disconnect observers and remove listeners
 *
 * @example
 * ```typescript
 * const cleanup = observeViewportCssVars(containerEl, () => ({
 *   toolbarHeight: 60,
 *   paddingTop: 10,
 *   paddingBottom: 10,
 * }));
 *
 * // Later, to cleanup:
 * cleanup();
 * ```
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
