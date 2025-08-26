/**
 * @fileoverview 애니메이션 유틸리티 - CSS 기반 시스템
 * @version 2.0.0 - Phase 2: Motion One에서 CSS 애니메이션으로 교체
 *
 * @description
 * CSS 트랜지션과 키프레임을 사용한 성능 최적화된 애니메이션 시스템
 * Motion One 라이브러리 의존성 제거 및 번들 크기 최적화
 */

// CSS 기반 애니메이션 시스템으로 완전 교체
export {
  injectAnimationStyles,
  animateGalleryEnter,
  animateGalleryExit,
  animateImageItemsEnter,
  cleanupAnimations,
  ANIMATION_CLASSES,
  ANIMATION_CONSTANTS,
  type CSSAnimationOptions,
} from './css-animations';

// 기존 함수들을 CSS 기반으로 리다이렉트하여 하위 호환성 유지
export {
  animateGalleryEnter as animateToolbarShow,
  animateGalleryExit as animateToolbarHide,
  animateGalleryEnter as animateImageLoad,
} from './css-animations';

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
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return () => {};
  }

  const observer = new IntersectionObserver(entries => {
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
      transform: ['scale(0.98)', 'scale(1)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 400, easing: 'ease-out' },
  },
  smooth: {
    keyframes: {} as PropertyIndexedKeyframes,
    options: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  },
} as const;
