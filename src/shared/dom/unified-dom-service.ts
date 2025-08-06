/**
 * @fileoverview 통합 DOM Service - TDD GREEN 단계
 * @description DOMService와 component-manager의 중복 기능을 통합한 단일 진실 공급원
 * @version 1.0.0 - TDD GREEN Phase
 */

import { logger } from '@shared/logging';
import { rafThrottle } from '@shared/utils/performance';

/**
 * 통합 DOM 조작 인터페이스
 */
export interface UnifiedDOMInterface {
  // DOM 조작
  createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions
  ): HTMLElementTagNameMap[K];
  querySelector<T extends Element = Element>(selector: string): T | null;
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T>;

  // 이벤트 관리
  addEventListener(
    element: Element,
    event: string,
    handler: EventListener,
    options?: EventListenerOptions
  ): () => void;
  removeEventListener(element: Element, event: string, handler: EventListener): void;

  // 스타일 관리
  setStyle(element: HTMLElement, property: string, value: string): void;
  setStyles(element: HTMLElement, styles: Record<string, string>): void;

  // 클래스 관리
  addClass(element: Element, className: string): void;
  removeClass(element: Element, className: string): void;
  toggleClass(element: Element, className: string): void;

  // 속성 관리
  setAttribute(element: Element, name: string, value: string): void;
  removeAttribute(element: Element, name: string): void;
  getAttribute(element: Element, name: string): string | null;

  // 성능 최적화
  measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number };
  batch(operations: DOMOperation[]): void;

  // 메모리 관리
  cleanup(): void;
}

/**
 * 엘리먼트 생성 옵션
 */
export interface ElementCreationOptions {
  id?: string;
  className?: string;
  textContent?: string;
  innerHTML?: string;
  attributes?: Record<string, string>;
  styles?: Record<string, string>;
  dataset?: Record<string, string>;
}

/**
 * DOM 조작 명령
 */
export interface DOMOperation {
  type:
    | 'addClass'
    | 'removeClass'
    | 'setStyle'
    | 'setAttribute'
    | 'removeAttribute'
    | 'setTextContent';
  element: Element;
  key?: string;
  value?: string;
  styles?: Record<string, string>;
}

/**
 * 통합 DOM Service 클래스
 *
 * 기존 중복 위치들:
 * - src/shared/dom/DOMService.ts (DOM 조작)
 * - src/shared/components/component-manager.ts (이벤트 관리)
 * - src/shared/dom/dom-cache.ts (DOM 캐싱)
 * - src/shared/dom/dom-event-manager.ts (이벤트 관리)
 */
