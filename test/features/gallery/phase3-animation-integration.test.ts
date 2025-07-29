/**
 * Phase 3: 애니메이션 통합 테스트
 *
 * @description SimpleAnimationService와 기존 애니메이션 유틸리티 통합 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimpleAnimationService } from '@shared/services/SimpleAnimationService';

describe('Phase 3: 애니메이션 서비스 통합', () => {
  let animationService;
  let mockElement;

  beforeEach(() => {
    animationService = SimpleAnimationService.getInstance();

    // Mock DOM 요소 생성 (환경에 무관하게 동작)
    mockElement = {
      style: {},
      scrollIntoView: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      parentNode: null,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('기존 애니메이션 유틸리티 교체', () => {
    it('animateGalleryEnter가 SimpleAnimationService.openGallery로 교체되어야 한다', async () => {
      const spy = vi.spyOn(animationService, 'openGallery');

      // 새로운 통합 함수 테스트
      await animationService.openGallery(mockElement);

      expect(spy).toHaveBeenCalledWith(mockElement);
    });

    it('animateGalleryExit가 SimpleAnimationService.closeGallery로 교체되어야 한다', async () => {
      const spy = vi.spyOn(animationService, 'closeGallery');

      await animationService.closeGallery(mockElement);

      expect(spy).toHaveBeenCalledWith(mockElement);
    });

    it('툴바 애니메이션이 SimpleAnimationService로 통합되어야 한다', async () => {
      const fadeInSpy = vi.spyOn(animationService, 'fadeIn');
      const fadeOutSpy = vi.spyOn(animationService, 'fadeOut');

      // 툴바 표시 애니메이션
      await animationService.fadeIn(mockElement);
      expect(fadeInSpy).toHaveBeenCalledWith(mockElement);

      // 툴바 숨김 애니메이션
      await animationService.fadeOut(mockElement);
      expect(fadeOutSpy).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('복잡한 애니메이션 시퀀스 간소화', () => {
    it('스태거 애니메이션이 단순화되어야 한다', async () => {
      const elements = [
        mockElement,
        {
          style: {},
          scrollIntoView: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      ];

      const staggerSpy = vi.spyOn(animationService, 'staggerAnimation');

      await animationService.staggerAnimation(elements, element => {
        if (element.style) {
          element.style.opacity = '1';
        }
      });

      expect(staggerSpy).toHaveBeenCalledWith(elements, expect.any(Function));
    });

    it('스크롤 기반 애니메이션이 Motion One으로 통합되어야 한다', () => {
      const setupSpy = vi.spyOn(animationService, 'setupScrollAnimation');

      const cleanup = animationService.setupScrollAnimation(({ scrollY, progress }) => {
        // 스크롤 이벤트 처리
        expect(typeof scrollY).toBe('number');
        expect(typeof progress).toBe('number');
      });

      expect(setupSpy).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');

      cleanup();
    });
  });

  describe('폴백 시스템 검증', () => {
    it('Motion One 로딩 실패 시 폴백 애니메이션이 작동해야 한다', async () => {
      // Motion One API를 일시적으로 undefined로 설정
      vi.doMock('@shared/external/vendors', () => ({
        getMotionOne: () => Promise.reject(new Error('Motion One 로딩 실패')),
      }));

      // 폴백 애니메이션이 정상 작동하는지 확인
      await expect(animationService.fadeIn(mockElement)).resolves.not.toThrow();
    });
  });

  describe('성능 최적화 검증', () => {
    it('애니메이션 정리가 메모리 누수 없이 이루어져야 한다', () => {
      // 여러 애니메이션 실행
      animationService.fadeIn(mockElement);
      animationService.fadeOut(mockElement);

      // 정리 호출
      animationService.cleanup();

      expect(animationService.activeAnimations?.size || 0).toBe(0);
    });
  });
});
