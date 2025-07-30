/**
 * CSS 기반 단순화된 애니메이션 서비스
 *
 * @description CSS 트랜지션과 키프레임을 활용한 성능 최적화된 애니메이션 서비스
 * Motion One 라이브러리 의존성 제거 및 번들 크기 최적화
 */

import { logger } from '@shared/logging';
import {
  animateGalleryEnter,
  animateGalleryExit,
  cleanupAnimations,
  injectAnimationStyles,
  ANIMATION_CLASSES,
  type CSSAnimationOptions,
} from '@shared/utils/css-animations';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  repeat?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
}

export interface ScrollAnimationConfig {
  container?: Element | null;
  threshold?: number;
  once?: boolean;
}

/**
 * CSS 기반 단순화된 애니메이션 서비스
 * - CSS 키프레임과 트랜지션을 활용한 성능 최적화
 * - 메모리 누수 방지를 위한 자동 정리
 * - GPU 가속 속성 활용
 * - 접근성 고려 (prefers-reduced-motion)
 */
export class SimpleAnimationService {
  private static instance: SimpleAnimationService | null = null;
  private readonly activeAnimations = new Set<() => void>();
  private stylesInjected = false;

  private constructor() {
    this.setupCleanup();
    this.ensureStylesInjected();
  }

  public static getInstance(): SimpleAnimationService {
    SimpleAnimationService.instance ??= new SimpleAnimationService();
    return SimpleAnimationService.instance;
  }

  /**
   * CSS 애니메이션 스타일이 주입되었는지 확인
   */
  private ensureStylesInjected(): void {
    if (!this.stylesInjected) {
      injectAnimationStyles();
      this.stylesInjected = true;
    }
  }

