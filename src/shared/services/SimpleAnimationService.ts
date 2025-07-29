/**
 * Motion One을 활용한 단순화된 애니메이션 서비스
 *
 * @description 복잡한 애니메이션 로직을 Motion One으로 위임하여 코드 단순화
 */

import { getMotionOne } from '@shared/external/vendors';
import { logger } from '@shared/logging';

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
 * 단순화된 애니메이션 서비스
 * - Motion One의 강력한 기능을 간단한 API로 제공
 * - 메모리 누수 방지를 위한 자동 정리
 * - 폴백 애니메이션 지원
 */
export class SimpleAnimationService {
  private static instance: SimpleAnimationService | null = null;
  private readonly activeAnimations = new Set<() => void>();
  private readonly fallbackAnimations = new Map<Element, number>();

  private constructor() {
    this.setupCleanup();
  }

  public static getInstance(): SimpleAnimationService {
    SimpleAnimationService.instance ??= new SimpleAnimationService();
    return SimpleAnimationService.instance;
  }

  /**
   * 요소 페이드인 애니메이션
   */
  public async fadeIn(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      const motionOne = await getMotionOne();

      const animation = await motionOne.animate(
        element,
        { opacity: [0, 1] },
        {
          duration: config.duration ?? 300,
          easing: config.easing ?? 'ease-out',
          delay: config.delay ?? 0,
        }
      );

      // 정리 함수 등록
      this.activeAnimations.add(() => animation.cancel());

      // 애니메이션 완료 후 정리
      animation.finished.then(() => {
        this.activeAnimations.delete(() => animation.cancel());
      });
    } catch (error) {
      logger.warn('fadeIn 애니메이션 실패, 폴백 사용:', error);
      this.fallbackFadeIn(element, config);
    }
  }

  /**
   * 요소 페이드아웃 애니메이션
   */
  public async fadeOut(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      const motionOne = await getMotionOne();

      const animation = await motionOne.animate(
        element,
        { opacity: [1, 0] },
        {
          duration: config.duration ?? 300,
          easing: config.easing ?? 'ease-in',
          delay: config.delay ?? 0,
        }
      );

      this.activeAnimations.add(() => animation.cancel());

      animation.finished.then(() => {
        this.activeAnimations.delete(() => animation.cancel());
      });
    } catch (error) {
      logger.warn('fadeOut 애니메이션 실패, 폴백 사용:', error);
      this.fallbackFadeOut(element, config);
    }
  }

  /**
   * 갤러리 열기 애니메이션
   */
  public async openGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      const motionOne = await getMotionOne();

      // 복합 애니메이션: 크기 + 투명도
      const animation = await motionOne.animate(
        element,
        {
          opacity: [0, 1],
          transform: ['scale(0.8)', 'scale(1)'],
        },
        {
          duration: config.duration ?? 400,
          easing: config.easing ?? 'ease-out',
          delay: config.delay ?? 0,
        }
      );

      this.activeAnimations.add(() => animation.cancel());

      animation.finished.then(() => {
        this.activeAnimations.delete(() => animation.cancel());
      });
    } catch (error) {
      logger.warn('openGallery 애니메이션 실패, 폴백 사용:', error);
      this.fallbackOpenGallery(element, config);
    }
  }

  /**
   * 갤러리 닫기 애니메이션
   */
  public async closeGallery(element: Element, config: AnimationConfig = {}): Promise<void> {
    try {
      const motionOne = await getMotionOne();

      const animation = await motionOne.animate(
        element,
        {
          opacity: [1, 0],
          transform: ['scale(1)', 'scale(0.8)'],
        },
        {
          duration: config.duration ?? 300,
          easing: config.easing ?? 'ease-in',
          delay: config.delay ?? 0,
        }
      );

      this.activeAnimations.add(() => animation.cancel());

      animation.finished.then(() => {
        this.activeAnimations.delete(() => animation.cancel());
      });
    } catch (error) {
      logger.warn('closeGallery 애니메이션 실패, 폴백 사용:', error);
      this.fallbackCloseGallery(element, config);
    }
  }

  /**
   * 스크롤 기반 애니메이션
   */
  public setupScrollAnimation(
    onScroll: (info: { scrollY: number; progress: number }) => void,
    config: ScrollAnimationConfig = {}
  ): () => void {
    try {
      const motionOne = getMotionOne();

      const cleanup = motionOne.scroll(onScroll, {
        container: config.container || null,
      });

      this.activeAnimations.add(cleanup);
      return cleanup;
    } catch (error) {
      logger.warn('스크롤 애니메이션 설정 실패, 폴백 사용:', error);
      return this.fallbackScrollAnimation(onScroll, config);
    }
  }

  /**
   * 뷰포트 진입 애니메이션
   */
  public setupInViewAnimation(
    element: Element,
    onInView: () => void,
    config: ScrollAnimationConfig = {}
  ): () => void {
    try {
      const motionOne = getMotionOne();

      const cleanup = motionOne.inView(element, onInView, {
        rootMargin: `${config.threshold ?? 100}px`,
      });

      this.activeAnimations.add(cleanup);
      return cleanup;
    } catch (error) {
      logger.warn('inView 애니메이션 설정 실패, 폴백 사용:', error);
      return this.fallbackInViewAnimation(element, onInView, config);
    }
  }

  /**
   * 스태거 애니메이션 (순차적 애니메이션)
   */
  public async staggerAnimation(
    elements: Element[],
    animation: (element: Element, index: number) => void,
    staggerDelay = 100
  ): Promise<void> {
    try {
      const motionOne = getMotionOne();
      const stagger = motionOne.stagger(staggerDelay);

      const promises = elements.map(async (element, index) => {
        const delay = stagger(index);
        await new Promise(resolve => setTimeout(resolve, delay));
        animation(element, index);
      });

      await Promise.all(promises);
    } catch (error) {
      logger.warn('stagger 애니메이션 실패, 폴백 사용:', error);

      // 폴백: 간단한 순차 애니메이션
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element) {
          setTimeout(() => animation(element, i), i * staggerDelay);
        }
      }
    }
  }

  /**
   * 폴백 애니메이션들
   */
  private fallbackFadeIn(element: Element, config: AnimationConfig): void {
    const duration = config.duration ?? 300;
    const htmlElement = element as HTMLElement;

    htmlElement.style.transition = `opacity ${duration}ms ease-out`;
    htmlElement.style.opacity = '0';

    requestAnimationFrame(() => {
      htmlElement.style.opacity = '1';
    });

    const timerId = window.setTimeout(() => {
      htmlElement.style.transition = '';
      this.fallbackAnimations.delete(element);
    }, duration);

    this.fallbackAnimations.set(element, timerId);
  }

  private fallbackFadeOut(element: Element, config: AnimationConfig): void {
    const duration = config.duration ?? 300;
    const htmlElement = element as HTMLElement;

    htmlElement.style.transition = `opacity ${duration}ms ease-in`;
    htmlElement.style.opacity = '1';

    requestAnimationFrame(() => {
      htmlElement.style.opacity = '0';
    });

    const timerId = window.setTimeout(() => {
      htmlElement.style.transition = '';
      this.fallbackAnimations.delete(element);
    }, duration);

    this.fallbackAnimations.set(element, timerId);
  }

  private fallbackOpenGallery(element: Element, config: AnimationConfig): void {
    const duration = config.duration ?? 400;
    const htmlElement = element as HTMLElement;

    htmlElement.style.transition = `all ${duration}ms ease-out`;
    htmlElement.style.transform = 'scale(0.8)';
    htmlElement.style.opacity = '0';

    requestAnimationFrame(() => {
      htmlElement.style.transform = 'scale(1)';
      htmlElement.style.opacity = '1';
    });

    const timerId = window.setTimeout(() => {
      htmlElement.style.transition = '';
      this.fallbackAnimations.delete(element);
    }, duration);

    this.fallbackAnimations.set(element, timerId);
  }

  private fallbackCloseGallery(element: Element, config: AnimationConfig): void {
    const duration = config.duration ?? 300;
    const htmlElement = element as HTMLElement;

    htmlElement.style.transition = `all ${duration}ms ease-in`;
    htmlElement.style.transform = 'scale(1)';
    htmlElement.style.opacity = '1';

    requestAnimationFrame(() => {
      htmlElement.style.transform = 'scale(0.8)';
      htmlElement.style.opacity = '0';
    });

    const timerId = window.setTimeout(() => {
      htmlElement.style.transition = '';
      this.fallbackAnimations.delete(element);
    }, duration);

    this.fallbackAnimations.set(element, timerId);
  }

  private fallbackScrollAnimation(
    onScroll: (info: { scrollY: number; progress: number }) => void,
    config: ScrollAnimationConfig
  ): () => void {
    const container = config.container || window;

    const handleScroll = () => {
      const scrollY = container === window ? window.scrollY : (container as Element).scrollTop;

      const maxScroll =
        container === window
          ? document.documentElement.scrollHeight - window.innerHeight
          : (container as Element).scrollHeight - (container as Element).clientHeight;

      const progress = Math.min(scrollY / maxScroll, 1);

      onScroll({ scrollY, progress });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }

  private fallbackInViewAnimation(
    element: Element,
    onInView: () => void,
    config: ScrollAnimationConfig
  ): () => void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              onInView();
              if (config.once !== false) {
                observer.unobserve(element);
              }
            }
          });
        },
        {
          rootMargin: `${config.threshold ?? 100}px`,
        }
      );

      observer.observe(element);
      return () => observer.disconnect();
    } else {
      // IntersectionObserver 폴백
      onInView(); // 즉시 실행
      return () => {}; // 빈 cleanup
    }
  }

  /**
   * 정리 설정
   */
  private setupCleanup(): void {
    // 페이지 언로드 시 모든 애니메이션 정리
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * 모든 활성 애니메이션 정리
   */
  public cleanup(): void {
    // Motion One 애니메이션 정리
    this.activeAnimations.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.warn('애니메이션 정리 중 오류:', error);
      }
    });
    this.activeAnimations.clear();

    // 폴백 애니메이션 정리
    this.fallbackAnimations.forEach((timerId, element) => {
      clearTimeout(timerId);
      const htmlElement = element as HTMLElement;
      htmlElement.style.transition = '';
    });
    this.fallbackAnimations.clear();

    logger.debug('SimpleAnimationService 정리 완료');
  }
}

