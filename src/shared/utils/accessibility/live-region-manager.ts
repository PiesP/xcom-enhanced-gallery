/**
 * Live Region Manager (Phase 5 Accessibility minimal implementation)
 * Guarantees and reuses a single polite / assertive live region.
 * Test requirements:
 *  - ensurePoliteLiveRegion(): singleton, data-xe-live-region="polite", aria-live="polite", role="status"
 *  - ensureAssertiveLiveRegion(): singleton, data-xe-live-region="assertive", aria-live="assertive", role="alert"
 *  - When both types are used simultaneously, only 2 total
 */
import { globalTimerManager } from '../timer-management';

interface LiveRegionElements {
  polite?: HTMLElement;
  assertive?: HTMLElement;
}

const regions: LiveRegionElements = {};
let initialized = false;
let unloadHandler: ((this: Window, ev: PageTransitionEvent) => unknown) | null = null;

function initLifecycleOnce(): void {
  if (initialized) return;
  initialized = true;
  try {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      unloadHandler = () => {
        try {
          cleanupLiveRegions();
        } catch {
          /* no-op */
        }
      };
      // BFCache compatibility: use pagehide instead of beforeunload
      window.addEventListener('pagehide', unloadHandler as EventListener, { capture: false });
    }
  } catch {
    // Browser/test environment fallback is ignored (cleanup handled by body reset in each test)
  }
}

function createRegion(kind: 'polite' | 'assertive'): HTMLElement {
  if (typeof document === 'undefined') {
    // Phase 137: Non-browser environment defense - use jsdom in tests
    // Minimal object mocking
    const mock = {
      setAttribute() {},
      getAttribute() {
        return null;
      },
    };
    return mock as unknown as HTMLElement;
  }

  const el = document.createElement('div');
  el.setAttribute('data-xe-live-region', kind);
  el.setAttribute('aria-live', kind);
  el.setAttribute('role', kind === 'polite' ? 'status' : 'alert');
  // Screen invisibility (simple minimal styles – can be replaced with actual CSS utility)
  el.style.position = 'absolute';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.margin = '-1px';
  el.style.padding = '0';
  el.style.border = '0';
  el.style.clip = 'rect(0 0 0 0)';
  el.style.overflow = 'hidden';
  document.body.appendChild(el);
  return el;
}

export function ensurePoliteLiveRegion(): HTMLElement {
  initLifecycleOnce();
  if (!regions.polite) {
    regions.polite = createRegion('polite');
  } else if (!regions.polite.isConnected) {
    // If removed from DOM, reattach
    if (typeof document !== 'undefined') {
      document.body.appendChild(regions.polite);
    }
  }
  return regions.polite;
}

export function ensureAssertiveLiveRegion(): HTMLElement {
  initLifecycleOnce();
  if (!regions.assertive) {
    regions.assertive = createRegion('assertive');
  } else if (!regions.assertive.isConnected) {
    if (typeof document !== 'undefined') {
      document.body.appendChild(regions.assertive);
    }
  }
  return regions.assertive;
}

export function getLiveRegionElements(): LiveRegionElements {
  return { ...regions };
}

export function cleanupLiveRegions(): void {
  try {
    if (regions.polite?.isConnected) {
      regions.polite.remove();
    }
    if (regions.assertive?.isConnected) {
      regions.assertive.remove();
    }
  } catch {
    /* no-op */
  } finally {
    delete (regions as Record<string, unknown>).polite;
    delete (regions as Record<string, unknown>).assertive;
    if (
      unloadHandler &&
      typeof window !== 'undefined' &&
      typeof window.removeEventListener === 'function'
    ) {
      try {
        window.removeEventListener('pagehide', unloadHandler as EventListener, false);
      } catch {
        /* ignore */
      }
      unloadHandler = null;
    }
    initialized = false;
  }
}

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  if (!message) return;
  const region = politeness === 'polite' ? ensurePoliteLiveRegion() : ensureAssertiveLiveRegion();
  try {
    // Reset so SR detects same text
    region.textContent = '';
    globalTimerManager.setTimeout(() => {
      region.textContent = message;
    }, 0);
  } catch {
    /* no-op */
  }
}
