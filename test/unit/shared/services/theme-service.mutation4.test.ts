import { ThemeService } from '@shared/services/theme-service';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import * as themeDomModule from '@shared/dom/theme';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

vi.mock('@shared/dom/theme', () => ({ syncThemeAttributes: vi.fn() }));
vi.mock('@shared/logging', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/services/persistent-storage', () => ({ getPersistentStorage: vi.fn() }));

describe('ThemeService extra mutation coverage', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ThemeService as any).instance = undefined;
    storageMock = { getSync: vi.fn().mockReturnValue({ gallery: { theme: 'auto' } }), get: vi.fn().mockResolvedValue({ gallery: { theme: 'auto' } }) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getPersistentStorage as any).mockReturnValue(storageMock);
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ThemeService as any).instance = undefined;
  });

  it('should resolve effective theme to dark when mediaQueryList.matches is true and themeSetting is auto', () => {
    const addEventListener = vi.fn();
    const mql = { matches: true, addEventListener, removeEventListener: vi.fn() } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockReturnValue(mql) });

    const service = new ThemeService();
    // Ensure set auto explicitly
    service.setTheme('auto');

    expect(service.getEffectiveTheme()).toBe('dark');
  });

  it('should respect explicit themeSetting (light/dark) regardless of media matches', () => {
    const addEventListener = vi.fn();
    const mql = { matches: true, addEventListener, removeEventListener: vi.fn() } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockReturnValue(mql) });

    const service = new ThemeService();
    service.setTheme('light');
    expect(service.getEffectiveTheme()).toBe('light');

    service.setTheme('dark');
    expect(service.getEffectiveTheme()).toBe('dark');
  });

  it('should apply theme on media query change when in auto mode', async () => {
    // Capture 'change' listener so we can trigger it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let changeCb: ((ev: any) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addEventListener = (type: string, cb: (ev: any) => void) => { if (type === 'change') changeCb = cb; };
    const mql = { matches: false, addEventListener, removeEventListener: vi.fn() } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockReturnValue(mql) });

    const service = new ThemeService();
    // Set to auto
    service.setTheme('auto');

    // allow async initialization to attach listener
    // (initializeSystemDetection is scheduled asynchronously in constructor)
    // allow async initialization to attach listener
    // (initializeSystemDetection is scheduled asynchronously in constructor and may await storage)
    await new Promise((r) => setTimeout(r, 0));

    // set matches to true and trigger change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mql as any).matches = true;
    expect(changeCb).toBeTruthy();
    if (changeCb) (changeCb as (ev: unknown) => void)({ matches: true });

    // syncThemeAttributes is mocked; ensure it was called (indirectly via applyCurrentTheme)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((themeDomModule as any).syncThemeAttributes).toHaveBeenCalled();
  });

  it('bindSettingsService should sync and subscribe to settings changes', () => {
    const service = new ThemeService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscribers: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settingsMock: any = {
      get: vi.fn().mockReturnValue('light'),
      set: vi.fn().mockResolvedValue(undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscribe: vi.fn((cb: any) => {
        subscribers.push(cb);
        return () => {};
      }),
    };

    service.bindSettingsService(settingsMock);
    expect(service.getCurrentTheme()).toBe('light');
    // Simulate settings change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribers.forEach((fn: any) => fn({ key: 'gallery.theme', newValue: 'dark' }));
    expect(service.getCurrentTheme()).toBe('dark');
  });
});
