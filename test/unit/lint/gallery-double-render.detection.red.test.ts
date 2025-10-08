/**
 * @fileoverview RED 테스트: 갤러리 이중 렌더링 감지
 * @phase Phase 9.17 - GALLERY-DOUBLE-RENDER-FIX
 *
 * 목적:
 * - 갤러리가 단일 openGallery() 호출에 대해 1번만 렌더링되는지 검증
 * - VerticalGalleryView 컴포넌트가 1번만 마운트되는지 확인
 * - 이벤트 리스너가 중복 등록되지 않는지 확인
 *
 * 배경:
 * - 로그 분석 결과, 갤러리가 동일 시점(10:02:49.815)에 2번 렌더링됨
 * - 이벤트 리스너(resize, keydown, scroll)가 3-5ms 간격으로 2번 등록됨
 * - Phase 9.16에서 수정했다고 되어 있으나 실제로는 여전히 발생
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GalleryRenderer } from '../../../src/features/gallery/GalleryRenderer';
import type { MediaInfo } from '../../../src/shared/types/media.types';
import {
  closeGallery,
  openGallery,
  galleryState,
} from '../../../src/shared/state/signals/gallery.signals';

// Mock logger
vi.mock('../../../src/shared/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock vendors
vi.mock('../../../src/shared/external/vendors', () => ({
  getSolidWeb: vi.fn(() => ({
    render: vi.fn((component: () => unknown, container: HTMLElement) => {
      // 실제 렌더링 시뮬레이션
      const mockDispose = vi.fn();

      // 컴포넌트 호출을 시뮬레이션하여 렌더링 횟수 추적
      if (typeof component === 'function') {
        component();
      }

      return mockDispose;
    }),
  })),
  getSolid: vi.fn(() => ({
    createSignal: vi.fn(<T>(initialValue: T) => {
      let value = initialValue;
      const getter = () => value;
      const setter = (newValue: T) => {
        value = newValue;
      };
      return [getter, setter];
    }),
    createEffect: vi.fn((fn: () => void) => {
      fn();
    }),
    createMemo: vi.fn(<T>(fn: () => T) => fn),
    onCleanup: vi.fn(),
  })),
}));

// Mock KeyboardNavigator
vi.mock('../../../src/shared/services/input/KeyboardNavigator', () => ({
  keyboardNavigator: {
    subscribe: vi.fn(() => vi.fn()),
  },
}));

// Mock service factories
vi.mock('../../../src/shared/services/service-factories', () => ({
  getBulkDownloadService: vi.fn(() =>
    Promise.resolve({
      downloadSingle: vi.fn(),
      downloadMultiple: vi.fn(),
    })
  ),
}));

describe('Phase 9.17 RED - 갤러리 이중 렌더링 감지', () => {
  let renderer: GalleryRenderer;
  const mockMediaItems: MediaInfo[] = [
    {
      id: 'test-1',
      type: 'image',
      url: 'https://example.com/image1.jpg',
      originalUrl: 'https://example.com/image1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      width: 1920,
      height: 1080,
      tweetInfo: {
        tweetId: '123',
        authorName: 'Test User',
        authorUsername: 'testuser',
        timestamp: new Date().toISOString(),
        tweetUrl: 'https://x.com/testuser/status/123',
      },
    },
    {
      id: 'test-2',
      type: 'image',
      url: 'https://example.com/image2.jpg',
      originalUrl: 'https://example.com/image2.jpg',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      width: 1920,
      height: 1080,
      tweetInfo: {
        tweetId: '123',
        authorName: 'Test User',
        authorUsername: 'testuser',
        timestamp: new Date().toISOString(),
        tweetUrl: 'https://x.com/testuser/status/123',
      },
    },
  ];

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';

    // State 초기화
    closeGallery();

    // Mock 초기화
    vi.clearAllMocks();
  });

  afterEach(() => {
    renderer?.destroy();
    closeGallery();
  });

  describe('단일 렌더링 보장', () => {
    it('should render gallery only once when openGallery is called', async () => {
      const { getSolidWeb } = await import('../../../src/shared/external/vendors');
      const renderMock = vi.mocked(getSolidWeb().render);

      renderer = new GalleryRenderer();

      // 갤러리 열기
      await renderer.render(mockMediaItems, { startIndex: 0 });

      // 짧은 대기 (비동기 렌더링 처리)
      await new Promise(resolve => setTimeout(resolve, 50));

      // render가 정확히 1번만 호출되어야 함
      expect(renderMock).toHaveBeenCalledTimes(1);
    });

    it('should not re-render when state changes after initial render', async () => {
      const { getSolidWeb } = await import('../../../src/shared/external/vendors');
      const renderMock = vi.mocked(getSolidWeb().render);

      renderer = new GalleryRenderer();

      // 초기 렌더링
      await renderer.render(mockMediaItems, { startIndex: 0 });
      await new Promise(resolve => setTimeout(resolve, 50));

      const initialCallCount = renderMock.mock.calls.length;

      // State 변경 (내부 상태 업데이트)
      openGallery(mockMediaItems, 1);
      await new Promise(resolve => setTimeout(resolve, 50));

      // render 호출 횟수가 변하지 않아야 함 (Signal로 자동 업데이트)
      expect(renderMock).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should create only one container element', async () => {
      renderer = new GalleryRenderer();

      await renderer.render(mockMediaItems, { startIndex: 0 });
      await new Promise(resolve => setTimeout(resolve, 50));

      // xeg-gallery-renderer 클래스를 가진 요소가 정확히 1개만 존재해야 함
      const containers = document.querySelectorAll('.xeg-gallery-renderer');
      expect(containers).toHaveLength(1);
    });
  });

  describe('이벤트 리스너 중복 방지', () => {
    it('should subscribe to keyboard navigator only once', async () => {
      const { keyboardNavigator } = await import(
        '../../../src/shared/services/input/KeyboardNavigator'
      );
      const subscribeMock = vi.mocked(keyboardNavigator.subscribe);

      renderer = new GalleryRenderer();

      await renderer.render(mockMediaItems, { startIndex: 0 });
      await new Promise(resolve => setTimeout(resolve, 50));

      // KeyboardNavigator.subscribe는 GalleryRenderer에서 1번만 호출되어야 함
      // (constructor에서 setupKeyboardNavigation 호출)
      expect(subscribeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('렌더링 상태 관리', () => {
    it('should correctly report rendering state', async () => {
      renderer = new GalleryRenderer();

      // 렌더링 전
      expect(renderer.isRendering()).toBe(false);

      // 렌더링 시작
      await renderer.render(mockMediaItems, { startIndex: 0 });
      await new Promise(resolve => setTimeout(resolve, 50));

      // 렌더링 후
      expect(renderer.isRendering()).toBe(true);

      // 갤러리 닫기
      renderer.close();
      await new Promise(resolve => setTimeout(resolve, 50));

      // 정리 후
      expect(renderer.isRendering()).toBe(false);
    });

    it('should prevent duplicate rendering with guard condition', async () => {
      renderer = new GalleryRenderer();

      await renderer.render(mockMediaItems, { startIndex: 0 });
      await new Promise(resolve => setTimeout(resolve, 50));

      // 중복 렌더링 시도
      await renderer.render(mockMediaItems, { startIndex: 1 });
      await new Promise(resolve => setTimeout(resolve, 50));

      // 여전히 1개의 컨테이너만 존재해야 함
      const containers = document.querySelectorAll('.xeg-gallery-renderer');
      expect(containers).toHaveLength(1);
    });
  });

  describe('로그 분석 기반 검증', () => {
    it('should not trigger multiple "최초 렌더링 시작" logs', async () => {
      const { logger } = await import('../../../src/shared/logging/logger');
      const loggerInfoMock = vi.mocked(logger.info);

      renderer = new GalleryRenderer();

      await renderer.render(mockMediaItems, { startIndex: 0 });
      await new Promise(resolve => setTimeout(resolve, 50));

      // "최초 렌더링 시작" 로그가 1번만 출력되어야 함
      const renderStartLogs = loggerInfoMock.mock.calls.filter(call =>
        call[0]?.includes('최초 렌더링 시작')
      );

      expect(renderStartLogs.length).toBe(1);
    });

    it('should not trigger multiple "렌더링 완료" logs', async () => {
      const { logger } = await import('../../../src/shared/logging/logger');
      const loggerInfoMock = vi.mocked(logger.info);

      renderer = new GalleryRenderer();

      await renderer.render(mockMediaItems, { startIndex: 0 });
      await new Promise(resolve => setTimeout(resolve, 100));

      // "렌더링 완료" 로그가 1번만 출력되어야 함
      const renderCompleteLogs = loggerInfoMock.mock.calls.filter(call =>
        call[0]?.includes('렌더링 완료')
      );

      expect(renderCompleteLogs.length).toBe(1);
    });
  });
});
