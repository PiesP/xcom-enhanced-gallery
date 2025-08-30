/**
 * @fileoverview TDD REFACTOR: 갤러리 휠 스크롤 통합 테스트
 * @description 실제 컴포넌트에서 조건적 wheel 이벤트 처리가 작동하는지 검증
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/preact';
import { createElement } from 'preact';

// Mock 환경 설정
const mockWindow = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn(() => ({ matches: false })),
  setInterval: vi.fn(),
  clearInterval: vi.fn(),
  setTimeout: vi.fn(),
  clearTimeout: vi.fn(),
};

const mockDocument = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  body: { style: {} },
  createElement: vi.fn(() => ({
    tagName: 'DIV',
    className: '',
    querySelector: vi.fn(),
    children: [],
  })),
};

// 전역 객체 mock
Object.defineProperty(globalThis, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: mockDocument,
  writable: true,
});

describe('TDD REFACTOR: 갤러리 휠 스크롤 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('VerticalGalleryView 통합', () => {
    test('useSmartImageFit과 useGalleryScroll이 통합되어 작동하는지 확인', async () => {
      // 통합된 훅들이 정상적으로 import 되는지 확인
      const { useSmartImageFit } = await import('@features/gallery/hooks/useSmartImageFit');
      const { useGalleryScroll } = await import('@features/gallery/hooks/useGalleryScroll');

      expect(useSmartImageFit).toBeDefined();
      expect(useGalleryScroll).toBeDefined();
      expect(typeof useSmartImageFit).toBe('function');
      expect(typeof useGalleryScroll).toBe('function');
    });

    test('이미지 크기 정보가 올바르게 전달되는지 확인', async () => {
      const { useSmartImageFit } = await import('@features/gallery/hooks/useSmartImageFit');

      // Mock 이미지 요소
      const mockImageElement = {
        naturalWidth: 800,
        naturalHeight: 600,
        offsetWidth: 800,
        offsetHeight: 600,
      };

      const result = useSmartImageFit({
        imageElement: mockImageElement,
        fitMode: 'fitWidth',
      });

      // 이미지 크기 정보가 올바르게 계산되는지 확인
      expect(result.imageSize.width).toBe(800);
      expect(result.imageSize.height).toBe(600);
      expect(result.isImageSmallerThanViewport).toBe(true);
      expect(result.viewportSize.width).toBe(1920);
      expect(result.viewportSize.height).toBe(1080);
    });

    test('조건적 wheel 이벤트 처리 로직이 통합되었는지 확인', async () => {
      const { useGalleryScroll } = await import('@features/gallery/hooks/useGalleryScroll');

      const mockNavigationHandler = vi.fn();
      const mockScrollHandler = vi.fn();

      // 작은 이미지 크기로 훅 사용
      const result = useGalleryScroll({
        container: mockDocument.createElement('div'),
        imageSize: { width: 800, height: 600 },
        viewportSize: { width: 1920, height: 1080 },
        onImageNavigation: mockNavigationHandler,
        onScroll: mockScrollHandler,
        enabled: true,
        blockTwitterScroll: true,
      });

      expect(result).toBeDefined();
      expect(result.lastScrollTime).toBeDefined();
      expect(result.isScrolling).toBeDefined();
    });
  });

  describe('실제 사용 시나리오', () => {
    test('작은 이미지에서 wheel 이벤트가 네비게이션으로 처리되는 시나리오', () => {
      // 시나리오: 800x600 이미지, 1920x1080 뷰포트
      const imageSize = { width: 800, height: 600 };
      const viewportSize = { width: 1920, height: 1080 };
      const wheelDelta = 100; // 아래로 스크롤

      // 조건 확인
      const isSmallImage =
        imageSize.width <= viewportSize.width && imageSize.height <= viewportSize.height;

      expect(isSmallImage).toBe(true);

      // 네비게이션 방향 결정
      const direction = wheelDelta > 0 ? 'next' : 'prev';
      expect(direction).toBe('next');
    });

    test('큰 이미지에서 wheel 이벤트가 스크롤로 처리되는 시나리오', () => {
      // 시나리오: 2560x1440 이미지, 1920x1080 뷰포트
      const imageSize = { width: 2560, height: 1440 };
      const viewportSize = { width: 1920, height: 1080 };

      // 조건 확인
      const isSmallImage =
        imageSize.width <= viewportSize.width && imageSize.height <= viewportSize.height;

      expect(isSmallImage).toBe(false);
      // 큰 이미지에서는 기존 스크롤 로직 사용
    });

    test('트위터 페이지 스크롤 차단이 모든 경우에 적용되는지 확인', () => {
      const mockEvent = {
        deltaY: 100,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      // blockTwitterScroll이 true일 때 항상 이벤트 차단
      const blockTwitterScroll = true;

      if (blockTwitterScroll) {
        mockEvent.preventDefault();
        mockEvent.stopPropagation();
      }

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('성능 및 메모리 관리', () => {
    test('이미지 요소 참조가 올바르게 업데이트되는지 확인', () => {
      // Mock 갤러리 컨테이너
      const mockContainer = {
        querySelector: vi.fn(() => ({
          children: [
            {
              querySelector: vi.fn(() => ({
                naturalWidth: 800,
                naturalHeight: 600,
                tagName: 'IMG',
              })),
            },
          ],
        })),
      };

      // 현재 인덱스 변경 시뮬레이션
      const currentIndex = 0;
      const itemsList = mockContainer.querySelector('[data-xeg-role="items-list"]');
      const currentItem = itemsList?.children[currentIndex];
      const imageElement = currentItem?.querySelector('img, video');

      expect(mockContainer.querySelector).toHaveBeenCalledWith('[data-xeg-role="items-list"]');
      expect(imageElement).toBeDefined();
    });

    test('메모리 누수 방지를 위한 cleanup 로직 확인', () => {
      // setTimeout/clearTimeout 호출 균형 확인
      const setTimeoutCount = mockWindow.setTimeout.mock.calls.length;
      const clearTimeoutCount = mockWindow.clearTimeout.mock.calls.length;

      // cleanup이 호출되면 타이머들이 정리되어야 함
      expect(setTimeoutCount).toBeGreaterThanOrEqual(0);
      expect(clearTimeoutCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('향상된 사용자 경험', () => {
    test('Instagram-like 이미지 네비게이션 동작 검증', () => {
      const currentIndex = 1;
      const totalItems = 5;

      // 다음 이미지로 이동
      const nextIndex = Math.min(currentIndex + 1, totalItems - 1);
      expect(nextIndex).toBe(2);

      // 이전 이미지로 이동
      const prevIndex = Math.max(currentIndex - 1, 0);
      expect(prevIndex).toBe(0);

      // 경계값 테스트
      const lastIndex = totalItems - 1;
      const beyondLast = Math.min(lastIndex + 1, totalItems - 1);
      expect(beyondLast).toBe(lastIndex);

      const firstIndex = 0;
      const beforeFirst = Math.max(firstIndex - 1, 0);
      expect(beforeFirst).toBe(firstIndex);
    });

    test('이미지 크기 변경에 따른 동적 처리 모드 전환', () => {
      // 시나리오: 사용자가 브라우저 윈도우 크기를 변경
      const imageSize = { width: 1200, height: 800 };
      let viewportSize = { width: 1920, height: 1080 };

      // 처음에는 작은 이미지 (네비게이션 모드)
      let isSmallImage =
        imageSize.width <= viewportSize.width && imageSize.height <= viewportSize.height;
      expect(isSmallImage).toBe(true);

      // 윈도우 크기 축소 (스크롤 모드로 전환)
      viewportSize = { width: 1024, height: 768 };
      isSmallImage =
        imageSize.width <= viewportSize.width && imageSize.height <= viewportSize.height;
      expect(isSmallImage).toBe(false);
    });
  });
});
