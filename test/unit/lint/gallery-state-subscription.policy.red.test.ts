/**
 * @fileoverview Phase 9.21 RED Test - GalleryRenderer isOpen 전용 구독 정책
 * @description setupStateSubscription이 galleryState.isOpen 변경에만 반응하는지 검증
 *
 * RED 테스트 목표:
 * - currentIndex, imageFit 등 다른 속성 변경 시 setupStateSubscription 콜백이 실행되지 않아야 함
 * - isOpen 변경 시에만 콜백이 실행되어야 함
 *
 * Phase 9.21 배경:
 * - 현재 galleryState.subscribe()는 모든 속성 변경에 반응
 * - currentIndex 변경 시에도 콜백 실행 → 전체 갤러리 재렌더링 → ToolbarWithSettings 재생성
 * - 결과: 설정 모달 미표시, 화면 깜빡임
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '@shared/logging';

describe('Phase 9.21 RED: GalleryRenderer isOpen 전용 구독', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 로그 스파이 설정
    logSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('setupStateSubscription 반응성 검증', () => {
    it('[RED] currentIndex 변경 시 콜백이 실행되지 않아야 함', async () => {
      // Phase 9.21: 이 테스트는 현재 FAIL - currentIndex 변경 시에도 콜백 실행됨
      // GREEN 구현 후 PASS로 전환됨

      const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
      const { galleryState, openGallery, navigateNext } = await import(
        '@shared/state/signals/gallery.signals'
      );

      // Arrange: 갤러리 렌더러 생성 및 갤러리 오픈
      const renderer = new GalleryRenderer();
      openGallery([
        { id: '1', type: 'photo' as const, url: 'https://example.com/1.jpg', index: 0 },
        { id: '2', type: 'photo' as const, url: 'https://example.com/2.jpg', index: 1 },
      ]);

      // 갤러리가 오픈될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 50));

      // 로그 스파이 초기화 (isOpen 변경 로그 제거)
      logSpy.mockClear();

      // Act: currentIndex 변경 (navigateNext)
      navigateNext();

      // 변경이 전파될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert: "setupStateSubscription callback 실행" 또는 "isOpen 변경 감지" 로그가 없어야 함
      const callbackLogs = logSpy.mock.calls.filter(
        call =>
          call[0]?.includes('setupStateSubscription callback') ||
          call[0]?.includes('isOpen 변경 감지')
      );

      expect(callbackLogs.length).toBe(0); // currentIndex 변경은 콜백을 트리거하지 않아야 함

      // Cleanup
      renderer.cleanup();
    });

    it('[RED] imageFit 변경 시 콜백이 실행되지 않아야 함', async () => {
      // Phase 9.21: 이 테스트는 현재 FAIL - imageFit 변경 시에도 콜백 실행됨

      const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
      const { openGallery, setImageFit } = await import('@shared/state/signals/gallery.signals');

      // Arrange: 갤러리 렌더러 생성 및 갤러리 오픈
      const renderer = new GalleryRenderer();
      openGallery([
        { id: '1', type: 'photo' as const, url: 'https://example.com/1.jpg', index: 0 },
      ]);

      await new Promise(resolve => setTimeout(resolve, 50));

      // 로그 스파이 초기화
      logSpy.mockClear();

      // Act: imageFit 변경
      setImageFit('contain');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert: "setupStateSubscription callback 실행" 또는 "isOpen 변경 감지" 로그가 없어야 함
      const callbackLogs = logSpy.mock.calls.filter(
        call =>
          call[0]?.includes('setupStateSubscription callback') ||
          call[0]?.includes('isOpen 변경 감지')
      );

      expect(callbackLogs.length).toBe(0); // imageFit 변경은 콜백을 트리거하지 않아야 함

      // Cleanup
      renderer.cleanup();
    });

    it('[GREEN 검증용] isOpen 변경 시에는 콜백이 실행되어야 함', async () => {
      // Phase 9.21: 이 테스트는 GREEN 구현 후에도 PASS 유지되어야 함

      const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
      const { openGallery, closeGallery } = await import('@shared/state/signals/gallery.signals');

      // Arrange: 갤러리 렌더러 생성
      const renderer = new GalleryRenderer();

      // 로그 스파이 초기화
      logSpy.mockClear();

      // Act: isOpen 변경 (openGallery)
      openGallery([
        { id: '1', type: 'photo' as const, url: 'https://example.com/1.jpg', index: 0 },
      ]);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert: "setupStateSubscription callback 실행" 또는 "isOpen 변경 감지" 로그가 있어야 함
      const callbackLogs = logSpy.mock.calls.filter(
        call =>
          call[0]?.includes('setupStateSubscription callback') ||
          call[0]?.includes('isOpen 변경 감지')
      );

      expect(callbackLogs.length).toBeGreaterThan(0); // isOpen 변경은 콜백을 트리거해야 함

      // Cleanup
      closeGallery();
      renderer.cleanup();
    });
  });

  describe('갤러리 재렌더링 방지 검증', () => {
    it('[RED] currentIndex 변경 시 VerticalGalleryView가 재렌더링되지 않아야 함', async () => {
      // Phase 9.21: 현재 FAIL - currentIndex 변경 시 전체 갤러리 재렌더링됨

      const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
      const { openGallery, navigateNext } = await import('@shared/state/signals/gallery.signals');

      // Arrange
      const renderer = new GalleryRenderer();
      openGallery([
        { id: '1', type: 'photo' as const, url: 'https://example.com/1.jpg', index: 0 },
        { id: '2', type: 'photo' as const, url: 'https://example.com/2.jpg', index: 1 },
      ]);

      await new Promise(resolve => setTimeout(resolve, 50));

      // 로그 스파이 초기화
      logSpy.mockClear();

      // Act: currentIndex 변경
      navigateNext();

      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert: "Rendering with state" 로그가 없어야 함 (재렌더링 안 됨)
      const renderLogs = logSpy.mock.calls.filter(call =>
        call[0]?.includes('Rendering with state')
      );

      expect(renderLogs.length).toBe(0); // VerticalGalleryView 재렌더링 안 됨

      // Cleanup
      renderer.cleanup();
    });
  });
});
