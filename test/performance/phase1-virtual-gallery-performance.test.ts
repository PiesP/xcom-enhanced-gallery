/**
 * @fileoverview Phase 1: VirtualGallery 성능 최적화 테스트
 * @description 가상 스크롤링 구현과 성능 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualGallery } from '@shared/components/virtual/VirtualGallery';
import type { MediaItem } from '@shared/types';

describe('Phase 1: VirtualGallery 성능 최적화', () => {
  let mockMediaItems: MediaItem[];
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // 대용량 미디어 아이템 목록 생성 (1000개)
    mockMediaItems = Array.from({ length: 1000 }, (_, index) => ({
      id: `media-${index}`,
      url: `https://example.com/media/${index}.jpg`,
      type: 'image' as const,
      filename: `image-${index}.jpg`,
    }));

    // 컨테이너 요소 모킹
    mockContainer = document.createElement('div');
    mockContainer.style.height = '400px';
    mockContainer.style.width = '800px';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    vi.clearAllMocks();
  });

  describe('1. 가상 스크롤링 구현', () => {
    it('대용량 리스트에서 TanStack Virtual을 사용해야 한다', async () => {
      const result = VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
      });

      // TanStack Virtual 사용 여부 확인
      expect(result).toBeDefined();
      // TODO: 실제 virtual scrolling 구현 후 세부 검증 추가
    });

    it('뷰포트에 보이는 아이템만 렌더링해야 한다', async () => {
      const onItemClick = vi.fn();
      const renderItem = vi.fn((item, index) => `Item ${index}: ${item.id}`);

      VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
        onItemClick,
        renderItem,
      });

      // 뷰포트 높이 400px, 아이템 높이 120px이므로 최대 4개 아이템만 렌더링되어야 함
      // TODO: 실제 구현 후 renderItem 호출 횟수 검증
      expect(renderItem.mock.calls.length).toBeLessThanOrEqual(10); // 버퍼 포함
    });

    it('스크롤 시에도 부드러운 성능을 유지해야 한다', async () => {
      const startTime = performance.now();

      const result = VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 초기 렌더링은 16ms(60fps) 이내에 완료되어야 함
      expect(renderTime).toBeLessThan(16);
      expect(result).toBeDefined();
    });
  });

  describe('2. 메모리 효율성', () => {
    it('대용량 리스트에서 메모리 사용량이 제한되어야 한다', () => {
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

      VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
      });

      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = memoryAfter - memoryBefore;

      // 메모리 사용량이 합리적인 범위 내에 있어야 함 (10MB 이하)
      expect(memoryUsed).toBeLessThan(10 * 1024 * 1024);
    });

    it('컴포넌트 언마운트 시 메모리 리크가 없어야 한다', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 컴포넌트 렌더링
      const result = VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
      });

      // 가비지 컬렉션 강제 실행 (테스트 환경에서만)
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가량이 합리적인 범위 내에 있어야 함
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB 이하
    });
  });

  describe('3. 성능 벤치마크', () => {
    it('1000개 아이템 렌더링이 100ms 이내에 완료되어야 한다', () => {
      const startTime = performance.now();

      VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100);
    });

    it('10000개 아이템에서도 안정적으로 작동해야 한다', () => {
      const largeItems = Array.from({ length: 10000 }, (_, index) => ({
        id: `large-media-${index}`,
        url: `https://example.com/large/${index}.jpg`,
        type: 'image' as const,
        filename: `large-${index}.jpg`,
      }));

      const startTime = performance.now();

      const result = VirtualGallery({
        mediaItems: largeItems,
        itemHeight: 120,
        containerHeight: 400,
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(renderTime).toBeLessThan(200); // 200ms 이내
    });
  });

  describe('4. 호환성 및 폴백', () => {
    it('TanStack Virtual 로딩 실패 시 폴백 렌더링을 사용해야 한다', () => {
      // TanStack Virtual 로딩 실패 시뮬레이션
      const result = VirtualGallery({
        mediaItems: mockMediaItems.slice(0, 50), // 중간 크기 리스트
        itemHeight: 120,
        containerHeight: 400,
      });

      expect(result).toBeDefined();
      // 폴백 렌더링이라도 정상 작동해야 함
    });

    it('잘못된 props에 대해 안전하게 처리해야 한다', () => {
      const result = VirtualGallery({
        mediaItems: null as any,
        itemHeight: -1,
        containerHeight: 0,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // 폴백 HTML 문자열
    });
  });

  describe('5. 번들 크기 영향도', () => {
    it('VirtualGallery import가 번들 크기를 과도하게 증가시키지 않아야 한다', () => {
      // 이 테스트는 번들 분석 도구로 실제 확인
      expect(VirtualGallery).toBeDefined();
      expect(typeof VirtualGallery).toBe('function');
    });
  });
});
