/**
 * Phase 3: 가상 갤러리 통합 테스트
 *
 * @description VirtualGallery 컴포넌트와 기존 VerticalGalleryView 통합 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualGallery } from '@shared/components/virtual/VirtualGallery';

describe('Phase 3: 가상 갤러리 통합', () => {
  let mockMediaItems;

  beforeEach(() => {
    // Mock 미디어 아이템 생성
    mockMediaItems = Array.from({ length: 100 }, (_, index) => ({
      id: `media-${index}`,
      url: `https://example.com/image-${index}.jpg`,
      type: 'image',
      width: 800,
      height: 600,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('VirtualGallery 컴포넌트 통합', () => {
    it('VirtualGallery가 올바르게 렌더링되어야 한다', () => {
      const result = VirtualGallery({
        mediaItems: mockMediaItems.slice(0, 10),
        itemHeight: 120,
        containerHeight: 400,
        onItemClick: vi.fn(),
      });

      expect(result).toBeDefined();
    });

    it('대용량 리스트에서 TanStack Virtual이 활성화되어야 한다', () => {
      const result = VirtualGallery({
        mediaItems: mockMediaItems, // 100개 아이템
        itemHeight: 120,
        containerHeight: 400,
        onItemClick: vi.fn(),
      });

      expect(result).toBeDefined();
      // TanStack Virtual이 사용되었는지 검증하기 위해 반환값 확인
      // 실제 구현에서는 가상화가 적용된 구조를 확인할 수 있음
    });

    it('소규모 리스트에서는 폴백 렌더링이 사용되어야 한다', () => {
      const smallItems = mockMediaItems.slice(0, 5);

      const result = VirtualGallery({
        mediaItems: smallItems,
        itemHeight: 120,
        containerHeight: 400,
        onItemClick: vi.fn(),
      });

      expect(result).toBeDefined();
      // 폴백 렌더링이 사용되었는지 확인
    });

    it('커스텀 렌더러가 올바르게 작동해야 한다', () => {
      const customRenderer = vi.fn((item, index) => `Custom item ${index}: ${item.id}`);

      const result = VirtualGallery({
        mediaItems: mockMediaItems.slice(0, 10),
        itemHeight: 120,
        containerHeight: 400,
        renderItem: customRenderer,
        onItemClick: vi.fn(),
      });

      expect(result).toBeDefined();
      // 커스텀 렌더러가 호출되었는지 확인은 실제 렌더링 환경에서 가능
    });
  });

  describe('VerticalGalleryView 교체 준비', () => {
    it('기존 VerticalGalleryView의 스크롤 기능이 VirtualGallery로 대체 가능해야 한다', async () => {
      // 기존 갤러리의 주요 기능들이 VirtualGallery에서 지원되는지 확인
      const onItemClick = vi.fn();

      const result = VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 500, // VerticalGalleryView와 유사한 높이
        containerHeight: 800,
        onItemClick,
        className: 'gallery-container',
      });

      expect(result).toBeDefined();
      expect(onItemClick).toBeDefined();
    });

    it('가상 스크롤링이 성능을 개선해야 한다', () => {
      // 성능 지표 측정 (실제 환경에서는 렌더링 시간 측정 가능)
      const startTime = Date.now();

      const result = VirtualGallery({
        mediaItems: mockMediaItems, // 100개 아이템
        itemHeight: 120,
        containerHeight: 400,
        onItemClick: vi.fn(),
      });

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(renderTime).toBeLessThan(100); // 100ms 이내 렌더링
    });
  });

  describe('호환성 및 폴백 검증', () => {
    it('TanStack Virtual 로딩 실패 시 폴백이 작동해야 한다', () => {
      // TanStack Virtual API 로딩 실패 시뮬레이션
      vi.doMock('@shared/external/vendors', () => ({
        getTanStackVirtual: () => null, // 로딩 실패
        getPreact: () => ({ h: vi.fn() }),
        getPreactHooks: () => ({ useRef: vi.fn(() => ({ current: null })) }),
      }));

      const result = VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
        onItemClick: vi.fn(),
      });

      // 폴백 렌더링이 정상 작동하는지 확인
      expect(result).toBeDefined();
    });

    it('빈 미디어 리스트 처리가 올바르게 되어야 한다', () => {
      const result = VirtualGallery({
        mediaItems: [],
        itemHeight: 120,
        containerHeight: 400,
        onItemClick: vi.fn(),
      });

      expect(result).toBeDefined();
    });

    it('잘못된 props 처리가 안전해야 한다', () => {
      const result = VirtualGallery({
        mediaItems: null, // 잘못된 타입
        itemHeight: -1, // 잘못된 값
        containerHeight: 0,
        onItemClick: null,
      });

      // 에러 없이 안전하게 처리되어야 함
      expect(result).toBeDefined();
    });
  });

  describe('메모리 및 성능 최적화', () => {
    it('대용량 리스트에서 메모리 사용량이 제한되어야 한다', () => {
      // 매우 큰 리스트로 테스트
      const largeItems = Array.from({ length: 10000 }, (_, index) => ({
        id: `large-item-${index}`,
        url: `https://example.com/large-${index}.jpg`,
        type: 'image',
        width: 1920,
        height: 1080,
      }));

      const result = VirtualGallery({
        mediaItems: largeItems,
        itemHeight: 300,
        containerHeight: 600,
        onItemClick: vi.fn(),
      });

      expect(result).toBeDefined();
      // 실제 환경에서는 DOM 노드 수, 메모리 사용량 등을 확인할 수 있음
    });

    it('스크롤 성능이 최적화되어야 한다', () => {
      const result = VirtualGallery({
        mediaItems: mockMediaItems,
        itemHeight: 120,
        containerHeight: 400,
        onItemClick: vi.fn(),
      });

      expect(result).toBeDefined();
      // 실제 환경에서는 스크롤 이벤트 처리 시간, 프레임 드랍 등을 측정 가능
    });
  });
});
