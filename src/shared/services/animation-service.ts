/**
 * @fileoverview 통합된 애니메이션 서비스
 * @description css-animations와 통합된 완전한 애니메이션 기능
 * @version 4.0.0 - Phase 3: 통합
 */

import { logger } from '../logging/index.js';
import { TIMING } from '../../constants.js';

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
    try {
      const doc: Document | null = typeof document !== 'undefined' ? document : null;
      // DOM 가용성 및 중복 주입 방어
      if (this.stylesInjected || !doc) {
        return;
      }

      // document.head가 비정상적인 모킹 환경에서 누락될 수 있으므로 런타임 체크
      const headEl: HTMLHeadElement | null = (doc as Document).head ?? null;
      if (!headEl) {
        return;
      }

      // 이미 주입된 경우 방지
      if (typeof doc.getElementById === 'function' && doc.getElementById('xcom-animations')) {
        return;
      }

      const style: HTMLStyleElement = doc.createElement('style');
      if (!style) {
        return; // 일부 비정상 모킹 환경 보호
      }
      try {
        style.id = 'xcom-animations';
      } catch {
        // id 설정 실패는 무시
      }
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

      try {
        headEl.appendChild(style);
        this.stylesInjected = true;
        logger.debug('통합된 애니메이션 스타일이 주입되었습니다.');
      } catch {
        // 주입 실패는 조용히 무시 (테스트 환경 보호)
      }
    } catch {
      // DOM 접근 자체 실패 시 무시
    }
  }

  /**
   * 갤러리 진입 애니메이션 (css-animations 통합)
   */
  public async animateGalleryEnter(element: Element, config: AnimationConfig = {}): Promise<void> {
    return new Promise<void>(resolve => {
      try {
        // 애니메이션 이벤트가 발생하지 않는 환경 대비 타임아웃 폴백
        const timeoutMs =
          typeof config.duration === 'number' ? config.duration : TIMING.ANIMATION_NORMAL;
        const timeoutId = setTimeout(
          () => {
            try {
              element.classList?.remove?.(ANIMATION_CLASSES.FADE_IN);
            } catch {
              void 0;
            }
            config.onComplete?.();
            resolve();
          },
          timeoutMs + (config.delay || 0)
        );

        const handleAnimationEnd = (_e: Event) => {
          try {
            element.removeEventListener?.('animationend', handleAnimationEnd as EventListener);
          } catch {
            void 0;
          }
          try {
            element.classList?.remove?.(ANIMATION_CLASSES.FADE_IN);
          } catch {
            void 0;
          }
          clearTimeout(timeoutId);
          config.onComplete?.();
          resolve();
        };

        try {
          element.addEventListener?.('animationend', handleAnimationEnd as EventListener);
        } catch {
          void 0;
        }
        try {
          element.classList?.add?.(ANIMATION_CLASSES.FADE_IN);
        } catch {
          void 0;
        }
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
        const timeoutMs =
          typeof config.duration === 'number' ? config.duration : TIMING.ANIMATION_FAST;
        const timeoutId = setTimeout(
          () => {
            try {
              element.classList?.remove?.(ANIMATION_CLASSES.FADE_OUT);
            } catch {
              void 0;
            }
            config.onComplete?.();
            resolve();
          },
          timeoutMs + (config.delay || 0)
        );

        const handleAnimationEnd = (_e: Event) => {
          try {
            element.removeEventListener?.('animationend', handleAnimationEnd as EventListener);
          } catch {
            void 0;
          }
          try {
            element.classList?.remove?.(ANIMATION_CLASSES.FADE_OUT);
          } catch {
            void 0;
          }
          clearTimeout(timeoutId);
          config.onComplete?.();
          resolve();
        };

        try {
          element.addEventListener?.('animationend', handleAnimationEnd as EventListener);
        } catch {
          void 0;
        }
        try {
          element.classList?.add?.(ANIMATION_CLASSES.FADE_OUT);
        } catch {
          void 0;
        }
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
    try {
      Object.values(ANIMATION_CLASSES).forEach(className => {
        // 일부 테스트 환경에서 classList가 undefined일 수 있음
        const el = element as Partial<{
          classList: Partial<Pick<DOMTokenList, 'remove'>>;
        }>;
        el.classList?.remove?.(className);
      });

      const htmlElement = element as Partial<{
        style: Partial<{
          animation: string;
          removeProperty: (prop: string) => void;
        }>;
      }>;
      htmlElement.style && (htmlElement.style.animation = '');
      htmlElement.style?.removeProperty?.('--animation-duration');
    } catch {
      // 모킹 환경에서의 예외는 무시
    }
  }

  /**
   * 요소 페이드인 애니메이션
   */
  public async fadeIn(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    const duration = config.duration || TIMING.ANIMATION_NORMAL;

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

    const duration = config.duration || TIMING.ANIMATION_NORMAL;

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

    const duration = config.duration || TIMING.ANIMATION_NORMAL;

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
   * 툴바 표시 애니메이션
   */
  public async animateToolbarShow(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    return new Promise<void>(resolve => {
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.classList.remove('animate-toolbar-slide-down');
        config.onComplete?.();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
      element.classList.add('animate-toolbar-slide-down');
    });
  }

  /**
   * 툴바 숨김 애니메이션
   */
  public async animateToolbarHide(element: Element, config: AnimationConfig = {}): Promise<void> {
    this.ensureStylesInjected();

    return new Promise<void>(resolve => {
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.classList.remove('animate-toolbar-slide-up');
        config.onComplete?.();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
      element.classList.add('animate-toolbar-slide-up');
    });
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

  // === Static Animation Utilities (Phase 3 TDD) ===

  /**
   * 커스텀 CSS 트랜지션 애니메이션
   */
  public static async animateCustom(
    element: Element,
    keyframes: Record<string, string | number>,
    options?: { duration?: number; easing?: string; delay?: number }
  ): Promise<void> {
    const htmlElement = element as HTMLElement;
    const duration = options?.duration || TIMING.ANIMATION_NORMAL;
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
  }

  /**
   * 병렬 애니메이션 실행
   */
  public static async animateParallel(
    animations: Array<{
      element: Element;
      keyframes: Record<string, string | number>;
      options?: { duration?: number; easing?: string; delay?: number };
    }>
  ): Promise<void> {
    const promises = animations.map(({ element, keyframes, options }) =>
      AnimationService.animateCustom(element, keyframes, options)
    );
    await Promise.all(promises);
  }

  /**
   * 스크롤 기반 애니메이션 설정
   */
  public static setupScrollAnimation(
    onScroll: (info: { scrollY: number; progress: number }) => void,
    container?: Element | null
  ): () => void {
    const handleScroll = () => {
      try {
        const scrollSource: Partial<Window> =
          typeof window !== 'undefined' ? (window as Window) : {};
        const doc: Document | undefined = typeof document !== 'undefined' ? document : undefined;
        const scrollY: number = Number(scrollSource.scrollY || 0);
        const docEl: HTMLElement | { scrollHeight: number } = doc?.documentElement || {
          scrollHeight: 0,
        };
        const innerH: number = Number((scrollSource as Window).innerHeight || 1);
        const maxScroll = Math.max((docEl.scrollHeight || 0) - innerH, 1);
        const progress = Math.min(scrollY / maxScroll, 1);
        onScroll({ scrollY, progress });
      } catch {
        void 0; // ignore scroll calculation errors in non-DOM environments
      }
    };

    // 안전한 타겟 선택: container가 유효하면 우선, 아니면 window, 둘 다 addEventListener가 없으면 no-op
    const win: Window | null = typeof window !== 'undefined' ? (window as Window) : null;
    const target: EventTarget | null =
      container && 'addEventListener' in container
        ? (container as unknown as EventTarget)
        : win && typeof win.addEventListener === 'function'
          ? (win as unknown as EventTarget)
          : null;

    if (target && typeof target.addEventListener === 'function') {
      try {
        target.addEventListener('scroll', handleScroll, { passive: true });
      } catch {
        void 0; // ignore listener attach errors
      }
      return () => {
        try {
          target.removeEventListener?.('scroll', handleScroll);
        } catch {
          void 0;
        }
      };
    }

    // addEventListener를 사용할 수 없는 환경에서는 no-op 정리 함수 반환
    return () => {
      /* no-op */
    };
  }

  /**
   * IntersectionObserver 기반 애니메이션 설정
   */
  public static setupInViewAnimation(
    element: Element,
    onInView: (entry: IntersectionObserverEntry) => void,
    options?: IntersectionObserverInit
  ): () => void {
    // 브라우저 환경이 아니거나 IntersectionObserver가 없으면 빈 함수 반환
    const IntersectionObserverClass =
      (typeof globalThis !== 'undefined' && globalThis.IntersectionObserver) ||
      (typeof window !== 'undefined' && window.IntersectionObserver);

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
  }

  /**
   * 값 범위 변환 유틸리티
   */
  public static transformValue(
    value: number,
    fromRange: [number, number],
    toRange: [number, number]
  ): number {
    const [fromMin, fromMax] = fromRange;
    const [toMin, toMax] = toRange;
    const progress = (value - fromMin) / (fromMax - fromMin);
    return toMin + progress * (toMax - toMin);
  }

  /**
   * 애니메이션 프리셋 상수
   */
  public static readonly ANIMATION_PRESETS = {
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

// ================================
// Phase 4: 표준화된 인스턴스 export
// ================================

/**
 * 표준화된 AnimationService 인스턴스
 */
export const animationService = AnimationService.getInstance();

/**
 * Default export (표준 패턴)
 */
export default animationService;
