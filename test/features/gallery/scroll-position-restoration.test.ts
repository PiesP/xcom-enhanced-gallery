/**
 * @fileoverview 갤러리 스크롤 위치 복원 기능 테스트
 * @description TDD로 갤러리 열기/닫기 시 스크롤 위치 저장/복원 기능 구현
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveScrollPosition,
  restoreScrollPosition,
  clearSavedScrollPosition,
  getSavedScrollPosition,
} from '@shared/browser/utils/browser-utils';
import { openGallery, closeGallery, galleryState } from '@shared/state/signals/gallery.signals';

describe('🔴 RED: 갤러리 스크롤 위치 복원 기능 테스트', () => {
  let originalScrollTo: typeof window.scrollTo;
  let mockScrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // window.scrollTo mock 설정
    originalScrollTo = window.scrollTo;
    mockScrollTo = vi.fn();
    window.scrollTo = mockScrollTo;

    // window.scrollY mock 설정
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    // 갤러리 상태 초기화
    galleryState.value = {
      isOpen: false,
      currentIndex: 0,
      mediaItems: [],
      isLoading: false,
      hasError: false,
      errorMessage: null,
      totalCount: 0,
    };
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    clearSavedScrollPosition();
  });

  describe('스크롤 위치 저장 기능', () => {
    it('현재 스크롤 위치를 저장할 수 있어야 함', () => {
      // Given: 특정 스크롤 위치
      (window as any).scrollY = 500;

      // When: 스크롤 위치 저장
      saveScrollPosition();

      // Then: 저장된 위치를 조회할 수 있어야 함
      const savedPosition = getSavedScrollPosition();
      expect(savedPosition).toBe(500);
    });

    it('스크롤 위치를 여러 번 저장하면 최신 값이 유지되어야 함', () => {
      // Given: 첫 번째 스크롤 위치
      (window as any).scrollY = 300;
      saveScrollPosition();

      // When: 두 번째 스크롤 위치 저장
      (window as any).scrollY = 800;
      saveScrollPosition();

      // Then: 최신 값이 저장되어야 함
      const savedPosition = getSavedScrollPosition();
      expect(savedPosition).toBe(800);
    });
  });

  describe('스크롤 위치 복원 기능', () => {
    it('저장된 스크롤 위치로 복원할 수 있어야 함', () => {
      // Given: 스크롤 위치 저장
      (window as any).scrollY = 600;
      saveScrollPosition();

      // When: 스크롤 위치 복원
      restoreScrollPosition();

      // Then: window.scrollTo가 저장된 위치로 호출되어야 함
      expect(mockScrollTo).toHaveBeenCalledWith(0, 600);
    });

    it('저장된 위치가 없으면 복원하지 않아야 함', () => {
      // Given: 저장된 위치가 없음
      clearSavedScrollPosition();

      // When: 복원 시도
      restoreScrollPosition();

      // Then: scrollTo가 호출되지 않아야 함
      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('갤러리 열기/닫기와 스크롤 위치 연동', () => {
    const mockMediaItems = [
      { url: 'https://example.com/image1.jpg', type: 'image' as const },
      { url: 'https://example.com/image2.jpg', type: 'image' as const },
    ];

    it('갤러리 열기 시 현재 스크롤 위치가 자동 저장되어야 함', () => {
      // Given: 특정 스크롤 위치
      (window as any).scrollY = 750;

      // When: 갤러리 열기
      openGallery(mockMediaItems, 0);

      // Then: 스크롤 위치가 저장되어야 함
      const savedPosition = getSavedScrollPosition();
      expect(savedPosition).toBe(750);
      expect(galleryState.value.isOpen).toBe(true);
    });

    it('갤러리 닫기 시 저장된 스크롤 위치로 자동 복원되어야 함', () => {
      // Given: 갤러리가 열려있고 스크롤 위치가 저장됨
      (window as any).scrollY = 950;
      openGallery(mockMediaItems, 0);

      // When: 갤러리 닫기
      closeGallery();

      // Then: 저장된 위치로 복원되어야 함
      expect(mockScrollTo).toHaveBeenCalledWith(0, 950);
      expect(galleryState.value.isOpen).toBe(false);
    });

    it('갤러리를 여러 번 열고 닫아도 스크롤 위치가 정확히 복원되어야 함', () => {
      // Given: 첫 번째 갤러리 세션
      (window as any).scrollY = 100;
      openGallery(mockMediaItems, 0);
      closeGallery();

      // When: 두 번째 갤러리 세션 - 다른 스크롤 위치에서 시작
      mockScrollTo.mockClear();
      (window as any).scrollY = 500;
      openGallery(mockMediaItems, 1);
      closeGallery();

      // Then: 두 번째 세션의 스크롤 위치로 복원되어야 함
      expect(mockScrollTo).toHaveBeenCalledWith(0, 500);
    });
  });

  describe('에러 처리', () => {
    it('window.scrollTo가 없어도 에러가 발생하지 않아야 함', () => {
      // Given: window.scrollTo가 없는 환경
      window.scrollTo = undefined as any;

      // When & Then: 에러 없이 실행되어야 함
      expect(() => {
        saveScrollPosition();
        restoreScrollPosition();
      }).not.toThrow();
    });

    it('비정상적인 스크롤 값도 안전하게 처리해야 함', () => {
      // Given: 비정상적인 scrollY 값
      (window as any).scrollY = NaN;

      // When & Then: 에러 없이 실행되어야 함
      expect(() => {
        saveScrollPosition();
      }).not.toThrow();
    });
  });
});
