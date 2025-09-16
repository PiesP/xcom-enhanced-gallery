import { describe, it, expect, beforeEach, vi } from 'vitest';

// We import lazily in each test to avoid module state bleed

function setupDom() {
  document.documentElement.removeAttribute('data-theme');
}

describe('ThemeBootstrap', () => {
  beforeEach(() => {
    setupDom();
    // Reset localStorage (guarded for environments without it)
    try {
      globalThis.localStorage?.clear();
    } catch (e) {
      // ignore
    }
  });

  it('sets data-theme=dark when setting is auto or missing and system prefers dark', async () => {
    // mock matchMedia
    const mql = {
      matches: true,
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    } as any;
    const mm = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);

    const mod = await import('@/shared/services/ThemeBootstrap');
    mod.bootstrapInitialTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    mm.mockRestore();
  });

  it('respects saved light value', async () => {
    globalThis.localStorage?.setItem('xeg-theme', 'light');

    const mod = await import('@/shared/services/ThemeBootstrap');
    mod.bootstrapInitialTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('respects saved dark value', async () => {
    globalThis.localStorage?.setItem('xeg-theme', 'dark');

    const mod = await import('@/shared/services/ThemeBootstrap');
    mod.bootstrapInitialTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('falls back to light on invalid saved value', async () => {
    globalThis.localStorage?.setItem('xeg-theme', 'weird');

    // Ensure prefers dark would be true to see fallback wins only when invalid
    const mql = { matches: true } as any;
    const mm = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);

    const mod = await import('@/shared/services/ThemeBootstrap');
    mod.bootstrapInitialTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    mm.mockRestore();
  });

  it('is idempotent (calling twice keeps same value and no listeners)', async () => {
    const mql = { matches: false } as any;
    const mm = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);

    const mod = await import('@/shared/services/ThemeBootstrap');
    mod.bootstrapInitialTheme();
    const first = document.documentElement.getAttribute('data-theme');
    mod.bootstrapInitialTheme();
    const second = document.documentElement.getAttribute('data-theme');

    expect(first).toBe('light');
    expect(second).toBe('light');

    mm.mockRestore();
  });

  it('ThemeService effective theme matches bootstrapped data-theme', async () => {
    globalThis.localStorage?.setItem('xeg-theme', 'dark');

    const boot = await import('@/shared/services/ThemeBootstrap');
    boot.bootstrapInitialTheme();

    const { ThemeService } = await import('@/shared/services/ThemeService');
    const svc = new ThemeService();

    expect(svc.getEffectiveTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
