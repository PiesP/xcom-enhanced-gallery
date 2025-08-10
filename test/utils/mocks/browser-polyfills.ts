/**
 * Shared browser polyfills for tests
 * - Provides safe, no-op implementations for missing scroll APIs in jsdom
 */

type AnyWindow = (Window & typeof globalThis) | any;

export function ensureScrollAPIs(win?: AnyWindow): void {
  const w: AnyWindow =
    win ?? (typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined);
  if (!w) return;

  // window.scrollTo: jsdom not implemented
  if (typeof w.scrollTo !== 'function') {
    try {
      Object.defineProperty(w, 'scrollTo', {
        value: function scrollTo(x?: number, y?: number) {
          // No-op for tests; record last positions for potential assertions
          try {
            w.scrollX = typeof x === 'number' ? x : (w.scrollX ?? 0);
            w.scrollY = typeof y === 'number' ? y : (w.scrollY ?? 0);
          } catch {
            // ignore
          }
        },
        writable: true,
        configurable: true,
      });
    } catch {
      // fallback assignment
      (w as any).scrollTo = () => {};
    }
  }
}

export function ensureNavigationAPI(win?: AnyWindow): void {
  const w: AnyWindow =
    win ?? (typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined);
  if (!w) return;
  if (!w.navigation) {
    try {
      Object.defineProperty(w, 'navigation', {
        value: {
          navigate: () => Promise.resolve(),
          addEventListener: () => {},
          removeEventListener: () => {},
        },
        writable: true,
        configurable: true,
      });
    } catch {
      (w as any).navigation = { navigate: () => Promise.resolve() };
    }
  }
}
