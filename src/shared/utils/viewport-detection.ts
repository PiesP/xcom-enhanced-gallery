/**
 * Phase 7 GREEN: 뷰포트 감지 유틸리티
 *
 * 목표:
 * - Intersection Observer 기반 뷰포트 감지
 * - 간단한 API 제공
 * - 성능 최적화
 */

import { logger } from '@shared/logging/logger';
import { FEATURE_SCROLL_REFACTORED } from '@/constants';
import { getScrollCoordinator } from '@shared/scroll';

export interface ViewportDetectorOptions {
  rootMargin?: string;
  threshold?: number | number[];
  root?: Element | null;
}

export interface ViewportEntry {
  element: HTMLElement;
  isVisible: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
}

export type ViewportCallback = (entries: ViewportEntry[]) => void;

const DEFAULT_OPTIONS: Required<Omit<ViewportDetectorOptions, 'root'>> = {
  rootMargin: '100px',
  threshold: 0,
};

/**
 * 뷰포트 감지기
 */
export class ViewportDetector {
  private observer: IntersectionObserver | null = null;
  private readonly trackedElements = new Set<HTMLElement>();
  private readonly options: ViewportDetectorOptions;

  constructor(
    private readonly callback: ViewportCallback,
    options: ViewportDetectorOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initialize();
  }

  /**
   * 요소 추적 시작
   */
  observe(element: HTMLElement): void {
    if (!this.observer) {
      logger.warn('ViewportDetector가 초기화되지 않음');
      return;
    }

    if (this.trackedElements.has(element)) {
      logger.debug('이미 추적 중인 요소:', element);
      return;
    }

    this.observer.observe(element);
    this.trackedElements.add(element);
    logger.debug('뷰포트 추적 시작:', element);
  }

  /**
   * 요소 추적 중단
   */
  unobserve(element: HTMLElement): void {
    if (!this.observer) {
      return;
    }

    this.observer.unobserve(element);
    this.trackedElements.delete(element);
    logger.debug('뷰포트 추적 중단:', element);
  }

  /**
   * 모든 요소 추적 중단
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.trackedElements.clear();
      logger.debug('ViewportDetector 연결 해제');
    }
  }

  /**
   * 추적 중인 요소 개수
   */
  getTrackedCount(): number {
    return this.trackedElements.size;
  }

  /**
   * 추적 중인 모든 요소
   */
  getTrackedElements(): HTMLElement[] {
    return Array.from(this.trackedElements);
  }

  private initialize(): void {
    if (!globalThis.IntersectionObserver) {
      logger.error('IntersectionObserver를 지원하지 않음');
      return;
    }

    try {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
        root: this.options.root || null,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      });

      logger.debug('ViewportDetector 초기화 완료:', this.options);
    } catch (error) {
      logger.error('ViewportDetector 초기화 실패:', error);
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    const viewportEntries: ViewportEntry[] = entries.map(entry => ({
      element: entry.target as HTMLElement,
      isVisible: entry.isIntersecting,
      intersectionRatio: entry.intersectionRatio,
      boundingClientRect: entry.boundingClientRect,
    }));

    try {
      this.callback(viewportEntries);
    } catch (error) {
      logger.error('뷰포트 콜백 실행 실패:', error);
    }
  }
}

/**
 * 간단한 뷰포트 감지 함수
 */
export function createViewportDetector(
  callback: ViewportCallback,
  options?: ViewportDetectorOptions
): ViewportDetector {
  return new ViewportDetector(callback, options);
}

/**
 * 요소가 뷰포트에 있는지 즉시 확인
 */
export function isElementInViewport(element: HTMLElement, rootMargin = '0px'): Promise<boolean> {
  return new Promise(resolve => {
    if (!globalThis.IntersectionObserver) {
      // fallback: getBoundingClientRect 사용
      const rect = element.getBoundingClientRect();
      const isVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (globalThis.innerHeight || globalThis.document.documentElement.clientHeight) &&
        rect.right <= (globalThis.innerWidth || globalThis.document.documentElement.clientWidth);

      resolve(isVisible);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const isVisible = entries[0]?.isIntersecting || false;
        observer.disconnect();
        resolve(isVisible);
      },
      { rootMargin }
    );

    observer.observe(element);
  });
}

/**
 * 스크롤 idle 감지
 */
/**
 * @deprecated Scroll 시스템 리팩토링(SR)으로 ScrollCoordinator.idle 신호를 사용하세요.
 * Feature Flag (FEATURE_SCROLL_REFACTORED) 활성 시 Coordinator 기반 구현으로 대체됩니다.
 * 기존 구현은 플래그 OFF 환경(레거시)에서만 scroll 이벤트+timeout 전략을 유지합니다.
 */
export class ScrollIdleDetector {
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly idleDelay: number;
  private readonly callback: () => void;
  private coordUnsub: (() => void) | null = null;
  private coordAttached = false;

  constructor(callback: () => void, idleDelay = 150) {
    this.callback = callback;
    this.idleDelay = idleDelay;
    this.start();
  }

  start(): void {
    if (FEATURE_SCROLL_REFACTORED) {
      if (this.coordUnsub) return; // already active
      const coord = getScrollCoordinator({ idleDelay: this.idleDelay });
      if (!this.coordAttached) {
        coord.attach();
        this.coordAttached = true;
      }
      let prev = coord.idle.value;
      this.coordUnsub = coord.idle.subscribe(v => {
        // transition (false -> true) 시점에만 콜백
        if (!prev && v) {
          try {
            this.callback();
          } catch (e) {
            logger.warn('ScrollIdleDetector (coordinator) callback error', e);
          }
        }
        prev = v;
      });
      logger.debug('ScrollIdleDetector(신규/Coordinator) 시작:', `${this.idleDelay}ms`);
      return;
    }
    if (typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('scroll', this.handleScroll, { passive: true });
      logger.debug('ScrollIdleDetector(legacy) 시작:', `${this.idleDelay}ms`);
    }
  }

  stop(): void {
    if (FEATURE_SCROLL_REFACTORED) {
      if (this.coordUnsub) {
        this.coordUnsub();
        this.coordUnsub = null;
      }
      logger.debug('ScrollIdleDetector(신규/Coordinator) 중단');
      return;
    }
    if (typeof globalThis.removeEventListener === 'function') {
      globalThis.removeEventListener('scroll', this.handleScroll as EventListener);
    }
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    logger.debug('ScrollIdleDetector(legacy) 중단');
  }

  private readonly handleScroll = (): void => {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      try {
        this.callback();
      } catch (e) {
        logger.warn('ScrollIdleDetector legacy callback error', e);
      }
      this.scrollTimer = null;
    }, this.idleDelay);
  };
}

/**
 * 스크롤 idle 감지 생성 함수
 */
export function createScrollIdleDetector(
  callback: () => void,
  idleDelay?: number
): ScrollIdleDetector {
  return new ScrollIdleDetector(callback, idleDelay);
}
