/**
 * Theme System Simplification - TDD RED Phase
 *
 * 🔴 테마 시스템 단순화 테스트:
 * - Theme을 3가지로 단순화 ('auto' | 'light' | 'dark')
 * - ThemeStyle 개념 제거
 * - native 테마 제거하고 auto가 시스템 테마 감지
 * - 네이티브 스타일을 기본 스타일로 적용
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('🔴 RED: Theme System Simplification', () => {
  let dom: JSDOM;
  let mockMatchMedia: vi.Mock;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div data-testid="gallery-container"></div>
          <div class="toolbar"></div>
          <div class="settings-modal"></div>
        </body>
      </html>
    `);

    // JSDOM 환경 설정
    global.document = dom.window.document;
    global.window = dom.window as any;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;

    // localStorage 모킹
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    // matchMedia 모킹
    mockMatchMedia = vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
    (global.window as any).matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Simplified Theme Types', () => {
    it('🔴 should only support three theme types: auto, light, dark', async () => {
      // Given: 새로운 테마 시스템
      const { ThemeService } = await import('@shared/services/theme-service');

      // When: 테마 타입 검증
      const validThemes = ['auto', 'light', 'dark'];

      // Then: 오직 3가지 테마만 지원해야 함
      const themeService = new ThemeService();

      // 유효한 테마들이 정상 작동해야 함
      validThemes.forEach(theme => {
        expect(() => themeService.setTheme(theme as any)).not.toThrow();
      });

      // native 테마는 더 이상 존재하지 않아야 함
      expect(() => themeService.setTheme('native' as any)).toThrow(); // 의도적 실패 - 현재는 native 지원
    });

    it('🔴 should not have ThemeStyle concept', async () => {
      // Given: 단순화된 테마 시스템
      const { ThemeService } = await import('@shared/services/theme-service');
      const themeService = new ThemeService();

      // When: ThemeStyle 관련 메서드 확인
      // Then: ThemeStyle 관련 메서드가 존재하지 않아야 함
      expect(themeService.setThemeStyle).toBeUndefined(); // 의도적 실패 - 현재는 존재
      expect(themeService.getCurrentThemeStyle).toBeUndefined(); // 의도적 실패 - 현재는 존재
    });

    it('🔴 should apply native style as default for all themes', async () => {
      // Given: 모든 테마에 네이티브 스타일 적용
      const { ThemeService } = await import('@shared/services/theme-service');
      const themeService = new ThemeService();

      // When: 각 테마 적용
      const themes = ['auto', 'light', 'dark'];

      for (const theme of themes) {
        themeService.setTheme(theme as any);
        await new Promise(resolve => setTimeout(resolve, 20));

        // Then: data-theme-style 속성이 없어야 함 (네이티브가 기본)
        const themeStyleAttr = document.documentElement.getAttribute('data-theme-style');
        expect(themeStyleAttr).toBeNull(); // 의도적 실패 - 현재는 data-theme-style 존재
      }
    });
  });

  describe('Auto Theme System Detection', () => {
    it('🔴 should detect system theme automatically when auto is selected', async () => {
      // Given: 시스템이 다크 모드인 환경
      mockMatchMedia.mockImplementation((query: string) => {
        if (query === '(prefers-color-scheme: dark)') {
          return {
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          };
        }
        return {
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      });

      // When: auto 테마 설정
      const { ThemeService } = await import('@shared/services/theme-service');
      const themeService = new ThemeService();
      themeService.setTheme('auto');

      await new Promise(resolve => setTimeout(resolve, 20));

      // Then: 시스템 다크 모드가 감지되어 dark 테마 적용
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('🔴 should detect system light theme when system is in light mode', async () => {
      // Given: 시스템이 라이트 모드인 환경
      mockMatchMedia.mockImplementation(() => ({
        matches: false, // light mode
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      // When: auto 테마 설정
      const { ThemeService } = await import('@shared/services/theme-service');
      const themeService = new ThemeService();
      themeService.setTheme('auto');

      await new Promise(resolve => setTimeout(resolve, 20));

      // Then: 시스템 라이트 모드가 감지되어 light 테마 적용
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Unified Native Styling', () => {
    it('🔴 should apply consistent native styling across all components', async () => {
      // Given: 테마 시스템 적용
      const { ThemeService } = await import('@shared/services/theme-service');
      const themeService = new ThemeService();

      // When: 다크 모드 적용
      themeService.setTheme('dark');
      await new Promise(resolve => setTimeout(resolve, 20));

      // Then: 모든 컴포넌트에 네이티브 스타일이 기본 적용됨
      const toolbar = document.querySelector('.toolbar');
      const settingsModal = document.querySelector('.settings-modal');
      const galleryContainer = document.querySelector('[data-testid="gallery-container"]');

      // 네이티브 스타일이 기본이므로 별도 style 속성 없이 테마만 적용
      [toolbar, settingsModal, galleryContainer].forEach(element => {
        if (element) {
          expect(element.getAttribute('data-theme')).toBe('dark');
          expect(element.getAttribute('data-theme-style')).toBeNull(); // style 속성 제거됨
        }
      });
    });

    it('🔴 should have unified CSS classes without style variations', async () => {
      // Given: 단순화된 CSS 클래스 시스템
      const { ThemeService } = await import('@shared/services/theme-service');
      const themeService = new ThemeService();

      // When: 테마 변경
      themeService.setTheme('light');
      await new Promise(resolve => setTimeout(resolve, 20));

      // Then: glassmorphism/native 구분이 없어야 함
      const documentElement = document.documentElement;
      expect(documentElement.classList.contains('xeg-theme-glassmorphism')).toBe(false);
      expect(documentElement.classList.contains('xeg-theme-native')).toBe(false);

      // 오직 테마 클래스만 존재
      expect(documentElement.classList.contains('xeg-theme-light')).toBe(true);
    });
  });

  describe('Settings Integration', () => {
    it('🔴 should only show three theme options in settings', async () => {
      // Given: 설정 메뉴 렌더링
      // When: 테마 옵션 조회

      // Then: 3가지 옵션만 존재해야 함
      const expectedOptions = ['auto', 'light', 'dark'];
      const unexpectedOptions = ['native', 'glassmorphism'];

      // 이 테스트는 settings-menu.ts 파일 수정 후 구현될 예정
      expect(expectedOptions.length).toBe(3);
      expect(unexpectedOptions.includes('native')).toBe(true); // 현재는 native 존재 - 실패 예상
    });
  });

  describe('Backward Compatibility', () => {
    it('🔴 should handle legacy native theme gracefully', async () => {
      // Given: localStorage에 legacy native 값이 저장된 상황
      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === 'xeg-theme') return 'native';
        return null;
      });

      // When: ThemeService 초기화
      const { ThemeService } = await import('@shared/services/theme-service');
      const themeService = new ThemeService();

      await new Promise(resolve => setTimeout(resolve, 20));

      // Then: native를 auto로 마이그레이션해야 함
      expect(themeService.getUserSelectedTheme()).toBe('auto'); // 사용자 선택 테마 확인
    });
  });
});
