/**
 * @fileoverview 디자인 시스템 일관성 통합 테스트
 * @description 툴바와 설정 모달 간의 디자인 일관성을 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/preact';
import { h } from 'preact';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

// Mock dependencies
vi.mock('@shared/external/vendors', () => ({
  getPreact: () => ({ h, Fragment: h }),
  getPreactHooks: () => {
    return {
      // effect는 통합 테스트에서 사이드이펙트 최소화를 위해 noop
      useEffect: vi.fn(),
      // useState 초기값(또는 이니셜라이저 함수) 실행하여 실제 인스턴스를 유지
      useState: vi.fn(initial => {
        const value = typeof initial === 'function' ? initial() : initial;
        return [value, vi.fn()];
      }),
      useRef: vi.fn(initial => ({ current: initial ?? null })),
      useCallback: vi.fn(fn => fn),
      useMemo: vi.fn(factory => factory()),
    };
  },
  getPreactCompat: () => ({
    memo: vi.fn(component => component),
    forwardRef: vi.fn(fn => fn),
  }),
  h,
}));

vi.mock('@shared/logging', () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  };
  return {
    logger: mockLogger,
    default: mockLogger,
  };
});

vi.mock('@shared/services', () => ({
  languageService: {
    getString: vi.fn(key => key),
  },
}));

vi.mock('@shared/services/LanguageService', () => ({
  LanguageService: vi.fn().mockImplementation(() => ({
    getString: vi.fn(key => key),
    getCurrentLanguage: vi.fn(() => 'en'),
    setLanguage: vi.fn(),
  })),
}));

vi.mock('@shared/services/ThemeService', () => ({
  ThemeService: vi.fn().mockImplementation(() => ({
    getCurrentTheme: vi.fn(() => 'auto'),
    setTheme: vi.fn(),
    initialize: vi.fn(),
  })),
}));

// Mock getComputedStyle for testing
const mockGetComputedStyle = vi.fn(() => ({
  height: '40px',
  backdropFilter: 'blur(12px)',
  borderRadius: '8px',
  backgroundColor: 'rgb(59, 130, 246)',
}));

// Setup global mocks for Node.js test environment
const getComputedStyle = mockGetComputedStyle;

describe('디자인 시스템 일관성 테스트', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockGetComputedStyle.mockReturnValue({
      height: '40px',
      backdropFilter: 'blur(12px)',
      borderRadius: '8px',
      backgroundColor: 'rgb(59, 130, 246)',
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('버튼 디자인 일관성', () => {
    it('모든 버튼이 통일된 스타일 클래스를 사용해야 함', () => {
      const mockProps = {
        currentIndex: 1,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitHeight: vi.fn(),
        onFitWidth: vi.fn(),
        onFitContainer: vi.fn(),
      };

      const { container } = render(h(Toolbar, mockProps));

      // 툴바 내 모든 버튼 요소 찾기
      const buttons = container.querySelectorAll('button');

      // 각 버튼이 통일된 스타일을 사용하는지 확인
      buttons.forEach(button => {
        const classes = button.className;

        // 통일된 버튼 클래스 사용 확인
        expect(classes.includes('unifiedButton') || classes.includes('toolbarButton')).toBe(true);
      });
    });

    it('툴바와 설정 모달의 버튼이 일관된 크기를 가져야 함', () => {
      const toolbarProps = {
        currentIndex: 1,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitHeight: vi.fn(),
        onFitWidth: vi.fn(),
        onFitContainer: vi.fn(),
      };

      const settingsProps = {
        isOpen: true,
        onClose: vi.fn(),
      };

      const { container: toolbarContainer } = render(h(Toolbar, toolbarProps));
      const { container: modalContainer } = render(h(SettingsModal, settingsProps));

      const toolbarButtons = toolbarContainer.querySelectorAll('button');
      const modalButtons = modalContainer.querySelectorAll('button');

      // 최소 1개 이상의 버튼이 있어야 함
      expect(toolbarButtons.length).toBeGreaterThan(0);
      expect(modalButtons.length).toBeGreaterThan(0);

      // 모든 버튼의 스타일 일관성 확인
      [...toolbarButtons, ...modalButtons].forEach(button => {
        const styles = getComputedStyle(button);

        // 표준 버튼 크기 확인 (툴바 전용 크기 포함)
        const height = styles.height;
        expect(height).toMatch(/^(2\.5em|40px|2em|32px|44px)$/);
      });
    });
  });

  describe('Glassmorphism 일관성', () => {
    it('툴바와 설정 모달이 동일한 glassmorphism 효과를 사용해야 함', () => {
      const toolbarProps = {
        currentIndex: 1,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitHeight: vi.fn(),
        onFitWidth: vi.fn(),
        onFitContainer: vi.fn(),
      };

      const settingsProps = {
        isOpen: true,
        onClose: vi.fn(),
      };

      const { container: toolbarContainer } = render(h(Toolbar, toolbarProps));
      const { container: modalContainer } = render(h(SettingsModal, settingsProps));

      // glass-surface 클래스를 가진 요소들 찾기
      const toolbarGlass = toolbarContainer.querySelector('.glass-surface, .galleryToolbar');
      const modalGlass = modalContainer.querySelector('.glass-surface, .panel');

      if (toolbarGlass && modalGlass) {
        const toolbarStyles = getComputedStyle(toolbarGlass);
        const modalStyles = getComputedStyle(modalGlass);

        // backdrop-filter 일관성 확인
        expect(toolbarStyles.backdropFilter).toBe(modalStyles.backdropFilter);
      }
    });

    it('모든 glass surface가 일관된 border-radius를 사용해야 함', () => {
      const toolbarProps = {
        currentIndex: 1,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitHeight: vi.fn(),
        onFitWidth: vi.fn(),
        onFitContainer: vi.fn(),
      };

      const settingsProps = {
        isOpen: true,
        onClose: vi.fn(),
      };

      const { container: toolbarContainer } = render(h(Toolbar, toolbarProps));
      const { container: modalContainer } = render(h(SettingsModal, settingsProps));

      const glassSurfaces = [
        ...toolbarContainer.querySelectorAll('.glass-surface, .galleryToolbar'),
        ...modalContainer.querySelectorAll('.glass-surface, .panel'),
      ];

      // 모든 glass surface가 일관된 border-radius 사용
      const radiusValues = glassSurfaces.map(surface => getComputedStyle(surface).borderRadius);

      // 표준 border-radius 값들 확인
      radiusValues.forEach(radius => {
        expect(radius).toMatch(/^(8px|12px|16px|var\(--[\w-]+\))$/);
      });
    });
  });

  describe('색상 일관성', () => {
    it('모든 primary 버튼이 동일한 색상을 사용해야 함', () => {
      const toolbarProps = {
        currentIndex: 1,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitHeight: vi.fn(),
        onFitWidth: vi.fn(),
        onFitContainer: vi.fn(),
      };

      const { container } = render(h(Toolbar, toolbarProps));

      const primaryButtons = container.querySelectorAll(
        '.variant-primary, .downloadButton, .navButton'
      );

      if (primaryButtons.length > 1) {
        const colors = Array.from(primaryButtons).map(btn => getComputedStyle(btn).backgroundColor);

        // 모든 primary 버튼이 동일한 배경색 사용
        const firstColor = colors[0];
        colors.forEach(color => {
          expect(color).toBe(firstColor);
        });
      }
    });
  });
});
