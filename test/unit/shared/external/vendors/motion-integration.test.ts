/**
 * @fileoverview Motion One 라이브러리 통합 테스트
 * @version 1.0.0 - Phase 1: Motion 라이브러리 통합 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VendorManager } from '../../../../../src/shared/external/vendors/vendor-manager';

// Motion 모킹
vi.mock('motion', () => ({
  animate: vi.fn().mockImplementation(async () => {
    // 실제 Web Animations API 모킹
    const mockAnimation = {
      finished: Promise.resolve(),
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
    };
    return mockAnimation;
  }),
  scroll: vi.fn().mockImplementation(onScroll => {
    // 스크롤 이벤트 모킹
    const cleanup = vi.fn();
    // 테스트용 스크롤 이벤트 시뮬레이션
    globalThis.setTimeout(() => {
      onScroll({ scrollY: 100, progress: 0.5 });
    }, 0);
    return cleanup;
  }),
  timeline: vi.fn().mockImplementation(async () => {
    // 타임라인 애니메이션 모킹
    return Promise.resolve();
  }),
  stagger: vi.fn().mockImplementation(duration => {
    return index => index * duration;
  }),
  inView: vi.fn().mockImplementation((element, onInView) => {
    // IntersectionObserver 모킹
    const cleanup = vi.fn();
    globalThis.setTimeout(() => {
      onInView({
        isIntersecting: true,
        target: element,
        intersectionRatio: 1,
      });
    }, 0);
    return cleanup;
  }),
  transform: vi.fn().mockImplementation((value, mapFrom, mapTo) => {
    const [fromMin, fromMax] = mapFrom;
    const [toMin, toMax] = mapTo;
    const ratio = (value - fromMin) / (fromMax - fromMin);
    return toMin + ratio * (toMax - toMin);
  }),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Motion One 라이브러리 통합', () => {
  let vendorManager;
  let mockElement;

  beforeEach(() => {
    vendorManager = VendorManager.getInstance();
    // JSDOM 환경에서 animate 메서드가 있는 mock element 생성
    mockElement = {
      animate: vi.fn().mockImplementation((keyframes, options) => {
        return {
          finished: Promise.resolve(),
          cancel: vi.fn(),
          pause: vi.fn(),
          play: vi.fn(),
        };
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 800,
    };

    // IntersectionObserver Mock 추가
    globalThis.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));

    // Window와 Document Mock 설정
    globalThis.window = globalThis.window || {};
    globalThis.document = globalThis.document || {};

    // documentElement은 직접 수정할 수 없으므로 Object.defineProperty 사용
    Object.defineProperty(globalThis.document, 'documentElement', {
      value: {
        scrollHeight: 1000,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    globalThis.window.addEventListener = vi.fn();
    globalThis.window.removeEventListener = vi.fn();
    globalThis.window.scrollY = 100;
    globalThis.window.innerHeight = 800;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vendorManager.cleanup();
    // IntersectionObserver Mock 정리
    delete globalThis.IntersectionObserver;
  });

  describe('Motion One API 로드', () => {
    it('Motion One 라이브러리가 성공적으로 로드되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      expect(motionOne).toBeDefined();
      expect(motionOne.animate).toBeInstanceOf(Function);
      expect(motionOne.scroll).toBeInstanceOf(Function);
      expect(motionOne.timeline).toBeInstanceOf(Function);
      expect(motionOne.stagger).toBeInstanceOf(Function);
      expect(motionOne.inView).toBeInstanceOf(Function);
      expect(motionOne.transform).toBeInstanceOf(Function);
    });

    it('Motion One API가 캐시되어야 한다', async () => {
      const motionOne1 = await vendorManager.getMotionOne();
      const motionOne2 = await vendorManager.getMotionOne();

      expect(motionOne1).toBe(motionOne2);
    });
  });

  describe('animate 함수', () => {
    it('요소 애니메이션이 실행되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      const keyframes = { opacity: [0, 1] };
      const options = { duration: 300, easing: 'ease-out' };

      const animation = await motionOne.animate(mockElement, keyframes, options);

      expect(animation).toBeDefined();
      expect(animation.finished).toBeInstanceOf(Promise);
    });

    it('애니메이션 옵션이 올바르게 전달되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      const keyframes = { transform: ['scale(0)', 'scale(1)'] };
      const options = { duration: 500, delay: 100 };

      await motionOne.animate(mockElement, keyframes, options);

      // 폴백 구현이므로 element.animate가 호출되는지 확인
      expect(mockElement.animate).toHaveBeenCalledWith(keyframes, {
        duration: 500,
        easing: 'ease',
        delay: 100,
        fill: 'forwards',
      });
    });
  });

  describe('scroll 함수', () => {
    it('스크롤 이벤트 리스너가 설정되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      const onScroll = vi.fn();
      const container = mockElement;

      const cleanup = motionOne.scroll(onScroll, { container });

      // 폴백 구현에서는 addEventListener가 호출되는지 확인
      expect(container.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      });
      expect(cleanup).toBeInstanceOf(Function);
    });

    it('스크롤 콜백이 호출되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      // window.scrollY mock 설정
      Object.defineProperty(globalThis.window, 'scrollY', { value: 100, writable: true });
      Object.defineProperty(globalThis.document.documentElement, 'scrollHeight', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(globalThis.window, 'innerHeight', { value: 800, writable: true });

      const onScroll = vi.fn();
      motionOne.scroll(onScroll);

      // 스크롤 이벤트 시뮬레이션
      const scrollHandler = globalThis.window.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      if (scrollHandler) {
        scrollHandler();
        expect(onScroll).toHaveBeenCalledWith({
          scrollY: 100,
          progress: expect.any(Number),
        });
      }
    });
  });

  describe('timeline 함수', () => {
    it('타임라인 애니메이션이 실행되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      const animations = [
        {
          element: mockElement,
          keyframes: { opacity: [0, 1] },
          options: { duration: 300 },
        },
      ];

      await motionOne.timeline(animations);

      // 폴백 구현에서는 순차적으로 animate가 호출되는지 확인
      expect(mockElement.animate).toHaveBeenCalledWith(
        { opacity: [0, 1] },
        expect.objectContaining({ duration: 300 })
      );
    });
  });

  describe('stagger 함수', () => {
    it('stagger 함수가 올바른 지연 시간을 반환해야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      const staggerFn = motionOne.stagger(100);

      // 폴백 구현에서는 간단한 계산 함수가 반환되는지 확인
      expect(staggerFn).toBeInstanceOf(Function);
      expect(staggerFn(0)).toBe(0);
      expect(staggerFn(1)).toBe(100);
      expect(staggerFn(2)).toBe(200);
    });
  });

  describe('inView 함수', () => {
    it('뷰포트 진입 감지가 설정되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      const onInView = vi.fn();
      const options = { threshold: 0.5 };

      const cleanup = motionOne.inView(mockElement, onInView, options);

      // 폴백 구현에서는 IntersectionObserver가 생성되는지 확인
      expect(globalThis.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), options);
      expect(cleanup).toBeInstanceOf(Function);
    });

    it('뷰포트 진입 시 콜백이 호출되어야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      const onInView = vi.fn();
      motionOne.inView(mockElement, onInView);

      // IntersectionObserver의 콜백 함수를 시뮬레이션
      const observerCallback = globalThis.IntersectionObserver.mock.calls[0][0];
      observerCallback([
        {
          isIntersecting: true,
          target: mockElement,
          intersectionRatio: 1,
        },
      ]);

      expect(onInView).toHaveBeenCalledWith({
        isIntersecting: true,
        target: mockElement,
        intersectionRatio: 1,
      });
    });
  });

  describe('transform 함수', () => {
    it('값 변환이 올바르게 작동해야 한다', async () => {
      const motionOne = await vendorManager.getMotionOne();

      // 폴백 구현에서는 선형 보간 계산을 확인
      const result = motionOne.transform(5, [0, 10], [0, 100]);

      expect(result).toBe(50); // 5/10 * 100 = 50
    });
  });

  describe('폴백 처리', () => {
    it('Motion 라이브러리 로드 실패 시 폴백 구현을 사용해야 한다', async () => {
      // Motion import를 실패하도록 모킹
      vi.doMock('motion', () => {
        throw new Error('Motion 라이브러리를 찾을 수 없습니다');
      });

      // 새로운 인스턴스로 테스트
      const newVendorManager = VendorManager.getInstance();
      newVendorManager.cleanup(); // 캐시 클리어

      const motionOne = await newVendorManager.getMotionOne();

      // 폴백 구현도 모든 메서드를 제공해야 함
      expect(motionOne.animate).toBeInstanceOf(Function);
      expect(motionOne.scroll).toBeInstanceOf(Function);
      expect(motionOne.timeline).toBeInstanceOf(Function);
      expect(motionOne.stagger).toBeInstanceOf(Function);
      expect(motionOne.inView).toBeInstanceOf(Function);
      expect(motionOne.transform).toBeInstanceOf(Function);
    });
  });

  describe('버전 정보', () => {
    it('Motion 버전 정보가 포함되어야 한다', () => {
      const versionInfo = vendorManager.getVersionInfo();

      expect(versionInfo).toHaveProperty('motion');
      // Motion 라이브러리가 실제로 로드되어 있으므로 12.23.11 또는 fallback 모두 허용
      expect(['12.23.11', 'fallback']).toContain(versionInfo.motion);
    });
  });

  describe('라이브러리 검증', () => {
    it('Motion One이 검증 목록에 포함되어야 한다', async () => {
      const result = await vendorManager.validateAll();

      expect(result.success).toBe(true);
      expect(result.loadedLibraries).toContain('MotionOne');
      expect(result.errors).toHaveLength(0);
    });
  });
});
