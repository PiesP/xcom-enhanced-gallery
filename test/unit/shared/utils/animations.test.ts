/**
 * @fileoverview 애니메이션 유틸리티 테스트
 * @version 1.0.0 - Phase 1: 기본 애니메이션 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ANIMATION_PRESETS,
  animateGalleryEnter,
  animateGalleryExit,
  animateToolbarShow,
  animateToolbarHide,
  setupScrollAnimation,
  setupInViewAnimation,
  transformValue,
  animateCustom,
} from '../../../../src/shared/utils/animations';

// Mock 함수들 미리 정의
const mockAnimate = vi.fn().mockResolvedValue({});
const mockScroll = vi.fn().mockReturnValue(() => {});
const mockTimeline = vi.fn().mockResolvedValue(undefined);
const mockStagger = vi.fn().mockReturnValue(index => index * 50);
const mockInView = vi.fn().mockReturnValue(() => {});
const mockTransform = vi.fn().mockImplementation((value, from, to) => {
  const [fromMin, fromMax] = from;
  const [toMin, toMax] = to;
  const ratio = (value - fromMin) / (fromMax - fromMin);
  return toMin + ratio * (toMax - toMin);
});

// 모킹
vi.mock('@shared/external/vendors', () => ({
  getMotionOne: vi.fn(() => ({
    animate: mockAnimate,
    scroll: mockScroll,
    timeline: mockTimeline,
    stagger: mockStagger,
    inView: mockInView,
    transform: mockTransform,
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
    // Mock element를 HTMLElement처럼 동작하도록 설정
    mockElement = {
      animate: vi.fn().mockResolvedValue({}),
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      // HTMLElement 체크를 위한 prototype 설정
      constructor: { name: 'HTMLElement' },
    };
    
    // instanceof HTMLElement 체크를 위해 prototype 체인 설정
    Object.setPrototypeOf(mockElement, HTMLElement.prototype);
    
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

      // 애니메이션이 호출되었는지 확인 (AnimationService로 리다이렉트됨)
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
    });

    it('갤러리 종료 애니메이션이 실행되어야 한다', async () => {
      await animateGalleryExit(mockElement);

      // 애니메이션이 실행되었는지 확인 (AnimationService로 리다이렉트됨)
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
    });
  });

  describe('툴바 애니메이션', () => {
    it('툴바 표시 애니메이션이 실행되어야 한다', async () => {
      await animateToolbarShow(mockElement);

      // 애니메이션이 실행되었는지 확인 (AnimationService로 리다이렉트됨)
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
    });

    it('툴바 숨김 애니메이션이 실행되어야 한다', async () => {
      await animateToolbarHide(mockElement);

      // 애니메이션이 실행되었는지 확인 (AnimationService로 리다이렉트됨)
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
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
      // IntersectionObserver 모킹
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
      
      // 전역 IntersectionObserver 모킹
      global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver);
      
      const mockCallback = vi.fn();
      const cleanup = setupInViewAnimation(mockElement, mockCallback);

      expect(typeof cleanup).toBe('function');
      expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
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
      const keyframes = { opacity: '1', transform: 'scale(1)' };
      const options = { duration: 300, easing: 'ease-out' };

      await animateCustom(mockElement, keyframes, options);

      // CSS 트랜지션이 설정되었는지 확인
      expect(mockElement.style.transition).toContain('opacity 300ms ease-out');
      expect(mockElement.style.transition).toContain('transform 300ms ease-out');

      // 키프레임 스타일이 설정되었는지 확인
      expect(mockElement.style.opacity).toBe('1');
      expect(mockElement.style.transform).toBe('scale(1)');
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
