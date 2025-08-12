/**
 * @fileoverview 툴바 배경 가시성 문제 해결을 위한 테스트
 * @description TDD 방식으로 툴바 배경이 항상 보이도록 하는 기능 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { getPreact } from '@shared/external/vendors';

// JSX를 위한 React import
const { h } = getPreact();

describe('VerticalGalleryView - 툴바 배경 가시성', () => {
  beforeEach(() => {
    // 갤러리 상태 초기화
    galleryState.value = {
      mediaItems: [
        { id: '1', url: 'https://example.com/image1.jpg', type: 'image' as const },
        { id: '2', url: 'https://example.com/image2.jpg', type: 'image' as const },
      ],
      currentIndex: 0,
      isLoading: false,
      isSettingsOpen: false,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('RED: 현재 실패하는 테스트들 - 툴바 배경 투명성 문제', () => {
    it('툴바 컨테이너가 기본적으로 투명하지 않은 배경을 가져야 한다', () => {
      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');
      const computedStyle = window.getComputedStyle(toolbarContainer);

      // 현재는 실패할 것으로 예상 - 배경이 transparent이기 때문
      expect(computedStyle.background).not.toBe('transparent');
      expect(computedStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(computedStyle.backgroundColor).not.toBe('');
    });

    it('툴바가 렌더링될 때 항상 배경이 있어야 한다', () => {
      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');

      // 툴바가 표시되는지 확인
      expect(toolbarContainer).toBeInTheDocument();

      // 배경 스타일이 적용되었는지 확인 (호버 없이도)
      const computedStyle = window.getComputedStyle(toolbarContainer);

      // 현재는 실패 - 기본 상태에서 배경이 없음
      expect(computedStyle.background).toContain('gradient');
      expect(computedStyle.backdropFilter).not.toBe('');
    });

    it('마우스 호버 없이도 툴바 배경이 보여야 한다', () => {
      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');

      // 호버하지 않은 상태에서도 배경이 있어야 함
      const initialStyle = window.getComputedStyle(toolbarContainer);

      // 현재는 실패 - 호버하지 않으면 투명
      expect(initialStyle.background).not.toBe('transparent');
      expect(initialStyle.backdropFilter).toBeTruthy();
    });
  });

  describe('GREEN: 수정 후 통과해야 할 테스트들', () => {
    it('툴바 컨테이너가 적절한 배경 스타일을 가져야 한다', () => {
      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');
      const computedStyle = window.getComputedStyle(toolbarContainer);

      // 수정 후에는 통과해야 함
      expect(computedStyle.background).toMatch(/gradient|rgba|rgb/);
    });

    it('툴바 배경이 사용자에게 즉시 보여야 한다', () => {
      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');

      // 툴바가 즉시 보이고 배경이 있어야 함
      expect(toolbarContainer).toBeVisible();

      const style = window.getComputedStyle(toolbarContainer);
      expect(style.opacity).not.toBe('0');
      expect(style.visibility).not.toBe('hidden');
    });

    it('호버 시 추가적인 스타일 효과가 적용되어야 한다', () => {
      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');

      // 기본 상태의 스타일
      const initialStyle = window.getComputedStyle(toolbarContainer);
      const initialBackground = initialStyle.background;

      // 호버
      fireEvent.mouseEnter(toolbarContainer);

      const hoverStyle = window.getComputedStyle(toolbarContainer);

      // 호버 시 스타일이 변경되어야 함 (기본 배경에서 향상된 배경으로)
      expect(hoverStyle.background).toBeTruthy();
      // 호버 시에는 더 강한 효과가 있어야 함
      expect(hoverStyle.backdropFilter).toBeTruthy();
    });
  });

  describe('접근성 및 사용성 테스트', () => {
    it('키보드 네비게이션으로 툴바에 접근할 때도 배경이 보여야 한다', () => {
      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');

      // 포커스 이벤트
      fireEvent.focus(toolbarContainer);

      const focusStyle = window.getComputedStyle(toolbarContainer);
      expect(focusStyle.background).not.toBe('transparent');
    });

    it('다양한 화면 크기에서 툴바 배경이 보여야 한다', () => {
      // 모바일 크기
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<VerticalGalleryView />);

      const toolbarContainer = screen.getByTestId('toolbar-container');
      const style = window.getComputedStyle(toolbarContainer);

      expect(style.background).not.toBe('transparent');
    });
  });
});
