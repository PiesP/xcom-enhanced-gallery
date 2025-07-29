/**
 * @fileoverview 애니메이션 유틸리티 - Motion One 스타일 API
 * @version 1.0.0 - Phase 1: 기본 애니메이션 시스템
 *
 * @description
 * Web Animations API 기반의 간단하고 성능이 좋은 애니메이션 유틸리티
 * 외부 라이브러리 시스템과 통합되어 일관된 애니메이션 경험 제공
 */

import { getMotionOne } from '@shared/external/vendors';
import { logger } from '@shared/logging';

// 공통 애니메이션 프리셋
export const ANIMATION_PRESETS = {
  // 갤러리 진입/종료
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

  // 스케일 애니메이션
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

  // 툴바 애니메이션
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

  // 이미지 로딩 애니메이션
  imageLoad: {
    keyframes: {
      opacity: [0, 1],
      filter: ['blur(4px)', 'blur(0px)'],
    } as PropertyIndexedKeyframes,
    options: { duration: 400, easing: 'ease-out' },
  },

  // 부드러운 전환
  smooth: {
    keyframes: {} as PropertyIndexedKeyframes,
    options: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  },
} as const;

/**
 * 갤러리 컨테이너 진입 애니메이션
 */
export async function animateGalleryEnter(element: Element): Promise<void> {
  try {
    const motionOne = getMotionOne();
    await motionOne.animate(
      element,
      ANIMATION_PRESETS.fadeIn.keyframes,
      ANIMATION_PRESETS.fadeIn.options
    );
  } catch (error) {
    logger.warn('갤러리 진입 애니메이션 실패:', error);
  }
}

/**
 * 갤러리 컨테이너 종료 애니메이션
 */
export async function animateGalleryExit(element: Element): Promise<void> {
  try {
    const motionOne = getMotionOne();
    await motionOne.animate(
      element,
      ANIMATION_PRESETS.fadeOut.keyframes,
      ANIMATION_PRESETS.fadeOut.options
    );
  } catch (error) {
    logger.warn('갤러리 종료 애니메이션 실패:', error);
  }
}

/**
 * 이미지 아이템 진입 애니메이션 (stagger 효과)
 */
export async function animateImageItemsEnter(elements: Element[]): Promise<void> {
  try {
    const motionOne = getMotionOne();
    const stagger = motionOne.stagger(50); // 50ms 간격

    const animations = elements.map((element, index) => ({
      element,
      keyframes: ANIMATION_PRESETS.slideInFromBottom.keyframes,
      options: {
        ...ANIMATION_PRESETS.slideInFromBottom.options,
        delay: stagger(index),
      },
    }));

    await motionOne.timeline(animations);
  } catch (error) {
    logger.warn('이미지 아이템 진입 애니메이션 실패:', error);
  }
}

/**
 * 툴바 표시 애니메이션
 */
export async function animateToolbarShow(element: Element): Promise<void> {
  try {
    const motionOne = getMotionOne();
    await motionOne.animate(
      element,
      ANIMATION_PRESETS.toolbarSlideDown.keyframes,
      ANIMATION_PRESETS.toolbarSlideDown.options
    );
  } catch (error) {
    logger.warn('툴바 표시 애니메이션 실패:', error);
  }
}

/**
 * 툴바 숨김 애니메이션
 */
export async function animateToolbarHide(element: Element): Promise<void> {
  try {
    const motionOne = getMotionOne();
    await motionOne.animate(
      element,
      ANIMATION_PRESETS.toolbarSlideUp.keyframes,
      ANIMATION_PRESETS.toolbarSlideUp.options
    );
  } catch (error) {
    logger.warn('툴바 숨김 애니메이션 실패:', error);
  }
}

/**
 * 이미지 로딩 완료 애니메이션
 */
export async function animateImageLoad(element: Element): Promise<void> {
  try {
    const motionOne = getMotionOne();
    await motionOne.animate(
      element,
      ANIMATION_PRESETS.imageLoad.keyframes,
      ANIMATION_PRESETS.imageLoad.options
    );
  } catch (error) {
    logger.warn('이미지 로딩 애니메이션 실패:', error);
  }
}

/**
 * 스크롤 기반 애니메이션 설정
 */
export function setupScrollAnimation(
  onScroll: (info: { scrollY: number; progress: number }) => void,
  container?: Element | null
): () => void {
  try {
    const motionOne = getMotionOne();
    return motionOne.scroll(onScroll, container !== undefined ? { container } : undefined);
  } catch (error) {
    logger.warn('스크롤 애니메이션 설정 실패:', error);
    return () => {}; // no-op cleanup function
  }
}

/**
 * 뷰포트 진입 감지 애니메이션
 */
export function setupInViewAnimation(
  element: Element,
  onInView: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): () => void {
  try {
    const motionOne = getMotionOne();
    return motionOne.inView(element, onInView, options);
  } catch (error) {
    logger.warn('뷰포트 진입 애니메이션 설정 실패:', error);
    return () => {}; // no-op cleanup function
  }
}

/**
 * 값 변환 (linear interpolation)
 */
export function transformValue(
  value: number,
  fromRange: [number, number],
  toRange: [number, number]
): number {
  try {
    const motionOne = getMotionOne();
    return motionOne.transform(value, fromRange, toRange);
  } catch (error) {
    logger.warn('값 변환 실패:', error);
    return value; // fallback to original value
  }
}

/**
 * 커스텀 애니메이션 실행
 */
export async function animateCustom(
  element: Element,
  keyframes: Record<string, string | number>,
  options?: { duration?: number; easing?: string; delay?: number }
): Promise<void> {
  try {
    const motionOne = getMotionOne();
    await motionOne.animate(element, keyframes, options);
  } catch (error) {
    logger.warn('커스텀 애니메이션 실패:', error);
  }
}

/**
 * 병렬 애니메이션 실행
 */
export async function animateParallel(
  animations: Array<{
    element: Element;
    keyframes: Record<string, string | number>;
    options?: { duration?: number; easing?: string; delay?: number };
  }>
): Promise<void> {
  try {
    const promises = animations.map(({ element, keyframes, options }) =>
      animateCustom(element, keyframes, options)
    );
    await Promise.all(promises);
  } catch (error) {
    logger.warn('병렬 애니메이션 실패:', error);
  }
}
