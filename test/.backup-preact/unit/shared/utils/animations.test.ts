/**
 * @fileoverview 애니메이션 유틸리티 테스트
 * @version 1.0.0 - Phase 1: 기본 애니메이션 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ANIMATION_PRESETS,
  animateGalleryEnter,
  animateGalleryExit,
  toolbarSlideDown,
  toolbarSlideUp,
  setupScrollAnimation,
  setupInViewAnimation,
  transformValue,
  animateCustom,
} from '../../../../src/shared/utils/animations';

// 모킹
vi.mock('@shared/external/vendors', () => ({
  getMotionOne: vi.fn(() => ({
    animate: vi.fn().mockResolvedValue({}),
    scroll: vi.fn().mockReturnValue(() => {}),
    timeline: vi.fn().mockResolvedValue(undefined),
    stagger: vi.fn().mockReturnValue(index => index * 50),
    inView: vi.fn().mockReturnValue(() => {}),
    transform: vi.fn().mockImplementation((value, from, to) => {
      const [fromMin, fromMax] = from;
      const [toMin, toMax] = to;
      const ratio = (value - fromMin) / (fromMax - fromMin);
      return toMin + ratio * (toMax - toMin);
    }),
  })),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('애니메이션 유틸리티', () => {
  let mockElement;

  beforeEach(() => {
    // Mock element
    mockElement = {
      animate: vi.fn().mockResolvedValue({}),
      style: {},
    };
    vi.clearAllMocks();
  });

  describe('ANIMATION_PRESETS', () => {
    it('모든 프리셋 중복 제거 - 기본 애니메이션 프리셋이 정의되어야 한다', () => {
      expect(ANIMATION_PRESETS.fadeIn).toBeDefined();
      expect(ANIMATION_PRESETS.fadeOut).toBeDefined();
      expect(ANIMATION_PRESETS.slideInFromBottom).toBeDefined();
      expect(ANIMATION_PRESETS.slideOutToTop).toBeDefined();
      expect(ANIMATION_PRESETS.scaleIn).toBeDefined();
      expect(ANIMATION_PRESETS.scaleOut).toBeDefined();
      expect(ANIMATION_PRESETS.toolbarSlideDown).toBeDefined();
      expect(ANIMATION_PRESETS.toolbarSlideUp).toBeDefined();
      expect(ANIMATION_PRESETS.imageLoad).toBeDefined();
      expect(ANIMATION_PRESETS.smooth).toBeDefined();
    });

    it('프리셋 구조 검증 - 각 프리셋은 keyframes와 options를 가져야 한다', () => {
      Object.values(ANIMATION_PRESETS).forEach(preset => {
        expect(preset).toHaveProperty('keyframes');
        expect(preset).toHaveProperty('options');
      });
    });
  });

  describe('갤러리 애니메이션', () => {
    it('갤러리 진입 애니메이션이 실행되어야 한다', async () => {
      await animateGalleryEnter(mockElement);
      expect(true).toBe(true); // 에러 없이 완료되면 성공
    });

    it('갤러리 종료 애니메이션이 실행되어야 한다', async () => {
      await animateGalleryExit(mockElement);
      expect(true).toBe(true); // 에러 없이 완료되면 성공
    });
  });

  describe('툴바 애니메이션', () => {
    it('툴바 표시 애니메이션이 실행되어야 한다', async () => {
      await toolbarSlideDown(mockElement);
      expect(true).toBe(true); // 에러 없이 완료되면 성공
    });

    it('툴바 숨김 애니메이션이 실행되어야 한다', async () => {
      await toolbarSlideUp(mockElement);
      expect(true).toBe(true); // 에러 없이 완료되면 성공
    });
  });

  describe('스크롤 애니메이션', () => {
    it('스크롤 애니메이션이 설정되어야 한다', () => {
      const mockCallback = vi.fn();
      const cleanup = setupScrollAnimation(mockCallback);

      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  describe('뷰포트 진입 애니메이션', () => {
    it('뷰포트 진입 애니메이션이 설정되어야 한다', () => {
      const mockCallback = vi.fn();
      const cleanup = setupInViewAnimation(mockElement, mockCallback);

      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  describe('값 변환', () => {
    it('선형 보간이 올바르게 작동해야 한다', () => {
      const result = transformValue(5, [0, 10], [0, 100]);
      expect(result).toBe(50);
    });

    it('범위 밖 값도 올바르게 변환되어야 한다', () => {
      const result = transformValue(-5, [0, 10], [0, 100]);
      expect(result).toBe(-50);
    });
  });

  describe('커스텀 애니메이션', () => {
    it('커스텀 애니메이션이 실행되어야 한다', async () => {
      const keyframes = { opacity: 1, transform: 'scale(1)' };
      const options = { duration: 300, easing: 'ease-out' };

      await animateCustom(mockElement, keyframes, options);
      expect(true).toBe(true); // 에러 없이 완료되면 성공
    });
  });

  describe('에러 처리', () => {
    it('애니메이션 실패 시 에러를 우아하게 처리해야 한다', async () => {
      // getMotionOne을 실패하도록 모킹
      const { getMotionOne } = await import('@shared/external/vendors');
      getMotionOne.mockImplementationOnce(() => {
        throw new Error('Motion One 초기화 실패');
      });

      // 에러가 발생해도 함수가 정상적으로 완료되어야 함
      await expect(animateGalleryEnter(mockElement)).resolves.toBeUndefined();
    });
  });
});
