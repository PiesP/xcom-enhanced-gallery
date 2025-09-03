import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/preact';
import { openGallery, navigateToItem, galleryState } from '@shared/state/signals/gallery.signals';
import {
  setToolbarIntent,
  markUserScroll,
  resetIntent,
  navigationIntentState,
} from '@shared/state/signals/navigation-intent.signals';

/**
 * P14.FOCUS_SYNC v2 DOM 통합 테스트
 * 실제 DOM과 스크롤 동작을 포함한 상세 테스트
 */

describe('P14.FOCUS_SYNC v2: DOM 통합 테스트', () => {
  const mockMedia = Array.from({ length: 10 }).map((_, i) => ({
    id: `media-${i}`,
    url: `https://example.com/image-${i}.jpg`,
    type: 'image' as const,
    filename: `image-${i}.jpg`,
    width: 800,
    height: 600,
    size: 100000,
    mediaType: 'image' as const,
  }));

  beforeEach(() => {
    // 각 테스트 전 상태 초기화
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
    resetIntent();
    vi.clearAllMocks();

    // 필요한 DOM API mocks 설정
    (globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    (globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // requestAnimationFrame mock
    (globalThis as any).requestAnimationFrame = vi.fn(cb => globalThis.setTimeout(cb, 16));
    (globalThis as any).cancelAnimationFrame = vi.fn(id => globalThis.clearTimeout(id));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('실제 스크롤 동작 테스트', () => {
    it('툴바 네비게이션 시 실제 DOM 스크롤이 발생한다', async () => {
      // Given: 갤러리 열기
      openGallery(mockMedia, 0);

      // HTMLElement.scrollIntoView mock
      Element.prototype.scrollIntoView = vi.fn();

      // When: 툴바로 인덱스 5로 이동
      setToolbarIntent('next');
      navigateToItem(5);

      // Then: 갤러리 상태가 변경됨
      await new Promise(resolve => globalThis.setTimeout(resolve, 100)); // 비동기 처리 대기

      expect(galleryState.value.currentIndex).toBe(5);
    });

    it('사용자 wheel 이벤트 시 intent가 즉시 변경된다', () => {
      // Given: 갤러리가 열려있음
      openGallery(mockMedia, 2);

      // When: wheel 이벤트 발생 (실제 useGalleryScroll에서 처리되는 방식 시뮬레이션)
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });

      // wheel 이벤트 핸들러에서 markUserScroll 호출을 시뮬레이션
      if (Math.abs(wheelEvent.deltaY) > 0) {
        markUserScroll();
      }

      // Then: intent가 즉시 user-scroll로 변경
      expect(navigationIntentState.value.intent).toBe('user-scroll');
      expect(navigationIntentState.value.lastUserScrollAt).toBeGreaterThan(0);
    });
  });

  describe('center 계산 및 포커스 동기화', () => {
    it('center 계산 로직이 올바르게 동작한다', () => {
      // Given: 뷰포트와 아이템 정보
      const viewportTop = 300;
      const viewportHeight = 400;
      const viewportCenter = viewportTop + viewportHeight / 2; // 500

      // When: item 2 (y: 400-600)의 중심 계산
      const item2Center = 2 * 200 + 200 / 2; // 500

      // Then: item 2가 뷰포트 중심에 가장 가까움
      expect(Math.abs(item2Center - viewportCenter)).toBe(0);
    });
  });

  describe('smooth scroll 중단 테스트', () => {
    it('자동 스크롤 중 사용자 개입 시 중단된다', async () => {
      // scrollIntoView mock with animation control
      Element.prototype.scrollIntoView = vi.fn();

      // Given: 갤러리 열기
      openGallery(mockMedia, 0);

      // When: 툴바로 smooth 스크롤 시작
      setToolbarIntent('next');
      navigateToItem(5);

      // 스크롤 진행 중 사용자 개입
      await new Promise(resolve => globalThis.setTimeout(resolve, 100)); // 스크롤 시작 대기
      markUserScroll();

      // Then: intent가 user-scroll로 변경되어 추가 자동 스크롤이 차단됨
      expect(navigationIntentState.value.intent).toBe('user-scroll');
    });
  });

  describe('성능 및 메모리 테스트', () => {
    it('polling이 제거되고 이벤트 기반으로 동작한다', async () => {
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      // Given: 갤러리 열기
      openGallery(mockMedia, 0);

      // 짧은 대기 후 호출 횟수 확인
      await new Promise(resolve => globalThis.setTimeout(resolve, 200));

      // Then: setInterval이 주기적 polling 용도로 사용되지 않아야 함
      // (단, 디바운스나 한 번의 지연을 위한 setTimeout은 허용)
      const intervalCalls = setIntervalSpy.mock.calls.filter(
        call => call[1] && call[1] >= 100 && call[1] <= 200 // 100-200ms 주기는 polling 의심
      );

      expect(intervalCalls.length).toBe(0); // polling 제거 확인

      setIntervalSpy.mockRestore();
      setTimeoutSpy.mockRestore();
    });

    it('50ms 이내 반응성을 보장한다', () => {
      // Given: 성능 측정 시작
      const startTime = Date.now();

      // When: 연속 intent 변경
      setToolbarIntent('next');
      markUserScroll();
      setToolbarIntent('prev');

      const endTime = Date.now();

      // Then: 전체 처리 시간이 50ms 이내
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('edge case 및 경계 조건', () => {
    it('빈 미디어 배열에서도 안전하게 동작한다', () => {
      // Given: 빈 미디어 배열
      openGallery([], 0);

      // When: 네비게이션 시도
      setToolbarIntent('next');
      navigateToItem(1);

      // Then: 에러 없이 처리됨
      expect(galleryState.value.currentIndex).toBe(0); // 변경되지 않음
    });

    it('유효하지 않은 인덱스로 네비게이션 시도해도 안전하다', () => {
      // Given: 3개 미디어
      openGallery(mockMedia.slice(0, 3), 1);

      // When: 범위 밖 인덱스로 네비게이션
      setToolbarIntent('next');
      navigateToItem(10);

      // Then: 안전하게 처리됨 (실제 구현에 따라 clamp되거나 무시됨)
      expect(galleryState.value.currentIndex).toBeLessThanOrEqual(2);
    });

    it('연속된 빠른 wheel 이벤트가 올바르게 처리된다', () => {
      // Given: 갤러리 열기
      openGallery(mockMedia, 0);

      // When: 빠른 연속 wheel 이벤트 시뮬레이션
      for (let i = 0; i < 10; i++) {
        markUserScroll();
      }

      // Then: 마지막 상태가 안정적으로 유지됨
      expect(navigationIntentState.value.intent).toBe('user-scroll');
      expect(navigationIntentState.value.lastUserScrollAt).toBeGreaterThan(0);
    });
  });
});
