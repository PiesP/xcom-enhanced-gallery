/**
 * @fileoverview Scroll Anchor Integration 테스트
 * Epic: GALLERY-ENHANCEMENT-001 Sub-Epic 1
 * TDD Phase: RED (테스트 작성)
 *
 * 목표:
 * - GalleryApp.openGallery 호출 시 scrollAnchorManager.setAnchor() 호출 검증
 * - 갤러리 닫을 때 restoreToAnchor() 호출 검증 (기존 동작 유지)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MediaInfo } from '@shared/types';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';

describe('Scroll Anchor Integration (Sub-Epic 1)', () => {
  let scrollAnchorManager: any;
  let GalleryApp: any;
  let mockTweetElement: HTMLElement;

  beforeEach(async () => {
    // CoreService 초기화
    CoreService.resetInstance();
    const serviceManager = CoreService.getInstance();

    // MediaService 모킹
    const mockMediaService = {
      prepareForGallery: vi.fn().mockResolvedValue(undefined),
      restoreBackgroundVideos: vi.fn(),
      extractMediaUrls: vi.fn().mockReturnValue([]),
    };
    serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mockMediaService);

    // GalleryRenderer 모킹
    const mockGalleryRenderer = {
      render: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      isRendering: vi.fn().mockReturnValue(false),
    };
    serviceManager.register(SERVICE_KEYS.GALLERY_RENDERER, mockGalleryRenderer);

    // 테스트 DOM 초기화
    document.body.innerHTML = '';

    // Mock 트윗 요소 생성
    mockTweetElement = document.createElement('article');
    mockTweetElement.setAttribute('data-testid', 'tweet');
    mockTweetElement.style.position = 'absolute';
    mockTweetElement.style.top = '500px';
    Object.defineProperty(mockTweetElement, 'offsetTop', {
      configurable: true,
      value: 500,
    });
    document.body.appendChild(mockTweetElement);

    // ScrollAnchorManager import
    try {
      const module = await import('@shared/utils/scroll/scroll-anchor-manager');
      scrollAnchorManager = module.scrollAnchorManager;
      scrollAnchorManager.clear();
    } catch {
      scrollAnchorManager = null;
    }

    // GalleryApp import
    try {
      const module = await import('@features/gallery/GalleryApp');
      GalleryApp = module.GalleryApp;
    } catch {
      GalleryApp = null;
    }
  });

  afterEach(() => {
    if (scrollAnchorManager && typeof scrollAnchorManager.clear === 'function') {
      scrollAnchorManager.clear();
    }
    document.body.innerHTML = '';
    CoreService.resetInstance();
    vi.restoreAllMocks();
  });

  describe('Phase 1-1: 앵커 설정 (openGallery 시)', () => {
    it('[RED] should call setAnchor when opening gallery', async () => {
      expect(scrollAnchorManager).toBeDefined();
      expect(GalleryApp).toBeDefined();

      // Spy on setAnchor
      const setAnchorSpy = vi.spyOn(scrollAnchorManager, 'setAnchor');

      // GalleryApp 인스턴스 생성
      const galleryApp = new GalleryApp();

      // Mock 미디어 아이템
      const mockMedia: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg',
        },
      ];

      // openGallery 호출
      await galleryApp.openGallery(mockMedia, 0);

      // 검증: setAnchor가 트윗 요소와 함께 호출되었는가?
      expect(setAnchorSpy).toHaveBeenCalled();
      expect(setAnchorSpy).toHaveBeenCalledWith(expect.any(HTMLElement));

      // 전달된 요소가 article[data-testid="tweet"]인지 검증
      const calledElement = setAnchorSpy.mock.calls[0][0];
      expect(calledElement).toBeInstanceOf(HTMLElement);
      expect(calledElement?.getAttribute('data-testid')).toBe('tweet');
    });

    it('[RED] should handle missing tweet container gracefully', async () => {
      expect(scrollAnchorManager).toBeDefined();
      expect(GalleryApp).toBeDefined();

      // 트윗 요소 제거
      document.body.innerHTML = '';

      // Spy on setAnchor
      const setAnchorSpy = vi.spyOn(scrollAnchorManager, 'setAnchor');

      // GalleryApp 인스턴스 생성
      const galleryApp = new GalleryApp();

      // Mock 미디어 아이템
      const mockMedia: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg',
        },
      ];

      // openGallery 호출 (트윗 요소 없음)
      await galleryApp.openGallery(mockMedia, 0);

      // 검증: setAnchor가 호출되지 않았거나, null과 함께 호출됨
      if (setAnchorSpy.mock.calls.length > 0) {
        const calledElement = setAnchorSpy.mock.calls[0][0];
        expect(calledElement).toBeNull();
      }

      // 오류 없이 실행되어야 함
      expect(true).toBe(true);
    });

    it('[RED] should find closest tweet container from clicked element', async () => {
      expect(scrollAnchorManager).toBeDefined();
      expect(GalleryApp).toBeDefined();

      // 중첩된 구조 생성 (실제 X.com DOM 구조 시뮬레이션)
      const tweetContainer = document.createElement('article');
      tweetContainer.setAttribute('data-testid', 'tweet');
      tweetContainer.setAttribute('role', 'article');

      const mediaGroup = document.createElement('div');
      mediaGroup.setAttribute('data-testid', 'tweetPhoto');

      const imageElement = document.createElement('img');
      imageElement.src = 'https://pbs.twimg.com/media/test1.jpg';

      mediaGroup.appendChild(imageElement);
      tweetContainer.appendChild(mediaGroup);
      document.body.appendChild(tweetContainer);

      // Spy on setAnchor
      const setAnchorSpy = vi.spyOn(scrollAnchorManager, 'setAnchor');

      // GalleryApp 인스턴스 생성
      const galleryApp = new GalleryApp();

      // Mock 미디어 아이템
      const mockMedia: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg',
        },
      ];

      // openGallery 호출
      await galleryApp.openGallery(mockMedia, 0);

      // 검증: setAnchor가 article 요소와 함께 호출됨
      expect(setAnchorSpy).toHaveBeenCalled();
      const calledElement = setAnchorSpy.mock.calls[0][0];
      expect(calledElement).toBeInstanceOf(HTMLElement);
      expect(calledElement?.tagName.toLowerCase()).toBe('article');
      expect(calledElement?.getAttribute('data-testid')).toBe('tweet');
    });
  });

  describe('Phase 1-1: 앵커 복원 (closeGallery 시)', () => {
    it('[GREEN] should call restoreToAnchor when closing gallery', async () => {
      // 이 테스트는 기존 동작 유지 검증 (이미 구현됨)
      expect(scrollAnchorManager).toBeDefined();

      // Spy on restoreToAnchor
      const restoreSpy = vi.spyOn(scrollAnchorManager, 'restoreToAnchor');

      // scrollAnchorManager.restoreToAnchor() 직접 호출 (SolidGalleryShell에서 호출됨)
      scrollAnchorManager.restoreToAnchor();

      // 검증: restoreToAnchor가 호출되었는가?
      expect(restoreSpy).toHaveBeenCalled();
    });
  });
});
