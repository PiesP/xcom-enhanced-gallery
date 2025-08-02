/**
 * @fileoverview 통합된 애니메이션 서비스
 * @description css-animations와 통합된 완전한 애니메이션 기능
 * @version 4.0.0 - Phase 3: 통합
 */

import { logger } from '@shared/logging';

// CSS 애니메이션 상수들 (css-animations에서 통합)
export const ANIMATION_CONSTANTS = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,
  EASING_EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASING_EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASING_EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  STAGGER_DELAY: 50,
} as const;

export const ANIMATION_CLASSES = {
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  SLIDE_IN_BOTTOM: 'animate-slide-in-bottom',
  SLIDE_OUT_TOP: 'animate-slide-out-top',
  SCALE_IN: 'animate-scale-in',
  SCALE_OUT: 'animate-scale-out',
  TOOLBAR_SLIDE_DOWN: 'animate-toolbar-slide-down',
  TOOLBAR_SLIDE_UP: 'animate-toolbar-slide-up',
  IMAGE_LOAD: 'animate-image-load',
  REDUCED_MOTION: 'reduced-motion',
} as const;

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
}

/**
 * 통합된 애니메이션 서비스 (싱글톤)
 *
 * 주요 기능:
 * - CSS 기반 애니메이션 (css-animations 통합)
 * - 갤러리 전용 애니메이션
 * - 스태거 애니메이션
 * - 유저스크립트 최적화
 */
export class AnimationService {
  private static instance: AnimationService | null = null;
  private stylesInjected = false;

  private constructor() {
    this.ensureStylesInjected();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): AnimationService {
    if (!AnimationService.instance) {
      AnimationService.instance = new AnimationService();
    }
    return AnimationService.instance;
  }

