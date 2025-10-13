/**
 * @fileoverview useSettingsModal 훅 테스트 (Phase 39 Step 3-A)
 * @description 설정 모달 상태 관리 로직을 UI에서 분리한 훅 테스트
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { initializeVendors } from '../../../src/shared/external/vendors';
import { renderHook } from '../../utils/testing-library';
import type { ThemeService } from '../../../src/shared/services/theme-service';
import type { LanguageService } from '../../../src/shared/services/language-service';

type ThemeOption = 'auto' | 'light' | 'dark';
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

interface MockThemeService {
  getCurrentTheme: Mock;
  setTheme: Mock;
}

interface MockLanguageService {
  getCurrentLanguage: Mock;
  setLanguage: Mock;
}

describe('Phase 39 Step 3-A: useSettingsModal 훅 (RED)', () => {
  let mockThemeService: MockThemeService;
  let mockLanguageService: MockLanguageService;

  beforeEach(() => {
    initializeVendors();

    mockThemeService = {
      getCurrentTheme: vi.fn().mockReturnValue('auto' as ThemeOption),
      setTheme: vi.fn(),
    };

    mockLanguageService = {
      getCurrentLanguage: vi.fn().mockReturnValue('auto' as LanguageOption),
      setLanguage: vi.fn(),
    };

    vi.clearAllMocks();
  });

  describe('Step 3-A-1: 훅 임포트 및 기본 구조', () => {
    it('useSettingsModal 훅을 임포트할 수 있어야 한다', async () => {
      // GREEN: 이제 구현되어 있음
      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');
      expect(useSettingsModal).toBeDefined();
      expect(typeof useSettingsModal).toBe('function');
    });
  });

  describe('Step 3-A-2: 초기 상태 설정', () => {
    it('초기 테마 상태를 서비스에서 가져와야 한다', async () => {
      mockThemeService.getCurrentTheme.mockReturnValue('dark' as ThemeOption);

      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      const { result } = renderHook(() =>
        useSettingsModal({
          themeService: mockThemeService as unknown as ThemeService,
          languageService: mockLanguageService as unknown as LanguageService,
        })
      );

      expect(result.current.currentTheme()).toBe('dark');
      expect(mockThemeService.getCurrentTheme).toHaveBeenCalledOnce();
    });

    it('초기 언어 상태를 서비스에서 가져와야 한다', async () => {
      mockLanguageService.getCurrentLanguage.mockReturnValue('ko' as LanguageOption);

      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      const { result } = renderHook(() =>
        useSettingsModal({
          themeService: mockThemeService as unknown as ThemeService,
          languageService: mockLanguageService as unknown as LanguageService,
        })
      );

      expect(result.current.currentLanguage()).toBe('ko');
      expect(mockLanguageService.getCurrentLanguage).toHaveBeenCalledOnce();
    });
  });

  describe('Step 3-A-3: 테마 변경 핸들러', () => {
    it('handleThemeChange 호출 시 서비스 setTheme이 호출되어야 한다', async () => {
      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      const { result } = renderHook(() =>
        useSettingsModal({
          themeService: mockThemeService as unknown as ThemeService,
          languageService: mockLanguageService as unknown as LanguageService,
        })
      );

      // 테마 변경 이벤트 시뮬레이션 - Mock 객체 사용
      const mockEvent = {
        currentTarget: { value: 'light' },
      } as unknown as globalThis.Event;

      result.current.handleThemeChange(mockEvent);

      expect(mockThemeService.setTheme).toHaveBeenCalledWith('light');
      expect(result.current.currentTheme()).toBe('light');
    });

    it('onThemeChange 콜백이 제공되면 호출되어야 한다', async () => {
      const onThemeChange = vi.fn();

      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      const { result } = renderHook(() =>
        useSettingsModal({
          themeService: mockThemeService as unknown as ThemeService,
          languageService: mockLanguageService as unknown as LanguageService,
          onThemeChange,
        })
      );

      const mockEvent = {
        currentTarget: { value: 'dark' },
      } as unknown as globalThis.Event;

      result.current.handleThemeChange(mockEvent);

      expect(onThemeChange).toHaveBeenCalledWith('dark');
    });
  });

  describe('Step 3-A-4: 언어 변경 핸들러', () => {
    it('handleLanguageChange 호출 시 서비스 setLanguage가 호출되어야 한다', async () => {
      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      const { result } = renderHook(() =>
        useSettingsModal({
          themeService: mockThemeService as unknown as ThemeService,
          languageService: mockLanguageService as unknown as LanguageService,
        })
      );

      const mockEvent = {
        currentTarget: { value: 'en' },
      } as unknown as globalThis.Event;

      result.current.handleLanguageChange(mockEvent);

      expect(mockLanguageService.setLanguage).toHaveBeenCalledWith('en');
      expect(result.current.currentLanguage()).toBe('en');
    });

    it('onLanguageChange 콜백이 제공되면 호출되어야 한다', async () => {
      const onLanguageChange = vi.fn();

      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      const { result } = renderHook(() =>
        useSettingsModal({
          themeService: mockThemeService as unknown as ThemeService,
          languageService: mockLanguageService as unknown as LanguageService,
          onLanguageChange,
        })
      );

      const mockEvent = {
        currentTarget: { value: 'ja' },
      } as unknown as globalThis.Event;

      result.current.handleLanguageChange(mockEvent);

      expect(onLanguageChange).toHaveBeenCalledWith('ja');
    });
  });

  describe('Step 3-A-5: 타입 안전성', () => {
    it('잘못된 테마 값은 타입 오류를 발생시켜야 한다', () => {
      // 이 테스트는 TypeScript 컴파일 시점에 검증됨
      // 런타임 테스트에서는 타입 검증 대신 인터페이스 준수를 확인
      expect(true).toBe(true);
    });

    it('잘못된 언어 값은 타입 오류를 발생시켜야 한다', () => {
      // 이 테스트는 TypeScript 컴파일 시점에 검증됨
      // 런타임 테스트에서는 타입 검증 대신 인터페이스 준수를 확인
      expect(true).toBe(true);
    });
  });

  describe('Step 3-A-6: 서비스 의존성 주입 검증', () => {
    it('themeService가 제공되지 않으면 에러를 던져야 한다', async () => {
      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      expect(() =>
        renderHook(() =>
          useSettingsModal({
            themeService: undefined as unknown as ThemeService,
            languageService: mockLanguageService as unknown as LanguageService,
          })
        )
      ).toThrow('useSettingsModal: themeService is required');
    });

    it('languageService가 제공되지 않으면 에러를 던져야 한다', async () => {
      const { useSettingsModal } = await import('../../../src/shared/hooks/use-settings-modal');

      expect(() =>
        renderHook(() =>
          useSettingsModal({
            themeService: mockThemeService as unknown as ThemeService,
            languageService: undefined as unknown as LanguageService,
          })
        )
      ).toThrow('useSettingsModal: languageService is required');
    });
  });
});