/**
 * 편의 함수들
 */
export const animateElement = (element: Element, config?: AnimationConfig) => {
  return SimpleAnimationService.getInstance().fadeIn(element, config);
};

export const fadeOut = (element: Element, config?: AnimationConfig) => {
  return SimpleAnimationService.getInstance().fadeOut(element, config);
};

export const openGalleryWithAnimation = (element: Element, config?: AnimationConfig) => {
  return SimpleAnimationService.getInstance().openGallery(element, config);
};

export const closeGalleryWithAnimation = (element: Element, config?: AnimationConfig) => {
  return SimpleAnimationService.getInstance().closeGallery(element, config);
};

/**
 * 기존 호환성을 위한 애니메이션 함수들
 */
export const animateGalleryEnter = (element: Element) => {
  return SimpleAnimationService.getInstance().openGallery(element, {
    duration: 400,
    easing: 'ease-out',
  });
};

export const animateGalleryExit = (element: Element) => {
  return SimpleAnimationService.getInstance().closeGallery(element, {
    duration: 300,
    easing: 'ease-in',
  });
};

export const animateToolbarShow = (element: Element) => {
  return SimpleAnimationService.getInstance().fadeIn(element, {
    duration: 200,
    easing: 'ease-out',
  });
};

export const animateToolbarHide = (element: Element) => {
  return SimpleAnimationService.getInstance().fadeOut(element, {
    duration: 200,
    easing: 'ease-in',
  });
};

export const setupScrollAnimation = (
  onScroll: (info: { scrollY: number; progress: number }) => void,
  container?: Element | null
) => {
  return SimpleAnimationService.getInstance().setupScrollAnimation(onScroll, {
    container: container || null,
  });
};
