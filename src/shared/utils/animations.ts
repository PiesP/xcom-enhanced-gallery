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
