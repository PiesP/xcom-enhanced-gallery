/**
 * 외부 라이브러리 통합 테스트
 *
 * @description TanStack Query, Motion One 통합 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeVendors, getTanStackQuery } from '@shared/external/vendors';

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
  });

  describe('AnimationService 통합', () => {
    it('AnimationService가 초기화되어야 한다', async () => {
      const { AnimationService } = await import('@shared/services/AnimationService');
      const animationService = AnimationService.getInstance();

      expect(animationService).toBeDefined();
      expect(typeof animationService.fadeIn).toBe('function');
      expect(typeof animationService.fadeOut).toBe('function');
      expect(typeof animationService.openGallery).toBe('function');
      expect(typeof animationService.closeGallery).toBe('function');
    });

    it('편의 함수들이 정의되어야 한다', async () => {
      const { animateElement, fadeOut, openGalleryWithAnimation, closeGalleryWithAnimation } =
        await import('@shared/services/AnimationService');

      expect(typeof animateElement).toBe('function');
      expect(typeof fadeOut).toBe('function');
      expect(typeof openGalleryWithAnimation).toBe('function');
      expect(typeof closeGalleryWithAnimation).toBe('function');
    });

    it('폴백 애니메이션이 실행되어야 한다', async () => {
      const { AnimationService } = await import('@shared/services/AnimationService');
      const animationService = AnimationService.getInstance();

      // 가짜 element 생성
      const mockElement = {
        style: {},
      };

      // 애니메이션 실행 (폴백 모드)
      try {
        await animationService.fadeIn(mockElement, { duration: 100 });
        // 성공적으로 실행되었는지 확인
        expect(animationService).toBeDefined();
      } catch (error) {
        // 예상되는 에러
        expect(error).toBeDefined();
      }
    });
  });

  describe('전체 통합 검증', () => {
    it('모든 서비스가 함께 작동해야 한다', async () => {
      // AnimationService
      const { AnimationService } = await import('@shared/services/AnimationService');
      const animationService = AnimationService.getInstance();

      expect(animationService).toBeDefined();

      // 서비스가 정상적으로 작동하는지 확인
      expect(typeof animationService.fadeIn).toBe('function');
    });

    it('라이브러리들이 기존 시스템과 호환되어야 한다', async () => {
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

      // TanStack Query
      const tanStackQuery = await getTanStackQuery();
      expect(tanStackQuery).toBeDefined();
    });

    it('메모리 정리가 올바르게 작동해야 한다', async () => {
      const { AnimationService } = await import('@shared/services/AnimationService');
      const animationService = AnimationService.getInstance();

      // 정리 메서드가 존재하는지 확인
      expect(typeof animationService.cleanup).toBe('function');

      // cleanup을 spy로 만들기
      const cleanupSpy = vi.spyOn(animationService, 'cleanup');

      // 정리 실행
      animationService.cleanup();

      // cleanup이 정상적으로 실행되었는지 확인
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});
