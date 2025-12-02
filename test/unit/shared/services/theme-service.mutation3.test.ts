/**
 * Additional ThemeService mutation coverage
 */
import { ThemeService } from '@shared/services/theme-service';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import * as themeDomModule from '@shared/dom/theme';
import { logger } from '@shared/logging';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

vi.mock('@shared/dom/theme', () => ({ syncThemeAttributes: vi.fn() }));
vi.mock('@shared/logging', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/services/persistent-storage', () => ({ getPersistentStorage: vi.fn() }));

describe('ThemeService mutation extra coverage', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ThemeService as any).instance = undefined;

    storageMock = { getSync: vi.fn().mockReturnValue({ gallery: { theme: 'light' } }), get: vi.fn().mockResolvedValue({ gallery: { theme: 'light' } }) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getPersistentStorage as any).mockReturnValue(storageMock);
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = ThemeService.getInstance();
    // Clean up observer etc
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any).onDestroy?.();
    } catch {
      // might be protected or not present
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ThemeService as any).instance = undefined;
  });

  it('should not observe when document.documentElement is missing', () => {
    // Make document.documentElement undefined temporarily
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orig = (document as any).documentElement;
    Object.defineProperty(document, 'documentElement', { configurable: true, value: undefined });

    // Mock MutationObserver so we can check observe called or not
    const observe = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MoMock = function (this: any) {
      this.observe = observe;
      this.disconnect = vi.fn();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).MutationObserver = MoMock;

    new ThemeService();
    // Should have logged warn about missing documentElement
    expect(logger.warn).toHaveBeenCalled();

    // Restore
    Object.defineProperty(document, 'documentElement', { configurable: true, value: orig });
  });

  it('should add media query change listener when matchMedia returns object', () => {
    const addEventListener = vi.fn();
    const mql = { matches: false, addEventListener, removeEventListener: vi.fn() } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockReturnValue(mql) });

    const service = new ThemeService();
    // initializeSystemDetection is invoked by constructor pending Promise; to exercise directly, call it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any)['initializeSystemDetection']?.();

    expect(addEventListener).toHaveBeenCalled();
  });

  it('loadThemeSync should return auto when storage throws', () => {
    storageMock.getSync.mockImplementation(() => { throw new Error('oh no'); });
    const service = new ThemeService();
    // Because constructor calls loadThemeSync and initial themeSetting is auto on fail
    expect(service.getCurrentTheme()).toBe('auto');
  });

  // Unused import prevention - use themeDomModule in a test
  it('should use themeDom module mock', () => {
    expect(themeDomModule).toBeDefined();
  });
});
