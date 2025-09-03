/**
 * ThemeService resolved theme test
 * Phase21.5: getResolvedTheme() GREEN 검증
 */
import { describe, it, expect, vi } from 'vitest';
import { ThemeService } from '@shared/services/ThemeService';

// JSDOM matchMedia mock
function mockMatchMedia(dark: boolean) {
  if (typeof globalThis === 'undefined') return;
  const win =
    (globalThis as unknown as { window?: Window }).window ?? (globalThis as unknown as Window);
  Object.defineProperty(win, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? dark : !dark,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('ThemeService.getResolvedTheme', () => {
  it('auto 설정에서 시스템 다크 선호 시 dark 반환 기대', () => {
    mockMatchMedia(true);
    const service = new ThemeService();
    const resolved = service.getResolvedTheme?.();
    expect(resolved).toBe('dark'); // 구현 후 GREEN
  });

  it('auto 설정에서 시스템 라이트 선호 시 light 반환 기대', () => {
    mockMatchMedia(false);
    const service = new ThemeService();
    const resolved = service.getResolvedTheme?.();
    expect(resolved).toBe('light');
  });
});
