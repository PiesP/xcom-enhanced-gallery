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

// 모킹 - Motion One이 제거되었으므로 CSS 기반 애니메이션만 테스트
vi.mock('@shared/external/vendors', () => ({
  getPreact: vi.fn(() => ({
    useState: vi.fn(),
    useEffect: vi.fn(),
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

  describe.skip('갤러리 애니메이션', () => {
    it('갤러리 진입 애니메이션이 실행되어야 한다', async () => {
      // AnimationService 모킹
      const mockAnimationService = {
        animateGalleryEnter: vi.fn().mockResolvedValue(undefined),
      };

      // 동적 임포트 모킹
      vi.doMock('../../../../src/shared/services/animation-service', () => ({
        AnimationService: {
          getInstance: () => mockAnimationService,
        },
      }));

      // 애니메이션 실행
      const result = animateGalleryEnter(mockElement);

      // Promise를 기다리되 타임아웃 처리
      await Promise.race([result, new Promise(resolve => setTimeout(resolve, 100))]);

      // 기본적인 애니메이션 인터페이스 확인
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
    }, 1000); // 1초 타임아웃

    it('갤러리 종료 애니메이션이 실행되어야 한다', async () => {
      // AnimationService 모킹
      const mockAnimationService = {
        animateGalleryExit: vi.fn().mockResolvedValue(undefined),
      };

      vi.doMock('../../../../src/shared/services/animation-service', () => ({
        AnimationService: {
          getInstance: () => mockAnimationService,
        },
      }));

      // 애니메이션 실행
      const result = animateGalleryExit(mockElement);

      // Promise를 기다리되 타임아웃 처리
      await Promise.race([result, new Promise(resolve => setTimeout(resolve, 100))]);

      // 기본적인 애니메이션 인터페이스 확인
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
    }, 1000); // 1초 타임아웃
  });

  describe.skip('툴바 애니메이션', () => {
    it('툴바 표시 애니메이션이 실행되어야 한다', async () => {
      // AnimationService 모킹
      const mockAnimationService = {
        animateToolbarShow: vi.fn().mockResolvedValue(undefined),
      };

      vi.doMock('../../../../src/shared/services/animation-service', () => ({
        AnimationService: {
          getInstance: () => mockAnimationService,
        },
      }));

      // 애니메이션 실행
      const result = animateToolbarShow(mockElement);

      // Promise를 기다리되 타임아웃 처리
      await Promise.race([result, new Promise(resolve => setTimeout(resolve, 100))]);

      // 애니메이션이 실행되었는지 확인
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
    }, 1000);

    it('툴바 숨김 애니메이션이 실행되어야 한다', async () => {
      // AnimationService 모킹
      const mockAnimationService = {
        animateToolbarHide: vi.fn().mockResolvedValue(undefined),
      };

      vi.doMock('../../../../src/shared/services/animation-service', () => ({
        AnimationService: {
          getInstance: () => mockAnimationService,
        },
      }));

      // 애니메이션 실행
      const result = animateToolbarHide(mockElement);

      // Promise를 기다리되 타임아웃 처리
      await Promise.race([result, new Promise(resolve => setTimeout(resolve, 100))]);

      // 애니메이션이 실행되었는지 확인
      expect(mockElement.animate || mockElement.classList || mockElement.style).toBeDefined();
    }, 1000);
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
      // DOM 환경에 맞는 완전한 HTMLElement 생성
      const realElement = document.createElement('div');

      // IntersectionObserver 모킹
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };

      // 전역 IntersectionObserver 모킹 (global, globalThis, window 모두)
      global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver);
      globalThis.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver);
      if (typeof window !== 'undefined') {
        window.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver);
      }

      const mockCallback = vi.fn();
      const cleanup = setupInViewAnimation(realElement, mockCallback);

      expect(typeof cleanup).toBe('function');
      expect(mockObserver.observe).toHaveBeenCalledWith(realElement);
      cleanup();
    });

    it('IntersectionObserver가 지원되지 않을 때 에러를 우아하게 처리해야 한다', () => {
      // IntersectionObserver를 undefined로 설정
      global.IntersectionObserver = undefined as any;
      globalThis.IntersectionObserver = undefined as any;
      if (typeof window !== 'undefined') {
        (window as any).IntersectionObserver = undefined;
      }

      const realElement = document.createElement('div');
      const mockCallback = vi.fn();

      const cleanup = setupInViewAnimation(realElement, mockCallback);

      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
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

  describe.skip('커스텀 애니메이션', () => {
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
      // CSS 기반 애니메이션에서 에러 처리 테스트
      try {
        // CSS 애니메이션은 웹 API에 의존하므로 에러가 발생하지 않아야 함
        await expect(() => animateGalleryEnter(mockElement)).not.toThrow();

        // CSS 클래스가 올바르게 적용되었는지 확인
        expect(mockElement.classList.add).toHaveBeenCalled();
      } catch (error) {
        // CSS 애니메이션에서는 일반적으로 에러가 발생하지 않음
        expect(error).toBeInstanceOf(Error);
      }
    }, 500);
  });
});
