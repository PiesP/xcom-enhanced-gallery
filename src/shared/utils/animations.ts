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
import { globalTimerManager } from './timer-management';

// 별칭 제거: 공식 API만 유지(toolbarSlideDown/toolbarSlideUp)

// Motion One 관련 함수들을 CSS 기반으로 교체
type DurationToken = 'fast' | 'normal' | 'slow';
type EasingToken = 'standard' | 'decelerate' | 'accelerate';

interface AnimateCustomOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  durationToken?: DurationToken;
  easingToken?: EasingToken;
}

export const animateCustom = async (
  element: Element,
  keyframes: Record<string, string | number>,
  options?: AnimateCustomOptions
): Promise<void> => {
  // CSS 트랜지션으로 변환 (토큰 우선)
  const htmlElement = element as HTMLElement;

  const TOKEN_DURATION_MS: Record<DurationToken, number> = {
    fast: 150,
    normal: 300,
    slow: 500,
  } as const;

  const durationVar = options?.durationToken
    ? `var(--xeg-duration-${options.durationToken})`
    : typeof options?.duration === 'number'
      ? `${options.duration}ms`
      : 'var(--xeg-duration-normal)';

  const easingVar = options?.easingToken
    ? `var(--xeg-ease-${options.easingToken})`
    : (options?.easing ?? 'var(--xeg-ease-standard)');

  const delayMs = options?.delay ?? 0;
  const durationMs = options?.durationToken
    ? TOKEN_DURATION_MS[options.durationToken]
    : (options?.duration ?? 300);

  return new Promise<void>(resolve => {
    const transition = Object.keys(keyframes)
      .map(prop => `${prop} ${durationVar} ${easingVar}`)
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

    globalTimerManager.setTimeout(() => {
      resolve();
    }, durationMs + delayMs);
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
type OnScrollFn = (info: { scrollY: number; progress: number }) => void;
type ScrollEntry = { handler: () => void; refCount: number };
// Module-scoped registry for idempotency (target -> (onScroll -> entry))
const SCROLL_REGISTRY: WeakMap<object, Map<OnScrollFn, ScrollEntry>> = new WeakMap();

export const setupScrollAnimation = (
  onScroll: OnScrollFn,
  container?: Element | null
): (() => void) => {
  // Idempotency guard: avoid duplicate registrations for same target + onScroll

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / maxScroll, 1);
    onScroll({ scrollY, progress });
  };

  const target = container || window;

  // Registry keying: per target, per onScroll function identity
  const targetKey = target as unknown as object;
  let map = SCROLL_REGISTRY.get(targetKey);
  if (!map) {
    map = new Map();
    SCROLL_REGISTRY.set(targetKey, map);
  }

  const existing = map.get(onScroll);
  if (existing) {
    existing.refCount += 1;
  } else {
    target.addEventListener('scroll', handleScroll, { passive: true });
    map.set(onScroll, { handler: handleScroll, refCount: 1 });
  }

  return () => {
    const entry = map!.get(onScroll);
    if (!entry) {
      // Fallback: if not found, attempt direct removal
      try {
        target.removeEventListener('scroll', handleScroll as EventListener);
      } catch {
        // ignore
      }
      return;
    }

    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      target.removeEventListener('scroll', entry.handler as EventListener);
      map!.delete(onScroll);
      if (map!.size === 0) {
        SCROLL_REGISTRY.delete(targetKey);
      }
    }
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

// Phase 2: JS 프리셋 경로를 정식 API로 노출
export const toolbarSlideDown = async (element: Element): Promise<void> => {
  // 최종 상태로 전환(초기 상태는 CSS 또는 호출측에서 관리)
  return animateCustom(
    element,
    { opacity: '1', transform: 'translateY(0)' },
    {
      durationToken: 'fast',
      easingToken: 'decelerate',
    }
  );
};

export const toolbarSlideUp = async (element: Element): Promise<void> => {
  // 툴바를 상단으로 숨기는 상태로 전환
  return animateCustom(
    element,
    { opacity: '0', transform: 'translateY(-100%)' },
    {
      durationToken: 'fast',
      easingToken: 'accelerate',
    }
  );
};