  /**
   * 고급 CSS 애니메이션 스타일 주입 (css-animations 통합)
   */
  private ensureStylesInjected(): void {
    if (this.stylesInjected || document.getElementById('xcom-animations')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'xcom-animations';
    style.textContent = `
      /* 키프레임 애니메이션 */
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
      @keyframes toolbar-slide-down {
        from { opacity: 0; transform: translateY(-100%); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes toolbar-slide-up {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-100%); }
      }
      @keyframes image-load {
        from { opacity: 0; filter: blur(4px); }
        to { opacity: 1; filter: blur(0); }
      }

      /* CSS 클래스 */
      .animate-fade-in { animation: fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      .animate-fade-out { animation: fade-out 150ms cubic-bezier(0.4, 0, 1, 1) forwards; }
      .animate-slide-in-bottom { animation: slide-in-bottom 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      .animate-slide-out-top { animation: slide-out-top 150ms cubic-bezier(0.4, 0, 1, 1) forwards; }
      .animate-scale-in { animation: scale-in 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      .animate-scale-out { animation: scale-out 150ms cubic-bezier(0.4, 0, 1, 1) forwards; }
      .animate-toolbar-slide-down { animation: toolbar-slide-down 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      .animate-toolbar-slide-up { animation: toolbar-slide-up 150ms cubic-bezier(0.4, 0, 1, 1) forwards; }
      .animate-image-load { animation: image-load 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }

      /* 기존 호환성 클래스 */
      .xcom-fade-in {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      .xcom-fade-in.active {
        opacity: 1;
      }
      .xcom-fade-out {
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
      }
      .xcom-fade-out.active {
        opacity: 0;
      }
      .xcom-slide-in {
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.3s ease-out;
      }
      .xcom-slide-in.active {
        transform: translateY(0);
        opacity: 1;
      }

      /* 접근성 고려 */
      @media (prefers-reduced-motion: reduce) {
        .animate-fade-in, .animate-fade-out, .animate-slide-in-bottom,
        .animate-slide-out-top, .animate-scale-in, .animate-scale-out,
        .animate-toolbar-slide-down, .animate-toolbar-slide-up, .animate-image-load {
          animation: none;
        }
        .xcom-fade-in, .xcom-fade-out, .xcom-slide-in {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);
    this.stylesInjected = true;
    logger.debug('통합된 애니메이션 스타일이 주입되었습니다.');
  }

  /**
   * 갤러리 진입 애니메이션 (css-animations 통합)
   */
  public async animateGalleryEnter(element: Element, config: AnimationConfig = {}): Promise<void> {
    return new Promise<void>(resolve => {
      try {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          element.classList.remove(ANIMATION_CLASSES.FADE_IN);
          config.onComplete?.();
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
   * 갤러리 종료 애니메이션 (css-animations 통합)
   */
  public async animateGalleryExit(element: Element, config: AnimationConfig = {}): Promise<void> {
    return new Promise<void>(resolve => {
      try {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          element.classList.remove(ANIMATION_CLASSES.FADE_OUT);
          config.onComplete?.();
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
   * 이미지 아이템 스태거 애니메이션 (css-animations 통합)
   */
  public async animateImageItemsEnter(elements: Element[]): Promise<void> {
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

          setTimeout(() => {
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
   * 애니메이션 정리 (css-animations 통합)
   */
  public cleanupAnimations(element: Element): void {
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

  /**
   * 요소 페이드인 애니메이션
   */
  public async fadeIn(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    const duration = config.duration || 300;

    element.classList.add('xcom-fade-in');

    if (config.delay) {
      await this.delay(config.delay);
    }

    element.classList.add('active');

    await this.delay(duration);
  }

  /**
   * 요소 페이드아웃 애니메이션
   */
  public async fadeOut(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    const duration = config.duration || 300;

    element.classList.add('xcom-fade-out');

    if (config.delay) {
      await this.delay(config.delay);
    }

    element.classList.add('active');

    await this.delay(duration);
  }

  /**
   * 슬라이드 인 애니메이션
   */
  public async slideIn(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    const duration = config.duration || 300;

    element.classList.add('xcom-slide-in');

    if (config.delay) {
      await this.delay(config.delay);
    }

    element.classList.add('active');

    await this.delay(duration);
  }

  /**
   * 갤러리 열기 애니메이션
   */
  public async openGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    await this.fadeIn(element, config);
  }

  /**
   * 갤러리 닫기 애니메이션
   */
  public async closeGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    await this.fadeOut(element, config);
  }

  /**
   * 기본 요소 애니메이션
   */
  public animateElement(element: Element, config: AnimationConfig = {}): void {
    this.fadeIn(element, config).catch(error => {
      logger.warn('Animation failed:', error);
    });
  }

  /**
   * 모든 애니메이션 정리
   */
  public cleanup(): void {
    const elements = document.querySelectorAll('.xcom-fade-in, .xcom-fade-out, .xcom-slide-in');
    elements.forEach(element => {
      element.classList.remove('xcom-fade-in', 'xcom-fade-out', 'xcom-slide-in', 'active');
    });
  }

  /**
   * 비동기 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 편의 함수들
// 편의 함수들
/**
 * 요소 애니메이션 편의 함수
 */
export function animateElement(element: Element, config?: AnimationConfig): void {
  const service = AnimationService.getInstance();
  service.animateElement(element, config);
}

/**
 * 페이드아웃 편의 함수
 */
export function fadeOut(element: Element, config?: AnimationConfig): Promise<void> {
  const service = AnimationService.getInstance();
  return service.fadeOut(element, config);
}

/**
 * 갤러리 열기 애니메이션 편의 함수
 */
export function openGalleryWithAnimation(
  element: Element,
  config?: AnimationConfig
): Promise<void> {
  const service = AnimationService.getInstance();
  return service.openGallery(element, config);
}

/**
 * 갤러리 닫기 애니메이션 편의 함수
 */
export function closeGalleryWithAnimation(
  element: Element,
  config?: AnimationConfig
): Promise<void> {
  const service = AnimationService.getInstance();
  return service.closeGallery(element, config);
}