  /**
   * 요소 페이드인 애니메이션 (CSS 기반)
   */
  public async fadeIn(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      this.ensureStylesInjected();

      const options: CSSAnimationOptions = {
        ...(config.duration && { duration: config.duration }),
        ...(config.easing && { easing: config.easing }),
        ...(config.delay && { delay: config.delay }),
      };

      await animateGalleryEnter(element, options);
    } catch (error) {
      logger.warn('fadeIn 애니메이션 실패:', error);
      this.fallbackFadeIn(element, config);
    }
  }

  /**
   * 요소 페이드아웃 애니메이션 (CSS 기반)
   */
  public async fadeOut(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      this.ensureStylesInjected();

      const options: CSSAnimationOptions = {
        ...(config.duration && { duration: config.duration }),
        ...(config.easing && { easing: config.easing }),
        ...(config.delay && { delay: config.delay }),
      };

      await animateGalleryExit(element, options);
    } catch (error) {
      logger.warn('fadeOut 애니메이션 실패:', error);
      this.fallbackFadeOut(element, config);
    }
  }

  /**
   * 슬라이드 인 애니메이션 (CSS 기반)
   */
  public async slideIn(
    element: Element,
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    config: AnimationConfig = {}
  ): Promise<void> {
    try {
      this.ensureStylesInjected();

      const className =
        direction === 'up' ? ANIMATION_CLASSES.SLIDE_IN_BOTTOM : ANIMATION_CLASSES.FADE_IN;

      element.classList.add(className);

      return new Promise<void>(resolve => {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          element.classList.remove(className);
          resolve();
        };

        element.addEventListener('animationend', handleAnimationEnd);

        if (config.delay) {
          setTimeout(() => {
            element.classList.add(className);
          }, config.delay);
        }
      });
    } catch (error) {
      logger.warn('slideIn 애니메이션 실패:', error);
      this.fallbackSlideIn(element, direction, config);
    }
  }

  /**
   * 스케일 애니메이션 (CSS 기반)
   */
  public async scale(
    element: Element,
    fromScale: number,
    toScale: number,
    config: AnimationConfig = {}
  ): Promise<void> {
    try {
      this.ensureStylesInjected();

      const htmlElement = element as HTMLElement;
      const duration = config.duration || 300;
      const easing = config.easing || 'cubic-bezier(0.4, 0, 0.2, 1)';

      htmlElement.style.transition = `transform ${duration}ms ${easing}`;
      htmlElement.style.transform = `scale(${fromScale})`;

      return new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          htmlElement.style.transform = `scale(${toScale})`;

          setTimeout(() => {
            htmlElement.style.transition = '';
            resolve();
          }, duration);
        });
      });
    } catch (error) {
      logger.warn('scale 애니메이션 실패:', error);
      this.fallbackScale(element, fromScale, toScale, config);
    }
  }

  /**
   * 회전 애니메이션 (CSS 기반)
   */
  public async rotate(
    element: Element,
    fromAngle: number,
    toAngle: number,
    config: AnimationConfig = {}
  ): Promise<void> {
    try {
      const htmlElement = element as HTMLElement;
      const duration = config.duration || 300;
      const easing = config.easing || 'cubic-bezier(0.4, 0, 0.2, 1)';

      htmlElement.style.transition = `transform ${duration}ms ${easing}`;
      htmlElement.style.transform = `rotate(${fromAngle}deg)`;

      return new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          htmlElement.style.transform = `rotate(${toAngle}deg)`;

          setTimeout(() => {
            htmlElement.style.transition = '';
            resolve();
          }, duration);
        });
      });
    } catch (error) {
      logger.warn('rotate 애니메이션 실패:', error);
    }
  }

  /**
   * 갤러리 열기 애니메이션 (CSS 기반)
   */
  public async openGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      this.ensureStylesInjected();
      element.classList.add(ANIMATION_CLASSES.SCALE_IN);

      return new Promise<void>(resolve => {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          element.classList.remove(ANIMATION_CLASSES.SCALE_IN);
          resolve();
        };

        element.addEventListener('animationend', handleAnimationEnd);
      });
    } catch (error) {
      logger.warn('openGallery 애니메이션 실패:', error);
      this.fallbackOpenGallery(element, config);
    }
  }

  /**
   * 갤러리 닫기 애니메이션 (CSS 기반)
   */
  public async closeGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      this.ensureStylesInjected();
      element.classList.add(ANIMATION_CLASSES.SCALE_OUT);

      return new Promise<void>(resolve => {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          element.classList.remove(ANIMATION_CLASSES.SCALE_OUT);
          resolve();
        };

        element.addEventListener('animationend', handleAnimationEnd);
      });
    } catch (error) {
      logger.warn('closeGallery 애니메이션 실패:', error);
      this.fallbackCloseGallery(element, config);
    }
  }

  /**
   * 스크롤 기반 애니메이션 설정 (CSS 기반)
   */
  public setupScrollAnimation(
    onScroll: (info: { scrollY: number; progress: number }) => void,
    config: ScrollAnimationConfig = {}
  ): () => void {
    try {
      const handleScroll = () => {
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(scrollY / maxScroll, 1);
        onScroll({ scrollY, progress });
      };

      const target = config.container || window;
      target.addEventListener('scroll', handleScroll, { passive: true });

      const cleanup = () => {
        target.removeEventListener('scroll', handleScroll);
      };

      this.activeAnimations.add(cleanup);
      return cleanup;
    } catch (error) {
      logger.warn('스크롤 애니메이션 설정 실패:', error);
      return () => {};
    }
  }

  /**
   * 뷰포트 진입 애니메이션 (CSS 기반)
   */
  public setupInViewAnimation(
    element: Element,
    onInView: () => void,
    config: ScrollAnimationConfig = {}
  ): () => void {
    try {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              element.classList.add(ANIMATION_CLASSES.FADE_IN);
              onInView();

              if (config.once) {
                observer.disconnect();
              }
            }
          });
        },
        {
          threshold: config.threshold || 0.1,
        }
      );

      observer.observe(element);

      const cleanup = () => {
        observer.disconnect();
      };

      this.activeAnimations.add(cleanup);
      return cleanup;
    } catch (error) {
      logger.warn('뷰포트 진입 애니메이션 설정 실패:', error);
      return () => {};
    }
  }

  /**
   * 애니메이션 정리
   */
  public cleanup(element?: Element): void {
    if (element) {
      cleanupAnimations(element);
    } else {
      // 모든 활성 애니메이션 정리
      this.activeAnimations.forEach(cleanup => cleanup());
      this.activeAnimations.clear();
    }
  }

  /**
   * 폴백 페이드인 애니메이션
   */
  private fallbackFadeIn(element: Element, config: AnimationConfig): void {
    const htmlElement = element as HTMLElement;
    const duration = config.duration || 300;

    htmlElement.style.opacity = '0';
    htmlElement.style.transition = `opacity ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      htmlElement.style.opacity = '1';
    });
  }

  /**
   * 폴백 페이드아웃 애니메이션
   */
  private fallbackFadeOut(element: Element, config: AnimationConfig): void {
    const htmlElement = element as HTMLElement;
    const duration = config.duration || 300;

    htmlElement.style.transition = `opacity ${duration}ms ease-in`;
    htmlElement.style.opacity = '0';
  }

  /**
   * 폴백 슬라이드인 애니메이션
   */
  private fallbackSlideIn(
    element: Element,
    direction: 'up' | 'down' | 'left' | 'right',
    config: AnimationConfig
  ): void {
    const htmlElement = element as HTMLElement;
    const duration = config.duration || 300;

    let transform = '';
    switch (direction) {
      case 'up':
        transform = 'translateY(20px)';
        break;
      case 'down':
        transform = 'translateY(-20px)';
        break;
      case 'left':
        transform = 'translateX(20px)';
        break;
      case 'right':
        transform = 'translateX(-20px)';
        break;
    }

    htmlElement.style.transform = transform;
    htmlElement.style.opacity = '0';
    htmlElement.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      htmlElement.style.transform = 'translate(0, 0)';
      htmlElement.style.opacity = '1';
    });
  }

  /**
   * 폴백 스케일 애니메이션
   */
  private fallbackScale(
    element: Element,
    fromScale: number,
    toScale: number,
    config: AnimationConfig
  ): void {
    const htmlElement = element as HTMLElement;
    const duration = config.duration || 300;

    htmlElement.style.transform = `scale(${fromScale})`;
    htmlElement.style.transition = `transform ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      htmlElement.style.transform = `scale(${toScale})`;
    });
  }

  /**
   * 폴백 갤러리 열기 애니메이션
   */
  private fallbackOpenGallery(element: Element, config: AnimationConfig): void {
    const htmlElement = element as HTMLElement;
    const duration = config.duration || 400;

    htmlElement.style.opacity = '0';
    htmlElement.style.transform = 'scale(0.8)';
    htmlElement.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      htmlElement.style.opacity = '1';
      htmlElement.style.transform = 'scale(1)';
    });
  }

  /**
   * 폴백 갤러리 닫기 애니메이션
   */
  private fallbackCloseGallery(element: Element, config: AnimationConfig): void {
    const htmlElement = element as HTMLElement;
    const duration = config.duration || 300;

    htmlElement.style.transition = `opacity ${duration}ms ease-in, transform ${duration}ms ease-in`;
    htmlElement.style.opacity = '0';
    htmlElement.style.transform = 'scale(0.8)';
  }

  /**
   * 정리 설정
   */
  private setupCleanup(): void {
    // 페이지 언로드 시 정리
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }
}

// 편의 함수들 export
const serviceInstance = SimpleAnimationService.getInstance();

/**
 * 요소 애니메이션 편의 함수
 */
export const animateElement = (element: Element, config: AnimationConfig = {}): void => {
  serviceInstance.fadeIn(element, config);
};

/**
 * 페이드 아웃 편의 함수
 */
export const fadeOut = (element: Element, config: AnimationConfig = {}): Promise<void> => {
  return serviceInstance.fadeOut(element, config);
};

/**
 * 갤러리 열기 애니메이션 편의 함수
 */
export const openGalleryWithAnimation = (
  element: Element,
  config: AnimationConfig = {}
): Promise<void> => {
  return serviceInstance.openGallery(element, config);
};

/**
 * 갤러리 닫기 애니메이션 편의 함수
 */
export const closeGalleryWithAnimation = (
  element: Element,
  config: AnimationConfig = {}
): Promise<void> => {
  return serviceInstance.closeGallery(element, config);
};
