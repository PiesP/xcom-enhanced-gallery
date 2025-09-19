/**
 * @fileoverview CSS 기반 애니메이션 시스템 - Motion One 대체
 * @version 2.0.0 - Phase 2: 애니메이션 시스템 단순화
 *
 * @description
 * CSS 트랜지션과 키프레임을 사용한 성능 최적화된 애니메이션 시스템
 * Motion One 라이브러리 의존성 제거 및 번들 크기 최적화
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from '@shared/utils';

// CSS 애니메이션 변수 및 상수
export const ANIMATION_CONSTANTS = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,
  EASING_EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASING_EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASING_EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  STAGGER_DELAY: 50,
} as const;

// CSS 클래스 상수
export const ANIMATION_CLASSES = {
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  SLIDE_IN_BOTTOM: 'animate-slide-in-bottom',
  SLIDE_OUT_TOP: 'animate-slide-out-top',
  SCALE_IN: 'animate-scale-in',
  SCALE_OUT: 'animate-scale-out',
  // DEPRECATED: toolbar visibility is hover/CSS-variable based; keep constants for compatibility only
  TOOLBAR_SLIDE_DOWN: 'animate-toolbar-slide-down',
  TOOLBAR_SLIDE_UP: 'animate-toolbar-slide-up',
  IMAGE_LOAD: 'animate-image-load',
  REDUCED_MOTION: 'reduced-motion',
} as const;

/**
 * CSS 애니메이션 옵션 인터페이스
 */
export interface CSSAnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
}

/**
 * CSS 키프레임을 DOM에 주입
 */
export function injectAnimationStyles(): void {
  const styleId = 'xcom-gallery-animations';

  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes slide-in-bottom {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-out-top {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes scale-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.95); }
    }
    @keyframes image-load {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }

  .animate-fade-in { animation: fade-in var(--xeg-duration-normal) var(--xeg-ease-standard) forwards; }
  .animate-fade-out { animation: fade-out var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards; }
  .animate-slide-in-bottom { animation: slide-in-bottom var(--xeg-duration-normal) var(--xeg-ease-decelerate) forwards; }
  .animate-slide-out-top { animation: slide-out-top var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards; }
  .animate-scale-in { animation: scale-in var(--xeg-duration-normal) var(--xeg-ease-standard) forwards; }
  .animate-scale-out { animation: scale-out var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards; }
  .animate-image-load { animation: image-load var(--xeg-duration-slow) var(--xeg-ease-decelerate) forwards; }

    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in, .animate-fade-out, .animate-slide-in-bottom,
      .animate-slide-out-top, .animate-scale-in, .animate-scale-out,
      .animate-image-load {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  logger.debug('CSS 애니메이션 스타일이 주입되었습니다.');
}

/**
 * 갤러리 컨테이너 진입 애니메이션 (CSS 기반)
 */
export async function animateGalleryEnter(
  element: Element,
  options: CSSAnimationOptions = {}
): Promise<void> {
  return new Promise<void>(resolve => {
    try {
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.classList.remove(ANIMATION_CLASSES.FADE_IN);
        options.onComplete?.();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
      element.classList.add(ANIMATION_CLASSES.FADE_IN);
    } catch (error) {
      logger.warn('갤러리 진입 애니메이션 실패:', error);
      resolve();
    }
  });
}

/**
 * 갤러리 컨테이너 종료 애니메이션 (CSS 기반)
 */
export async function animateGalleryExit(
  element: Element,
  options: CSSAnimationOptions = {}
): Promise<void> {
  return new Promise<void>(resolve => {
    try {
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.classList.remove(ANIMATION_CLASSES.FADE_OUT);
        options.onComplete?.();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
      element.classList.add(ANIMATION_CLASSES.FADE_OUT);
    } catch (error) {
      logger.warn('갤러리 종료 애니메이션 실패:', error);
      resolve();
    }
  });
}

/**
 * 이미지 아이템 진입 애니메이션 (스태거 효과, CSS 기반)
 */
export async function animateImageItemsEnter(elements: Element[]): Promise<void> {
  return new Promise<void>(resolve => {
    try {
      let completedCount = 0;
      const totalElements = elements.length;

      if (totalElements === 0) {
        resolve();
        return;
      }

      elements.forEach((element, index) => {
        const delay = index * ANIMATION_CONSTANTS.STAGGER_DELAY;

        // 테스트/정리 경로 일원화를 위해 전역 타이머 매니저 사용
        globalTimerManager.setTimeout(() => {
          const handleAnimationEnd = () => {
            element.removeEventListener('animationend', handleAnimationEnd);
            element.classList.remove(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
            completedCount++;

            if (completedCount === totalElements) {
              resolve();
            }
          };

          element.addEventListener('animationend', handleAnimationEnd);
          element.classList.add(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
        }, delay);
      });
    } catch (error) {
      logger.warn('이미지 아이템 진입 애니메이션 실패:', error);
      resolve();
    }
  });
}

/**
 * 애니메이션 정리 유틸리티
 */
export function cleanupAnimations(element: Element): void {
  Object.values(ANIMATION_CLASSES).forEach(className => {
    element.classList.remove(className);
  });

  const htmlElement = element as HTMLElement;
  htmlElement.style.animation = '';

  try {
    htmlElement.style.removeProperty('--animation-duration');
  } catch {
    // removeProperty가 없는 모킹 환경에서는 무시
  }
}