export class UnifiedDOMService implements UnifiedDOMInterface {
  private static instance: UnifiedDOMService;
  private readonly cache = new Map<string, Element>();
  private readonly eventListeners = new WeakMap<Element, Map<string, EventListener[]>>();
  private readonly performanceMetrics = new Map<string, number[]>();

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): UnifiedDOMService {
    if (!UnifiedDOMService.instance) {
      UnifiedDOMService.instance = new UnifiedDOMService();
    }
    return UnifiedDOMService.instance;
  }

  /**
   * DOM 엘리먼트 생성
   */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options: ElementCreationOptions = {}
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);

    if (options.id) {
      element.id = options.id;
    }

    if (options.className) {
      element.className = options.className;
    }

    if (options.textContent) {
      element.textContent = options.textContent;
    }

    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([name, value]) => {
        element.setAttribute(name, value);
      });
    }

    if (options.styles) {
      Object.entries(options.styles).forEach(([property, value]) => {
        // DOM API 안전성 검사
        if (element.style && typeof element.style.setProperty === 'function') {
          element.style.setProperty(property, value);
        } else if (element.style) {
          // 테스트 환경 등에서 setProperty가 없는 경우 직접 할당
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (element.style as any)[property] = value;
        }
      });
    }

    if (options.dataset) {
      Object.entries(options.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }

    return element;
  }

  /**
   * DOM 셀렉터 (캐싱 지원)
   */
  querySelector<T extends Element = Element>(selector: string): T | null {
    const cached = this.cache.get(selector);
    if (cached) {
      return cached as T;
    }

    const element = document.querySelector<T>(selector);
    if (element) {
      this.cache.set(selector, element);
    }

    return element;
  }

  /**
   * 다중 DOM 셀렉터
   */
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    return document.querySelectorAll<T>(selector);
  }

  /**
   * 이벤트 리스너 추가 (자동 정리 지원)
   */
  addEventListener(
    element: Element,
    event: string,
    handler: EventListener,
    options: EventListenerOptions = {}
  ): () => void {
    element.addEventListener(event, handler, options);

    // 이벤트 리스너 추적
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }
    const elementListeners = this.eventListeners.get(element)!;

    if (!elementListeners.has(event)) {
      elementListeners.set(event, []);
    }
    elementListeners.get(event)!.push(handler);

    // 정리 함수 반환
    return () => {
      this.removeEventListener(element, event, handler);
    };
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(element: Element, event: string, handler: EventListener): void {
    element.removeEventListener(event, handler);

    // 추적에서 제거
    const elementListeners = this.eventListeners.get(element);
    if (elementListeners) {
      const eventHandlers = elementListeners.get(event);
      if (eventHandlers) {
        const index = eventHandlers.indexOf(handler);
        if (index > -1) {
          eventHandlers.splice(index, 1);
        }
      }
    }
  }

  /**
   * 스타일 설정
   */
  setStyle(element: HTMLElement, property: string, value: string): void {
    element.style.setProperty(property, value);
  }

  /**
   * 다중 스타일 설정
   */
  setStyles(element: HTMLElement, styles: Record<string, string>): void {
    Object.entries(styles).forEach(([property, value]) => {
      this.setStyle(element, property, value);
    });
  }

  /**
   * 클래스 추가
   */
  addClass(element: Element, className: string): void {
    element.classList.add(className);
  }

  /**
   * 클래스 제거
   */
  removeClass(element: Element, className: string): void {
    element.classList.remove(className);
  }

  /**
   * 클래스 토글
   */
  toggleClass(element: Element, className: string): void {
    element.classList.toggle(className);
  }

  /**
   * 속성 설정
   */
  setAttribute(element: Element, name: string, value: string): void {
    element.setAttribute(name, value);
  }

  /**
   * 속성 제거
   */
  removeAttribute(element: Element, name: string): void {
    element.removeAttribute(name);
  }

  /**
   * 속성 가져오기
   */
  getAttribute(element: Element, name: string): string | null {
    return element.getAttribute(name);
  }

  /**
   * 성능 측정
   */
  measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number } {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    // 성능 메트릭 저장
    if (!this.performanceMetrics.has(label)) {
      this.performanceMetrics.set(label, []);
    }
    this.performanceMetrics.get(label)!.push(duration);

    if (duration > 10) {
      logger.debug(`DOM Performance: ${label} took ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  }

  /**
   * 배치 DOM 조작 (성능 최적화)
   */
  batch(operations: DOMOperation[]): void {
    // RAF를 사용한 배치 처리
    rafThrottle(() => {
      operations.forEach(operation => {
        try {
          switch (operation.type) {
            case 'addClass':
              if (operation.value) {
                this.addClass(operation.element, operation.value);
              }
              break;
            case 'removeClass':
              if (operation.value) {
                this.removeClass(operation.element, operation.value);
              }
              break;
            case 'setStyle':
              if (operation.key && operation.value && operation.element instanceof HTMLElement) {
                this.setStyle(operation.element, operation.key, operation.value);
              }
              break;
            case 'setAttribute':
              if (operation.key && operation.value) {
                this.setAttribute(operation.element, operation.key, operation.value);
              }
              break;
            case 'removeAttribute':
              if (operation.key) {
                this.removeAttribute(operation.element, operation.key);
              }
              break;
            case 'setTextContent':
              if (operation.value) {
                operation.element.textContent = operation.value;
              }
              break;
          }
        } catch (error) {
          logger.warn('Batch operation failed:', error);
        }
      });
    })();
  }

  /**
   * 메모리 정리
   */
  cleanup(): void {
    // 캐시 정리
    this.cache.clear();

    // 성능 메트릭 정리
    this.performanceMetrics.clear();

    logger.debug('UnifiedDOMService cleanup completed');
  }

  /**
   * 성능 통계 가져오기
   */
  getPerformanceStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.performanceMetrics.forEach((durations, label) => {
      if (durations.length > 0) {
        const sum = durations.reduce((a, b) => a + b, 0);
        stats[label] = {
          avg: sum / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations),
          count: durations.length,
        };
      }
    });

    return stats;
  }
}

// 싱글톤 인스턴스
export const unifiedDOMService = UnifiedDOMService.getInstance();

// 편의성을 위한 개별 export (기존 코드 호환성)
export const createElement = unifiedDOMService.createElement.bind(unifiedDOMService);
export const querySelector = unifiedDOMService.querySelector.bind(unifiedDOMService);
export const querySelectorAll = unifiedDOMService.querySelectorAll.bind(unifiedDOMService);
export const addEventListener = unifiedDOMService.addEventListener.bind(unifiedDOMService);
export const removeEventListener = unifiedDOMService.removeEventListener.bind(unifiedDOMService);
export const setStyle = unifiedDOMService.setStyle.bind(unifiedDOMService);
export const setStyles = unifiedDOMService.setStyles.bind(unifiedDOMService);
export const addClass = unifiedDOMService.addClass.bind(unifiedDOMService);
export const removeClass = unifiedDOMService.removeClass.bind(unifiedDOMService);
export const toggleClass = unifiedDOMService.toggleClass.bind(unifiedDOMService);
export const setAttribute = unifiedDOMService.setAttribute.bind(unifiedDOMService);
export const removeAttribute = unifiedDOMService.removeAttribute.bind(unifiedDOMService);
export const getAttribute = unifiedDOMService.getAttribute.bind(unifiedDOMService);
export const measurePerformance = unifiedDOMService.measurePerformance.bind(unifiedDOMService);
export const batch = unifiedDOMService.batch.bind(unifiedDOMService);
export const cleanup = unifiedDOMService.cleanup.bind(unifiedDOMService);

// 기존 API 호환성을 위한 별칭 - 클래스와 인스턴스 모두 지원
export { UnifiedDOMService as DOMServiceClass };
export const DOMService = Object.assign(unifiedDOMService, {
  getInstance: () => unifiedDOMService,
  select: unifiedDOMService.querySelector.bind(unifiedDOMService),
  batchUpdate: unifiedDOMService.batch.bind(unifiedDOMService),
  isVisible: (element: HTMLElement): boolean => {
    if (!element) return false;
    const style = getComputedStyle(element);

    // 기본 스타일 체크
    const isDisplayVisible = style.display !== 'none';
    const isVisibilityVisible = style.visibility !== 'hidden';
    const isOpacityVisible = style.opacity !== '0';

    // JSDOM 환경에서는 offsetParent 체크를 더 유연하게 처리
    const hasOffsetParent =
      element.offsetParent !== null ||
      element === document.body ||
      element === document.documentElement;

    return isDisplayVisible && isVisibilityVisible && isOpacityVisible && hasOffsetParent;
  },
});
export const componentManager = {
  dom: unifiedDOMService,
  // 기존 component-manager의 DOM 관련 메서드들을 위임
  createElement: unifiedDOMService.createElement.bind(unifiedDOMService),
  addEventListener: unifiedDOMService.addEventListener.bind(unifiedDOMService),
  removeEventListener: unifiedDOMService.removeEventListener.bind(unifiedDOMService),
};
