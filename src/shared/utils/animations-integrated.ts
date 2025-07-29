/**
 * 통합된 애니메이션 유틸리티
 *
 * @description SimpleAnimationService 기반으로 기존 애니메이션 함수들을 래핑
 * @version 1.0.0 - Phase 3 통합
 */

import { SimpleAnimationService } from '@shared/services/SimpleAnimationService';
import { logger } from '@shared/logging';

// SimpleAnimationService 인스턴스
const animationService = SimpleAnimationService.getInstance();

/**
 * 갤러리 컨테이너 진입 애니메이션
 * @deprecated 기존 함수 - SimpleAnimationService.openGallery 사용 권장
 */
export async function animateGalleryEnter(element: Element): Promise<void> {
  try {
    await animationService.openGallery(element, {
      duration: 400,
      easing: 'ease-out',
    });
    logger.debug('갤러리 진입 애니메이션 완료 (SimpleAnimationService)');
  } catch (error) {
    logger.warn('갤러리 진입 애니메이션 실패:', error);
  }
}

/**
 * 갤러리 컨테이너 종료 애니메이션
 * @deprecated 기존 함수 - SimpleAnimationService.closeGallery 사용 권장
 */
export async function animateGalleryExit(element: Element): Promise<void> {
  try {
    await animationService.closeGallery(element, {
      duration: 300,
      easing: 'ease-in',
    });
    logger.debug('갤러리 종료 애니메이션 완료 (SimpleAnimationService)');
  } catch (error) {
    logger.warn('갤러리 종료 애니메이션 실패:', error);
  }
}

/**
 * 툴바 표시 애니메이션
 * @deprecated 기존 함수 - SimpleAnimationService.fadeIn 사용 권장
 */
export async function animateToolbarShow(element: Element): Promise<void> {
  try {
    await animationService.fadeIn(element, {
      duration: 200,
      easing: 'ease-out',
    });
    logger.debug('툴바 표시 애니메이션 완료 (SimpleAnimationService)');
  } catch (error) {
    logger.warn('툴바 표시 애니메이션 실패:', error);
  }
}

/**
 * 툴바 숨김 애니메이션
 * @deprecated 기존 함수 - SimpleAnimationService.fadeOut 사용 권장
 */
export async function animateToolbarHide(element: Element): Promise<void> {
  try {
    await animationService.fadeOut(element, {
      duration: 200,
      easing: 'ease-in',
    });
    logger.debug('툴바 숨김 애니메이션 완료 (SimpleAnimationService)');
  } catch (error) {
    logger.warn('툴바 숨김 애니메이션 실패:', error);
  }
}

/**
 * 이미지 로딩 완료 애니메이션
 * @deprecated 기존 함수 - SimpleAnimationService.fadeIn 사용 권장
 */
export async function animateImageLoad(element: Element): Promise<void> {
  try {
    await animationService.fadeIn(element, {
      duration: 400,
      easing: 'ease-out',
    });
    logger.debug('이미지 로딩 애니메이션 완료 (SimpleAnimationService)');
  } catch (error) {
    logger.warn('이미지 로딩 애니메이션 실패:', error);
  }
}

/**
 * 이미지 아이템 진입 애니메이션 (stagger 효과)
 * @deprecated 기존 함수 - SimpleAnimationService.staggerAnimation 사용 권장
 */
export async function animateImageItemsEnter(elements: Element[]): Promise<void> {
  try {
    await animationService.staggerAnimation(
      elements,
      async element => {
        await animationService.fadeIn(element, {
          duration: 300,
          easing: 'ease-out',
        });
      },
      50 // 50ms 간격
    );
    logger.debug('이미지 아이템 진입 애니메이션 완료 (SimpleAnimationService)');
  } catch (error) {
    logger.warn('이미지 아이템 진입 애니메이션 실패:', error);
  }
}

/**
 * 스크롤 기반 애니메이션 설정
 * @deprecated 기존 함수 - SimpleAnimationService.setupScrollAnimation 사용 권장
 */
export function setupScrollAnimation(
  onScroll: (info: { scrollY: number; progress: number }) => void,
  container?: Element | null
): () => void {
  try {
    const cleanup = animationService.setupScrollAnimation(onScroll, {
      container: container || null,
    });

    logger.debug('스크롤 애니메이션 설정 완료 (SimpleAnimationService)');
    return cleanup;
  } catch (error) {
    logger.warn('스크롤 애니메이션 설정 실패:', error);
    return () => {}; // no-op cleanup function
  }
}

/**
 * 뷰포트 진입 감지 애니메이션
 * @deprecated 기존 함수 - SimpleAnimationService.setupInViewAnimation 사용 권장
 */
export function setupInViewAnimation(
  element: Element,
  onInView: () => void,
  options?: { threshold?: number; once?: boolean }
): () => void {
  try {
    const cleanup = animationService.setupInViewAnimation(element, onInView, {
      threshold: options?.threshold ?? 0,
      once: options?.once ?? false,
    });

    logger.debug('인뷰 애니메이션 설정 완료 (SimpleAnimationService)');
    return cleanup;
  } catch (error) {
    logger.warn('인뷰 애니메이션 설정 실패:', error);
    return () => {}; // no-op cleanup function
  }
}

// 새로운 통합 API - 직접적으로 SimpleAnimationService 사용 권장
export { SimpleAnimationService } from '@shared/services/SimpleAnimationService';

/**
 * 편의 함수들 - SimpleAnimationService의 직접 접근을 위한 래퍼
 */
export const animationAPI = {
  /**
   * 페이드인 애니메이션
   */
  fadeIn: (element: Element, options?: { duration?: number; easing?: string; delay?: number }) =>
    animationService.fadeIn(element, options),

  /**
   * 페이드아웃 애니메이션
   */
  fadeOut: (element: Element, options?: { duration?: number; easing?: string; delay?: number }) =>
    animationService.fadeOut(element, options),

  /**
   * 갤러리 열기 애니메이션
   */
  openGallery: (element: Element, options?: { duration?: number; easing?: string }) =>
    animationService.openGallery(element, options),

  /**
   * 갤러리 닫기 애니메이션
   */
  closeGallery: (element: Element, options?: { duration?: number; easing?: string }) =>
    animationService.closeGallery(element, options),

  /**
   * 스크롤 애니메이션 설정
   */
  setupScroll: (
    callback: (info: { scrollY: number; progress: number }) => void,
    container?: Element | null
  ) => animationService.setupScrollAnimation(callback, { container: container || null }),

  /**
   * 인뷰 애니메이션 설정
   */
  setupInView: (
    element: Element,
    callback: () => void,
    options?: { threshold?: number; once?: boolean }
  ) => animationService.setupInViewAnimation(element, callback, options),

  /**
   * 스태거 애니메이션
   */
  stagger: (
    elements: Element[],
    animation: (element: Element, index: number) => void,
    delay = 100
  ) => animationService.staggerAnimation(elements, animation, delay),

  /**
   * 애니메이션 정리
   */
  cleanup: () => animationService.cleanup(),
};
