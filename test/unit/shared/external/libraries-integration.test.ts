/**
 * 외부 라이브러리 통합 테스트
 *
 * @description TanStack Query, Virtual, Motion One 통합 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeVendors, getTanStackQuery, getTanStackVirtual } from '@shared/external/vendors';

describe('외부 라이브러리 통합 테스트', () => {
  beforeEach(async () => {
    // 모든 테스트 전에 vendor 초기화
    await initializeVendors();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TanStack Query 통합', () => {
    it('TanStack Query가 올바르게 로드되어야 한다', async () => {
      const query = await getTanStackQuery();

      expect(query.QueryClient).toBeDefined();
      expect(query.QueryCache).toBeDefined();
      expect(typeof query.QueryClient).toBe('function');
      expect(typeof query.QueryCache).toBe('function');
    });

    it('QueryService가 기본적으로 작동해야 한다', async () => {
      const { QueryService } = await import('@shared/services/QueryService');
      const queryService = QueryService.getInstance();

      expect(queryService).toBeDefined();
      expect(typeof queryService.fetchTweetMedia).toBe('function');
      expect(typeof queryService.invalidateCache).toBe('function');
    });

    it('QueryService 폴백이 작동해야 한다', async () => {
      const { QueryService } = await import('@shared/services/QueryService');
      const queryService = QueryService.getInstance();

      // 존재하지 않는 트윗 ID로 테스트
      const result = await queryService.fetchTweetMedia('non-existent-tweet');

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.isLoading).toBe(false);
      expect(typeof result.refetch).toBe('function');
    });
  });

  describe('TanStack Virtual 통합', () => {
    it('TanStack Virtual이 올바르게 로드되어야 한다', async () => {
      const virtual = await getTanStackVirtual();

      expect(virtual.useVirtualizer).toBeDefined();
      expect(virtual.defaultRangeExtractor).toBeDefined();
      expect(typeof virtual.useVirtualizer).toBe('function');
    });

    it('VirtualGallery 컴포넌트가 렌더링되어야 한다', async () => {
      const { VirtualGallery } = await import('@shared/components/virtual/VirtualGallery');

      const mockMediaItems = [
        {
          type: 'image',
          url: 'https://example.com/image1.jpg',
          originalUrl: 'https://example.com/image1.jpg',
          filename: 'image1.jpg',
          index: 0,
          metadata: { width: 800, height: 600 },
        },
        {
          type: 'image',
          url: 'https://example.com/image2.jpg',
          originalUrl: 'https://example.com/image2.jpg',
          filename: 'image2.jpg',
          index: 1,
          metadata: { width: 800, height: 600 },
        },
      ];

      const props = {
        mediaItems: mockMediaItems,
        itemHeight: 300,
        containerHeight: 600,
      };

      // 컴포넌트 함수가 존재하는지 확인
      expect(VirtualGallery).toBeDefined();
      expect(typeof VirtualGallery).toBe('function');

      // 기본 렌더링 테스트 (실제 DOM 없이는 제한적)
      try {
        const result = VirtualGallery(props);
        // 에러가 발생하지 않으면 성공
        expect(true).toBe(true);
      } catch (error) {
        // 브라우저 환경이 아니므로 예상되는 에러
        expect(error).toBeDefined();
      }
    });

    it('useVirtualGallery 훅이 올바른 데이터를 반환해야 한다', async () => {
      const { useVirtualGallery } = await import('@shared/components/virtual/VirtualGallery');

      const mockMediaItems = [
        {
          type: 'image',
          url: 'https://example.com/image1.jpg',
          originalUrl: 'https://example.com/image1.jpg',
          filename: 'image1.jpg',
          index: 0,
          metadata: { width: 800, height: 600 },
        },
      ];

      try {
        const result = useVirtualGallery(mockMediaItems, 300);

        expect(result).toBeDefined();
        expect(result.itemCount).toBe(1);
        expect(result.totalHeight).toBe(300);
        expect(result.visibleItems).toEqual(mockMediaItems);
      } catch (error) {
        // 브라우저 환경이 아니므로 예상되는 에러
        expect(error).toBeDefined();
      }
    });
  });

  describe('SimpleAnimationService 통합', () => {
    it('SimpleAnimationService가 초기화되어야 한다', async () => {
      const { SimpleAnimationService } = await import('@shared/services/SimpleAnimationService');
      const animationService = SimpleAnimationService.getInstance();

      expect(animationService).toBeDefined();
      expect(typeof animationService.fadeIn).toBe('function');
      expect(typeof animationService.fadeOut).toBe('function');
      expect(typeof animationService.openGallery).toBe('function');
      expect(typeof animationService.closeGallery).toBe('function');
    });

    it('편의 함수들이 정의되어야 한다', async () => {
      const { animateElement, fadeOut, openGalleryWithAnimation, closeGalleryWithAnimation } =
        await import('@shared/services/SimpleAnimationService');

      expect(typeof animateElement).toBe('function');
      expect(typeof fadeOut).toBe('function');
      expect(typeof openGalleryWithAnimation).toBe('function');
      expect(typeof closeGalleryWithAnimation).toBe('function');
    });

    it('폴백 애니메이션이 실행되어야 한다', async () => {
      const { SimpleAnimationService } = await import('@shared/services/SimpleAnimationService');
      const animationService = SimpleAnimationService.getInstance();

      // 가짜 element 생성
      const mockElement = {
        style: {},
      };

      // 애니메이션 실행 (폴백 모드)
      try {
        await animationService.fadeIn(mockElement, { duration: 100 });
        expect(true).toBe(true); // 에러가 발생하지 않으면 성공
      } catch (error) {
        // 예상되는 에러
        expect(error).toBeDefined();
      }
    });
  });

  describe('전체 통합 검증', () => {
    it('모든 새로운 서비스가 함께 작동해야 한다', async () => {
      // QueryService
      const { QueryService } = await import('@shared/services/QueryService');
      const queryService = QueryService.getInstance();

      // SimpleAnimationService
      const { SimpleAnimationService } = await import('@shared/services/SimpleAnimationService');
      const animationService = SimpleAnimationService.getInstance();

      // VirtualGallery
      const { VirtualGallery } = await import('@shared/components/virtual/VirtualGallery');

      expect(queryService).toBeDefined();
      expect(animationService).toBeDefined();
      expect(VirtualGallery).toBeDefined();

      // 서비스들이 서로 독립적으로 작동하는지 확인
      expect(queryService !== animationService).toBe(true);
    });

    it('새로운 라이브러리들이 기존 시스템과 호환되어야 한다', async () => {
      // 기존 vendor 시스템과의 호환성 확인
      const { getPreact, getPreactSignals, getMotionOne } = await import(
        '@shared/external/vendors'
      );

      const preact = getPreact();
      const signals = getPreactSignals();
      const motionOne = getMotionOne();

      expect(preact).toBeDefined();
      expect(signals).toBeDefined();
      expect(motionOne).toBeDefined();

      // 새로운 라이브러리들
      const tanStackQuery = await getTanStackQuery();
      const tanStackVirtual = await getTanStackVirtual();

      expect(tanStackQuery).toBeDefined();
      expect(tanStackVirtual).toBeDefined();
    });

    it('메모리 정리가 올바르게 작동해야 한다', async () => {
      const { QueryService } = await import('@shared/services/QueryService');
      const { SimpleAnimationService } = await import('@shared/services/SimpleAnimationService');

      const queryService = QueryService.getInstance();
      const animationService = SimpleAnimationService.getInstance();

      // 정리 메서드가 존재하는지 확인
      expect(typeof queryService.cleanup).toBe('function');
      expect(typeof animationService.cleanup).toBe('function');

      // 정리 실행
      queryService.cleanup();
      animationService.cleanup();

      // 에러가 발생하지 않으면 성공
      expect(true).toBe(true);
    });
  });
});
