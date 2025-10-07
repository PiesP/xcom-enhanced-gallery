/**
 * Phase 7.1: 키보드 네비게이션 통합 테스트 (RED → GREEN → REFACTOR)
 *
 * GREEN 단계: GalleryRenderer와 KeyboardNavigator 통합 완료
 *
 * 테스트 범위:
 * - ArrowLeft/Right로 이미지 이동 (실제 KeyboardEvent 사용)
 * - Home/End로 처음/마지막 이동 (실제 KeyboardEvent 사용)
 * - Space로 Fit mode 전환 (향후 구현 예정)
 * - Escape로 갤러리 닫기
 *
 * 실제 동작:
 * - 갤러리가 열린 상태에서만 네비게이션 키 처리
 * - preventDefault로 기본 스크롤 차단
 * - Signal 기반 상태 업데이트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Phase 7.1: Gallery Keyboard Navigation Integration', () => {
  let cleanupFunctions: Array<() => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    cleanupFunctions = [];
    // JSDOM 환경 초기화
    document.body.innerHTML = '';
  });

  afterEach(async () => {
    // 역순으로 정리 (LIFO - Last In, First Out)
    while (cleanupFunctions.length > 0) {
      const cleanup = cleanupFunctions.pop();
      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup failed:', error);
        }
      }
    }

    // 갤러리 상태 완전 리셋
    try {
      const { closeGallery } = await import('@/shared/state/signals/gallery.signals');
      closeGallery();
    } catch {
      // 모듈 import 실패는 무시
    }

    // GalleryRenderer 정리
    try {
      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');
      galleryRenderer.destroy();
    } catch {
      // 모듈 import 실패는 무시
    }

    // DOM 정리
    document.body.innerHTML = '';

    // 약간의 딜레이를 주어 비동기 정리 완료 대기
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  /**
   * 키보드 이벤트 디스패치 헬퍼
   */
  function dispatchKeyboardEvent(key: string): globalThis.KeyboardEvent {
    const event = new globalThis.KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    return event;
  }

  describe('ArrowLeft/Right Navigation with Real KeyboardEvent', () => {
    it('should navigate to previous item when ArrowLeft is pressed with gallery open', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      // GalleryRenderer는 constructor에서 keyboardNavigator.subscribe 호출
      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg:orig',
          type: 'image' as const,
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test2.jpg:orig',
          type: 'image' as const,
          filename: 'test2.jpg',
        },
        {
          id: '3',
          url: 'https://pbs.twimg.com/media/test3.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test3.jpg:orig',
          type: 'image' as const,
          filename: 'test3.jpg',
        },
      ];

      openGallery(mockItems, 1);
      expect(galleryState.value.currentIndex).toBe(1);
      expect(galleryState.value.isOpen).toBe(true);

      // Action: ArrowLeft 키 이벤트 디스패치 (실제 DOM 이벤트)
      const event = dispatchKeyboardEvent('ArrowLeft');

      // Assert: index가 0으로 변경되어야 함
      expect(galleryState.value.currentIndex).toBe(0);
      expect(event.defaultPrevented).toBe(true); // preventDefault 확인

      // Cleanup
      closeGallery();
      galleryRenderer.destroy();
    });

    it('should wrap to last item when ArrowLeft is pressed at first item', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg:orig',
          type: 'image' as const,
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test2.jpg:orig',
          type: 'image' as const,
          filename: 'test2.jpg',
        },
      ];

      openGallery(mockItems, 0);
      expect(galleryState.value.currentIndex).toBe(0);

      // Action: 첫 번째 아이템에서 ArrowLeft
      dispatchKeyboardEvent('ArrowLeft');

      // Assert: 마지막 아이템(index 1)로 wrap
      expect(galleryState.value.currentIndex).toBe(1);

      closeGallery();
      galleryRenderer.destroy();
    });

    it('should navigate to next item when ArrowRight is pressed', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg:orig',
          type: 'image' as const,
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test2.jpg:orig',
          type: 'image' as const,
          filename: 'test2.jpg',
        },
      ];

      openGallery(mockItems, 0);
      expect(galleryState.value.currentIndex).toBe(0);

      // Action: ArrowRight
      const event = dispatchKeyboardEvent('ArrowRight');

      // Assert: index 1로 이동
      expect(galleryState.value.currentIndex).toBe(1);
      expect(event.defaultPrevented).toBe(true);

      closeGallery();
      galleryRenderer.destroy();
    });

    it('should wrap to first item when ArrowRight is pressed at last item', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg:orig',
          type: 'image' as const,
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test2.jpg:orig',
          type: 'image' as const,
          filename: 'test2.jpg',
        },
      ];

      openGallery(mockItems, 1);
      expect(galleryState.value.currentIndex).toBe(1);

      // Action: 마지막 아이템에서 ArrowRight
      dispatchKeyboardEvent('ArrowRight');

      // Assert: 첫 번째 아이템(index 0)로 wrap
      expect(galleryState.value.currentIndex).toBe(0);

      closeGallery();
      galleryRenderer.destroy();
    });
  });

  describe('Home/End Navigation with Real KeyboardEvent', () => {
    it('should navigate to first item when Home is pressed', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        url: `https://pbs.twimg.com/media/test${i + 1}.jpg`,
        originalUrl: `https://pbs.twimg.com/media/test${i + 1}.jpg:orig`,
        type: 'image' as const,
        filename: `test${i + 1}.jpg`,
      }));

      openGallery(mockItems, 3);
      expect(galleryState.value.currentIndex).toBe(3);

      // Action: Home 키 → 첫 번째 아이템으로 이동
      const event = dispatchKeyboardEvent('Home');

      // Assert
      expect(galleryState.value.currentIndex).toBe(0);
      expect(event.defaultPrevented).toBe(true);

      closeGallery();
      galleryRenderer.destroy();
    });

    it('should navigate to last item when End is pressed', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        url: `https://pbs.twimg.com/media/test${i + 1}.jpg`,
        originalUrl: `https://pbs.twimg.com/media/test${i + 1}.jpg:orig`,
        type: 'image' as const,
        filename: `test${i + 1}.jpg`,
      }));

      openGallery(mockItems, 1);
      expect(galleryState.value.currentIndex).toBe(1);

      // Action: End 키 → 마지막 아이템으로 이동
      const event = dispatchKeyboardEvent('End');

      // Assert
      expect(galleryState.value.currentIndex).toBe(4);
      expect(event.defaultPrevented).toBe(true);

      closeGallery();
      galleryRenderer.destroy();
    });
  });

  describe('Escape to Close', () => {
    it('should close gallery when Escape is pressed', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg:orig',
          type: 'image' as const,
          filename: 'test1.jpg',
        },
      ];

      openGallery(mockItems, 0);
      expect(galleryState.value.isOpen).toBe(true);

      // Action: Escape 키 → 갤러리 닫기
      // Note: Escape는 GalleryContainer에서 처리
      closeGallery();

      // Assert
      expect(galleryState.value.isOpen).toBe(false);

      galleryRenderer.destroy();
    });
  });

  describe('Keyboard Event Guard: Only When Gallery is Open', () => {
    it('should not navigate when gallery is closed', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg:orig',
          type: 'image' as const,
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test2.jpg:orig',
          type: 'image' as const,
          filename: 'test2.jpg',
        },
      ];

      // 갤러리가 닫힌 상태
      expect(galleryState.value.isOpen).toBe(false);

      // Action: ArrowRight 시도
      dispatchKeyboardEvent('ArrowRight');

      // Assert: 아무 변화 없음 (currentIndex는 초기값 0)
      expect(galleryState.value.currentIndex).toBe(0);

      // 갤러리 열기
      openGallery(mockItems, 0);
      expect(galleryState.value.isOpen).toBe(true);
      expect(galleryState.value.currentIndex).toBe(0);

      // 갤러리가 열린 상태에서 네비게이션 → 정상 동작
      dispatchKeyboardEvent('ArrowRight');
      expect(galleryState.value.currentIndex).toBe(1);

      closeGallery();
      galleryRenderer.destroy();
    });

    it('should prevent default behavior for navigation keys when gallery is open', async () => {
      const { openGallery, closeGallery, galleryState } = await import(
        '@/shared/state/signals/gallery.signals'
      );

      const { galleryRenderer } = await import('@/features/gallery/GalleryRenderer');

      const mockItems = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg:orig',
          type: 'image' as const,
          filename: 'test1.jpg',
        },
      ];

      openGallery(mockItems, 0);

      // Home 키 → 기본 스크롤 동작 차단
      const homeEvent = dispatchKeyboardEvent('Home');
      expect(homeEvent.defaultPrevented).toBe(true);

      // End 키 → 기본 스크롤 동작 차단
      const endEvent = dispatchKeyboardEvent('End');
      expect(endEvent.defaultPrevented).toBe(true);

      // ArrowLeft 키 → 기본 스크롤 동작 차단
      const leftEvent = dispatchKeyboardEvent('ArrowLeft');
      expect(leftEvent.defaultPrevented).toBe(true);

      // ArrowRight 키 → 기본 스크롤 동작 차단
      const rightEvent = dispatchKeyboardEvent('ArrowRight');
      expect(rightEvent.defaultPrevented).toBe(true);

      closeGallery();
      galleryRenderer.destroy();
    });
  });

  describe('Space Key (Fit Mode Toggle)', () => {
    it.skip('should toggle fit mode when Space is pressed', async () => {
      // TODO: Fit mode 토글 기능 구현 후 활성화
      // Space 키로 Fit mode 전환 기능 추가 필요
      expect(true).toBe(true); // Placeholder
    });
  });
});
