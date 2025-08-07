/**
 * @fileoverview 애니메이션 유틸리티 - CSS 기반 시스템
 * @version 2.0.0 - Phase 2: Motion One에서 CSS 애니메이션으로 교체
 *
 * @description
 * CSS 트랜지션과 키프레임을 사용한 성능 최적화된 애니메이션 시스템
 * Motion One 라이브러리 의존성 제거 및 번들 크기 최적화
 */

// AnimationService 기반 시스템으로 완전 교체 - 중복 제거
import {
  AnimationService,
  ANIMATION_CLASSES,
  ANIMATION_CONSTANTS,
  type AnimationConfig as CSSAnimationOptions,
} from '../services/animation-service';

const animationService = AnimationService.getInstance();

// 애니메이션 함수들을 AnimationService로 리다이렉트
export const injectAnimationStyles = () => {
  // AnimationService는 자동으로 스타일을 주입하므로 getInstance만 호출
  AnimationService.getInstance();
};
export const animateGalleryEnter = (element: HTMLElement) =>
  animationService.animateGalleryEnter(element);
export const animateGalleryExit = (element: HTMLElement) =>
  animationService.animateGalleryExit(element);
export const animateImageItemsEnter = (elements: HTMLElement[]) =>
  animationService.animateImageItemsEnter(elements);
export const cleanupAnimations = (element?: HTMLElement) => {
  if (element) {
    animationService.cleanupAnimations(element);
  } else {
    // 전역 정리는 document.body를 대상으로
    animationService.cleanupAnimations(document.body);
  }
};

// 상수들 재내보내기
export { ANIMATION_CLASSES, ANIMATION_CONSTANTS, type CSSAnimationOptions };

// 기존 함수들을 AnimationService로 리다이렉트하여 하위 호환성 유지
export const animateToolbarShow = (element: HTMLElement) =>
  animationService.animateGalleryEnter(element);
export const animateToolbarHide = (element: HTMLElement) =>
  animationService.animateGalleryExit(element);
export const animateImageLoad = (element: HTMLElement) =>
  animationService.animateGalleryEnter(element);

// Motion One 관련 함수들을 CSS 기반으로 교체
export const animateCustom = async (
  element: Element,
  keyframes: Record<string, string | number>,
  options?: { duration?: number; easing?: string; delay?: number }
): Promise<void> => {
  // CSS 트랜지션으로 변환
  const htmlElement = element as HTMLElement;
  const duration = options?.duration || 300;
  const easing = options?.easing || 'cubic-bezier(0.4, 0, 0.2, 1)';

  return new Promise<void>(resolve => {
    const transition = Object.keys(keyframes)
      .map(prop => `${prop} ${duration}ms ${easing}`)
      .join(', ');

    htmlElement.style.transition = transition;

    Object.entries(keyframes).forEach(([prop, value]) => {
      // 브라우저 환경에서만 스타일 설정
      if (typeof htmlElement.style.setProperty === 'function') {
        htmlElement.style.setProperty(prop, String(value));
      } else {
        // 폴백: 직접 할당
        (htmlElement.style as CSSStyleDeclaration & Record<string, string>)[prop] = String(value);
      }
    });

    setTimeout(
      () => {
        resolve();
      },
      duration + (options?.delay || 0)
    );
  });
};

export const animateParallel = async (
  animations: Array<{
    element: Element;
    keyframes: Record<string, string | number>;
    options?: { duration?: number; easing?: string; delay?: number };
  }>
): Promise<void> => {
  const promises = animations.map(({ element, keyframes, options }) =>
    animateCustom(element, keyframes, options)
  );
  await Promise.all(promises);
};

// Motion One 특수 기능들을 간소화된 버전으로 교체
export const setupScrollAnimation = (
  onScroll: (info: { scrollY: number; progress: number }) => void,
  container?: Element | null
): (() => void) => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / maxScroll, 1);
    onScroll({ scrollY, progress });
  };

  const target = container || window;
  target.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    target.removeEventListener('scroll', handleScroll);
  };
};

export const setupInViewAnimation = (
  element: Element,
  onInView: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): (() => void) => {
  // 브라우저 환경이 아니거나 IntersectionObserver가 없으면 빈 함수 반환
  // 테스트 환경을 위해 global과 window 둘 다 체크
  const IntersectionObserverClass =
    (typeof globalThis !== 'undefined' && globalThis.IntersectionObserver) ||
    (typeof window !== 'undefined' && window.IntersectionObserver) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (typeof globalThis !== 'undefined' && (globalThis as any).IntersectionObserver);

  if (!IntersectionObserverClass) {
    return () => {};
  }

  const observer = new IntersectionObserverClass((entries: IntersectionObserverEntry[]) => {
    entries.forEach(onInView);
  }, options);

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
};

export const transformValue = (
  value: number,
  fromRange: [number, number],
  toRange: [number, number]
): number => {
  const [fromMin, fromMax] = fromRange;
  const [toMin, toMax] = toRange;
  const progress = (value - fromMin) / (fromMax - fromMin);
  return toMin + progress * (toMax - toMin);
};

// 애니메이션 프리셋 상수들 (하위 호환성)
export const ANIMATION_PRESETS = {
  fadeIn: {
    keyframes: { opacity: [0, 1] } as PropertyIndexedKeyframes,
    options: { duration: 300, easing: 'ease-out' },
  },
  fadeOut: {
    keyframes: { opacity: [1, 0] } as PropertyIndexedKeyframes,
    options: { duration: 200, easing: 'ease-in' },
  },
  slideInFromBottom: {
    keyframes: {
      opacity: [0, 1],
      transform: ['translateY(20px)', 'translateY(0px)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 300, easing: 'ease-out' },
  },
  slideOutToTop: {
    keyframes: {
      opacity: [1, 0],
      transform: ['translateY(0px)', 'translateY(-20px)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 200, easing: 'ease-in' },
  },
  scaleIn: {
    keyframes: {
      opacity: [0, 1],
      transform: ['scale(0.95)', 'scale(1)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 250, easing: 'ease-out' },
  },
  scaleOut: {
    keyframes: {
      opacity: [1, 0],
      transform: ['scale(1)', 'scale(0.95)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 200, easing: 'ease-in' },
  },
  toolbarSlideDown: {
    keyframes: {
      opacity: [0, 1],
      transform: ['translateY(-100%)', 'translateY(0)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 200, easing: 'ease-out' },
  },
  toolbarSlideUp: {
    keyframes: {
      opacity: [1, 0],
      transform: ['translateY(0)', 'translateY(-100%)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 200, easing: 'ease-in' },
  },
  imageLoad: {
    keyframes: {
      opacity: [0, 1],
      filter: ['blur(4px)', 'blur(0px)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 400, easing: 'ease-out' },
  },
  smooth: {
    keyframes: {} as PropertyIndexedKeyframes,
    options: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  },
} as const;
