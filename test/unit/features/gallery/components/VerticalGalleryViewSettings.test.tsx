/**
 * @fileoverview VerticalGalleryView 설정 모달 통합 테스트
 * @description TDD 기반 설정 모달 통합 테스트
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/preact';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';

// VerticalGalleryView의 모든 의존성을 모킹
vi.mock('@shared/state/signals/gallery.signals', () => ({
  galleryState: {
    value: {
      isVisible: true,
      currentIndex: 0,
      mediaItems: [
        {
          id: 'test-1',
          url: 'https://example.com/image1.jpg',
          type: 'image',
          alt: 'Test Image 1',
        },
        {
          id: 'test-2',
          url: 'https://example.com/image2.jpg',
          type: 'image',
          alt: 'Test Image 2',
        },
      ],
      isDownloading: false,
    },
    subscribe: vi.fn(callback => {
      // 즉시 현재 상태로 콜백 호출
      callback({
        isVisible: true,
        currentIndex: 0,
        mediaItems: [
          {
            id: 'test-1',
            url: 'https://example.com/image1.jpg',
            type: 'image',
            alt: 'Test Image 1',
          },
          {
            id: 'test-2',
            url: 'https://example.com/image2.jpg',
            type: 'image',
            alt: 'Test Image 2',
          },
        ],
        isDownloading: false,
      });
      return vi.fn(); // unsubscribe 함수
    }),
  },
  navigateToItem: vi.fn(),
}));

vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/utils/animations', () => ({
  animateGalleryEnter: vi.fn(),
  animateGalleryExit: vi.fn(),
  setupScrollAnimation: vi.fn(),
}));

vi.mock('@shared/utils', () => ({
  ensureGalleryScrollAvailable: vi.fn(),
  stringWithDefault: vi.fn((value, defaultValue) => value || defaultValue),
  throttleScroll: vi.fn(callback => callback),
}));

vi.mock('@features/gallery/hooks', () => ({
  useToolbarPositionBased: vi.fn(() => ({
    isVisible: true,
    show: vi.fn(),
    hide: vi.fn(),
  })),
}));

vi.mock('@features/gallery/hooks/useGalleryScroll', () => ({
  useGalleryScroll: vi.fn(() => ({
    scrollToTop: vi.fn(),
    scrollToBottom: vi.fn(),
    scrollToIndex: vi.fn(),
  })),
}));

vi.mock('@features/gallery/hooks/useGalleryItemScroll', () => ({
  useGalleryItemScroll: vi.fn(() => ({
    scrollToItem: vi.fn(),
  })),
}));

vi.mock('./hooks/useGalleryCleanup', () => ({
  useGalleryCleanup: vi.fn(),
}));

vi.mock('./hooks/useGalleryKeyboard', () => ({
  useGalleryKeyboard: vi.fn(),
}));

describe('VerticalGalleryView - Settings Integration', () => {
  const mockProps = {
    onClose: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('설정 버튼 통합', () => {
    it('툴바에 설정 버튼이 표시되어야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      const settingsButton = screen.getByLabelText('설정 열기');
      expect(settingsButton).toBeDefined();
      expect(settingsButton.tagName).toBe('BUTTON');
    });

    it('설정 버튼 클릭 시 SettingsModal이 열려야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // SettingsModal이 열렸는지 확인
      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();
      expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    it('SettingsModal이 올바른 내용을 표시해야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // 설정 모달의 내용 확인
      expect(screen.getByText('Settings')).toBeDefined();
      expect(screen.getByText('Theme')).toBeDefined();
      expect(screen.getByText('Language')).toBeDefined();
    });

    it('SettingsModal 닫기 버튼 클릭 시 모달이 닫혀야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      // 설정 모달 열기
      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // 모달이 열렸는지 확인
      expect(screen.getByRole('dialog')).toBeDefined();

      // 닫기 버튼 클릭
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // 모달이 닫혔는지 확인
      expect(() => screen.getByRole('dialog')).toThrow();
    });

    it('SettingsModal 배경 클릭 시 모달이 닫혀야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      // 설정 모달 열기
      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // 모달이 열렸는지 확인
      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();

      // 배경 클릭 (모달 자체 클릭)
      fireEvent.click(modal);

      // 모달이 닫혔는지 확인
      expect(() => screen.getByRole('dialog')).toThrow();
    });

    it('ESC 키 입력 시 SettingsModal이 닫혀야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      // 설정 모달 열기
      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // 모달이 열렸는지 확인
      expect(screen.getByRole('dialog')).toBeDefined();

      // ESC 키 입력
      fireEvent.keyDown(document, { key: 'Escape' });

      // 모달이 닫혔는지 확인
      expect(() => screen.getByRole('dialog')).toThrow();
    });
  });

  describe('설정 기능 통합', () => {
    it('테마 변경이 즉시 적용되어야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      // 설정 모달 열기
      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // 테마 선택 변경
      const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement;
      fireEvent.change(themeSelect, { target: { value: 'dark' } });

      // 변경이 즉시 적용되는지 확인
      expect(themeSelect.value).toBe('dark');
    });

    it('언어 변경이 즉시 적용되어야 함', () => {
      render(<VerticalGalleryView {...mockProps} />);

      // 설정 모달 열기
      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // 언어 선택 변경
      const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
      fireEvent.change(languageSelect, { target: { value: 'ko' } });

      // 변경이 즉시 적용되는지 확인
      expect(languageSelect.value).toBe('ko');
    });
  });
});
