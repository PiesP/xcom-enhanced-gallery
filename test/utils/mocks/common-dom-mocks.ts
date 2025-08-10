/**
 * Shared DOM mocks for tests
 * - Safely provides common browser APIs when missing in jsdom
 */
import { vi } from 'vitest';

type AnyWindow = (Window & typeof globalThis) | any;

export function setupCommonDOMMocks(win?: AnyWindow): void {
  const w: AnyWindow =
    win ?? (typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined);
  const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  if (!w && !g) return;

  // matchMedia
  if (w && typeof w.matchMedia !== 'function') {
    w.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true),
    }));
  }

  // ResizeObserver
  if (typeof g.ResizeObserver === 'undefined') {
    g.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // IntersectionObserver
  if (typeof g.IntersectionObserver === 'undefined') {
    g.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // requestAnimationFrame / cancelAnimationFrame
  if (typeof g.requestAnimationFrame !== 'function') {
    try {
      Object.defineProperty(g, 'requestAnimationFrame', {
        value: (cb: FrameRequestCallback) => setTimeout(cb, 16),
        writable: true,
        configurable: true,
      });
    } catch {
      g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 16);
    }
  }
  if (typeof g.cancelAnimationFrame !== 'function') {
    try {
      Object.defineProperty(g, 'cancelAnimationFrame', {
        value: (id?: number) => (id != null ? clearTimeout(id) : undefined),
        writable: true,
        configurable: true,
      });
    } catch {
      g.cancelAnimationFrame = (id?: number) => (id != null ? clearTimeout(id) : undefined);
    }
  }

  // CSS.supports
  if (typeof g.CSS === 'undefined') {
    g.CSS = {};
  }
  if (typeof g.CSS.supports !== 'function') {
    g.CSS.supports = vi.fn((property: string, value?: string) => {
      const supported = new Set<string>([
        'container-type',
        'color',
        'margin-inline-start',
        'contain',
        'grid-template-rows',
        'layer',
        'display',
        'position',
      ]);
      if (supported.has(property)) return true;
      // simplistic OKLCH check
      if (property === 'color' && value && /oklch\(/i.test(value)) return true;
      return false;
    });
  }
}
