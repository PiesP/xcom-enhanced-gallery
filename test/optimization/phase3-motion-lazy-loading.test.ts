/**
 * LazyMotionService 테스트
 * Motion One 라이브러리 지연 로딩 기능 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock 설정
const mockMotionAPI = {
  animate: vi.fn(),
  scroll: vi.fn(),
  timeline: vi.fn(),
  stagger: vi.fn(),
  inView: vi.fn(),
};

const mockGetMotion = vi.fn(() => mockMotionAPI);

vi.mock('@shared/external/vendors', () => ({
  getMotion: mockGetMotion,
}));

vi.mock('@shared/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LazyMotionService', () => {
  let LazyMotionService: typeof import('@shared/services/LazyMotionService').LazyMotionService;
  let animateWhenReady: typeof import('@shared/services/LazyMotionService').animateWhenReady;
  let scrollAnimationWhenReady: typeof import('@shared/services/LazyMotionService').scrollAnimationWhenReady;
  let inViewAnimationWhenReady: typeof import('@shared/services/LazyMotionService').inViewAnimationWhenReady;

  beforeEach(async () => {
    vi.clearAllMocks();

    // 동적 import로 LazyMotionService 로드
    const module = await import('@shared/services/LazyMotionService');
    LazyMotionService = module.LazyMotionService;
    animateWhenReady = module.animateWhenReady;
    scrollAnimationWhenReady = module.scrollAnimationWhenReady;
    inViewAnimationWhenReady = module.inViewAnimationWhenReady;

    // 각 테스트 전에 캐시 초기화
    LazyMotionService.resetCache();
  });

  afterEach(() => {
    LazyMotionService.resetCache();
  });

  describe('기본 지연 로딩 기능', () => {
    it('처음 호출 시 Motion API를 동적으로 로드해야 한다', async () => {
      expect(LazyMotionService.isMotionLoaded()).toBe(false);

      const result = await LazyMotionService.loadMotionAPI();

      expect(result.success).toBe(true);
      expect(result.motionAPI).toBeDefined();
      expect(mockGetMotion).toHaveBeenCalledTimes(1);
      expect(LazyMotionService.isMotionLoaded()).toBe(true);
    });

    it('두 번째 호출 시 캐시된 API를 반환해야 한다', async () => {
      // 첫 번째 호출
      await LazyMotionService.loadMotionAPI();
      expect(mockGetMotion).toHaveBeenCalledTimes(1);

      // 두 번째 호출
      const result = await LazyMotionService.loadMotionAPI();

      expect(result.success).toBe(true);
      expect(result.motionAPI).toBeDefined();
      expect(mockGetMotion).toHaveBeenCalledTimes(1); // 여전히 1번만 호출
    });

    it('로딩 실패 시 적절한 에러를 반환해야 한다', async () => {
      mockGetMotion.mockImplementationOnce(() => {
        throw new Error('Motion loading failed');
      });

      const result = await LazyMotionService.loadMotionAPI();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Motion loading failed');
      expect(result.motionAPI).toBeUndefined();
    });
  });

  describe('애니메이션 기능별 지연 로딩', () => {
    it('animateElement가 Motion API를 로드하고 애니메이션을 실행해야 한다', async () => {
      const element = document.createElement('div');
      const keyframes = { opacity: [0, 1] };
      const options = { duration: 1000 };

      mockMotionAPI.animate.mockReturnValue('animation-result');

      const result = await LazyMotionService.animateElement(element, keyframes, options);

      expect(mockGetMotion).toHaveBeenCalledTimes(1);
      expect(mockMotionAPI.animate).toHaveBeenCalledWith(element, keyframes, options);
      expect(result).toBe('animation-result');
    });

    it('setupScrollAnimation이 Motion API를 로드하고 스크롤 핸들러를 설정해야 한다', async () => {
      const callback = vi.fn();
      const options = { offset: ['0%', '100%'] };
      const cleanupFn = vi.fn();

      mockMotionAPI.scroll.mockReturnValue(cleanupFn);

      const result = await LazyMotionService.setupScrollAnimation(callback, options);

      expect(mockGetMotion).toHaveBeenCalledTimes(1);
      expect(mockMotionAPI.scroll).toHaveBeenCalledWith(callback, options);
      expect(result).toBe(cleanupFn);
    });

    it('setupInViewAnimation이 Motion API를 로드하고 인뷰 핸들러를 설정해야 한다', async () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      const options = { threshold: 0.5 };
      const cleanupFn = vi.fn();

      mockMotionAPI.inView.mockReturnValue(cleanupFn);

      const result = await LazyMotionService.setupInViewAnimation(element, callback, options);

      expect(mockGetMotion).toHaveBeenCalledTimes(1);
      expect(mockMotionAPI.inView).toHaveBeenCalledWith(element, callback, options);
      expect(result).toBe(cleanupFn);
    });
  });

  describe('편의 함수', () => {
    it('animateWhenReady가 LazyMotionService.animateElement를 호출해야 한다', async () => {
      const element = document.createElement('div');
      const keyframes = { transform: ['translateX(0)', 'translateX(100px)'] };

      mockMotionAPI.animate.mockReturnValue('animate-result');

      const result = await animateWhenReady(element, keyframes);

      expect(mockMotionAPI.animate).toHaveBeenCalledWith(element, keyframes, undefined);
      expect(result).toBe('animate-result');
    });

    it('scrollAnimationWhenReady가 LazyMotionService.setupScrollAnimation을 호출해야 한다', async () => {
      const callback = vi.fn();
      const cleanupFn = vi.fn();

      mockMotionAPI.scroll.mockReturnValue(cleanupFn);

      const result = await scrollAnimationWhenReady(callback);

      expect(mockMotionAPI.scroll).toHaveBeenCalledWith(callback, undefined);
      expect(result).toBe(cleanupFn);
    });

    it('inViewAnimationWhenReady가 LazyMotionService.setupInViewAnimation을 호출해야 한다', async () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      const cleanupFn = vi.fn();

      mockMotionAPI.inView.mockReturnValue(cleanupFn);

      const result = await inViewAnimationWhenReady(element, callback);

      expect(mockMotionAPI.inView).toHaveBeenCalledWith(element, callback, undefined);
      expect(result).toBe(cleanupFn);
    });
  });

  describe('동시 호출 처리', () => {
    it('여러 번의 동시 호출이 하나의 로딩만 실행해야 한다', async () => {
      const promises = [
        LazyMotionService.loadMotionAPI(),
        LazyMotionService.loadMotionAPI(),
        LazyMotionService.loadMotionAPI(),
      ];

      const results = await Promise.all(promises);

      expect(mockGetMotion).toHaveBeenCalledTimes(1);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.motionAPI).toBeDefined();
      });
    });
  });

  describe('에러 처리', () => {
    it('Motion API 로딩 실패 시 적절한 에러 메시지를 반환해야 한다', async () => {
      mockGetMotion.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const result = await LazyMotionService.loadMotionAPI();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('Motion API가 invalid할 때 에러를 반환해야 한다', async () => {
      mockGetMotion.mockImplementationOnce(() => ({})); // animate 함수 없음

      const result = await LazyMotionService.loadMotionAPI();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Motion API not properly loaded');
    });

    it('애니메이션 함수 호출 시 로딩 실패하면 에러를 던져야 한다', async () => {
      mockGetMotion.mockImplementationOnce(() => {
        throw new Error('Loading failed');
      });

      const element = document.createElement('div');

      await expect(LazyMotionService.animateElement(element, { opacity: [0, 1] })).rejects.toThrow(
        'Failed to load Motion API: Loading failed'
      );
    });
  });

  describe('성능 최적화 검증', () => {
    it('사용하지 않으면 Motion API가 로드되지 않아야 한다', () => {
      // Motion 관련 함수를 호출하지 않음
      expect(LazyMotionService.isMotionLoaded()).toBe(false);
      expect(mockGetMotion).not.toHaveBeenCalled();
    });

    it('캐시 초기화 후에는 다시 로딩해야 한다', async () => {
      // 첫 번째 로딩
      await LazyMotionService.loadMotionAPI();
      expect(mockGetMotion).toHaveBeenCalledTimes(1);

      // 캐시 초기화
      LazyMotionService.resetCache();
      expect(LazyMotionService.isMotionLoaded()).toBe(false);

      // 두 번째 로딩
      await LazyMotionService.loadMotionAPI();
      expect(mockGetMotion).toHaveBeenCalledTimes(2);
    });
  });
});
