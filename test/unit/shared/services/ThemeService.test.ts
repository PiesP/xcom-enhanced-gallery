/**
 * @fileoverview ThemeService 확장 테스트
 * @description 수동 테마 설정 기능 추가를 위한 TDD 테스트
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThemeService } from '../../../../src/shared/services/theme-service';

describe('ThemeService Extended', () => {
  let themeService: ThemeService;
  // eslint-disable-next-line no-undef
  let mockDocument: Partial<Document>;

  beforeEach(() => {
    // DOM mock 설정
    mockDocument = {
      documentElement: {
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      } as any,
    };
    vi.stubGlobal('document', mockDocument);

    themeService = new ThemeService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('manual theme setting', () => {
    it('수동으로 테마를 설정할 수 있어야 함', () => {
      themeService.setTheme('dark');
      expect(themeService.getCurrentTheme()).toBe('dark');
    });

    it('수동 테마 설정 시 DOM에 반영되어야 함', () => {
      // 먼저 다른 테마로 설정하여 변경이 감지되도록 함
      themeService.setTheme('dark');

      // 이제 light로 변경하면 실제 변경이 발생
      themeService.setTheme('light');

      expect(mockDocument.documentElement?.setAttribute).toHaveBeenLastCalledWith(
        'data-theme',
        'light'
      );
    });

    it('auto 테마 설정 시 시스템 테마를 감지해야 함', () => {
      const mockMediaQueryList = {
        matches: true, // 다크 모드
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue(mockMediaQueryList),
      });

      // 먼저 light로 설정하여 기준점 설정
      themeService.setTheme('light');

      // 새로운 ThemeService 인스턴스로 auto 설정 시 dark 시스템 테마 감지
      const newThemeService = new ThemeService();
      newThemeService.setTheme('auto');

      // auto 설정 시 시스템 테마를 감지하여 적용
      expect(mockDocument.documentElement?.setAttribute).toHaveBeenLastCalledWith(
        'data-theme',
        'dark'
      );
    });

    it('잘못된 테마 값 시 기본값으로 fallback해야 함', () => {
      themeService.setTheme('invalid' as any);
      expect(themeService.getCurrentTheme()).toBe('light'); // 기본값
    });
  });

  describe('theme persistence', () => {
    it('테마 설정이 localStorage에 저장되어야 함', () => {
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', mockLocalStorage);

      themeService.setTheme('dark');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('xeg-theme', 'dark');
    });

    it('페이지 로드 시 저장된 테마를 복원해야 함', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('dark'),
        setItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', mockLocalStorage);

      const newThemeService = new ThemeService();
      newThemeService.initialize();

      expect(newThemeService.getCurrentTheme()).toBe('dark');
    });

    it('저장된 테마가 없으면 auto를 기본값으로 사용해야 함', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', mockLocalStorage);

      const newThemeService = new ThemeService();
      newThemeService.initialize();

      expect(newThemeService.getCurrentTheme()).toBe('auto');
    });
  });

  describe('theme change events', () => {
    it('테마 변경 시 리스너가 호출되어야 함', () => {
      const mockListener = vi.fn();
      themeService.onThemeChange(mockListener);

      themeService.setTheme('dark');

      expect(mockListener).toHaveBeenCalledWith('dark', 'dark');
    });

    it('여러 리스너가 모두 호출되어야 함', () => {
      const mockListener1 = vi.fn();
      const mockListener2 = vi.fn();

      themeService.onThemeChange(mockListener1);
      themeService.onThemeChange(mockListener2);

      // 현재와 다른 테마로 변경하여 실제 변경 발생시킴
      themeService.setTheme('dark');

      expect(mockListener1).toHaveBeenCalledWith('dark', 'dark');
      expect(mockListener2).toHaveBeenCalledWith('dark', 'dark');
    });

    it('구독 해제 함수가 올바르게 작동해야 함', () => {
      const mockListener = vi.fn();
      const unsubscribe = themeService.onThemeChange(mockListener);

      unsubscribe();
      themeService.setTheme('dark');

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('effective theme calculation', () => {
    it('manual 테마 설정 시 해당 테마를 반환해야 함', () => {
      themeService.setTheme('dark');
      expect(themeService.getEffectiveTheme()).toBe('dark');
    });

    it('auto 설정 시 시스템 테마를 반환해야 함', () => {
      const mockMediaQueryList = {
        matches: false, // 라이트 모드
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue(mockMediaQueryList),
      });

      themeService.setTheme('auto');
      expect(themeService.getEffectiveTheme()).toBe('light');
    });
  });

  describe('initialization', () => {
    it('초기화 시 이벤트 리스너가 등록되어야 함', () => {
      const mockMediaQueryList = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const mockWindow = {
        matchMedia: vi.fn().mockReturnValue(mockMediaQueryList),
      };
      vi.stubGlobal('window', mockWindow);

      const newThemeService = new ThemeService();
      newThemeService.initialize();

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('초기화 없이도 기본 동작이 가능해야 함', () => {
      expect(() => {
        themeService.setTheme('light');
        themeService.getCurrentTheme();
      }).not.toThrow();
    });
  });
});
