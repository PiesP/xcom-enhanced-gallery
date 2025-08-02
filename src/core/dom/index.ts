/**
 * @fileoverview 통합 DOM 관리자
 * @description 모든 DOM 관련 기능을 하나로 통합한 관리자
 * @version 2.0.0 - 구조 개선
 */

import { coreLogger as logger } from '../logger';

/**
 * DOM 업데이트 작업 인터페이스
 */
export interface DOMUpdate {
  element: HTMLElement;
  styles?: Partial<CSSStyleDeclaration>;
  classes?: { add?: string[]; remove?: string[] };
  attributes?: Record<string, string>;
}

/**
 * DOM 배치 작업 인터페이스
 */
export interface BatchOperation {
  type: 'create' | 'append' | 'remove' | 'update';
  tag?: string;
  target?: string | Element;
  element?: Element;
  data?: Record<string, unknown>;
}

/**
 * DOM 캐시 클래스 - CoreDOMManager와 통합
 */
export class CoreDOMCache {
  private readonly cache = new Map<string, Element | null>();
  private readonly batchQueue: BatchOperation[] = [];

  /**
   * 캐시에서 요소 가져오기
   */
  get<T extends Element = Element>(selector: string): T | null {
    if (this.cache.has(selector)) {
      return this.cache.get(selector) as T | null;
    }

    const element = document.querySelector<T>(selector);
    this.cache.set(selector, element);
    return element;
  }

  /**
   * 캐시에 요소 설정
   */
  set(selector: string, element: Element | null): void {
    this.cache.set(selector, element);
  }

  /**
   * 캐시 무효화
   */
  invalidate(selector?: string): void {
    if (selector) {
      this.cache.delete(selector);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 배치 작업 추가
   */
  batch(operations: BatchOperation[]): { processed: number } {
    this.batchQueue.push(...operations);
    return this.processBatch();
  }

  /**
   * 배치 작업 처리
   */
  private processBatch(): { processed: number } {
    let processed = 0;

    for (const operation of this.batchQueue) {
      try {
        switch (operation.type) {
          case 'create':
            if (operation.tag) {
              document.createElement(operation.tag);
              processed++;
            }
            break;
          case 'append':
            if (operation.target && operation.element) {
              const target =
                typeof operation.target === 'string'
                  ? this.get(operation.target)
                  : operation.target;
              target?.appendChild(operation.element);
              processed++;
            }
            break;
          case 'remove':
            if (operation.element) {
              operation.element.remove();
              processed++;
            }
            break;
          case 'update':
            // DOM 업데이트 로직
            processed++;
            break;
        }
      } catch (error) {
        logger.error(`배치 작업 실패: ${operation.type}`, error);
      }
    }

    this.batchQueue.length = 0; // 큐 비우기
    return { processed };
  }
}

/**
 * 통합 DOM 관리자
 * 모든 DOM 관련 작업을 중앙에서 관리 (CoreDOMCache 통합)
 */
export class CoreDOMManager {
  private static instance: CoreDOMManager;
  private readonly domCache: CoreDOMCache;
  private readonly batchUpdates: DOMUpdate[] = [];
  private batchScheduled = false;

  private constructor() {
    this.domCache = new CoreDOMCache();
  }

  static getInstance(): CoreDOMManager {
    if (!CoreDOMManager.instance) {
      CoreDOMManager.instance = new CoreDOMManager();
    }
    return CoreDOMManager.instance;
  }

  /**
   * 캐시된 요소 선택 (CoreDOMCache 통합)
   */
  select<T extends Element = Element>(selector: string): T | null {
    return this.domCache.get<T>(selector);
  }

  /**
   * 캐시된 요소들 선택
   */
  selectAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    return document.querySelectorAll<T>(selector);
  }

  /**
   * 통합된 배치 DOM 작업 (CoreDOMCache와 연동)
   */
  batchDOMOperations(operations: BatchOperation[]): { processed: number } {
    logger.debug(`배치 DOM 작업 시작: ${operations.length}개 작업`);
    return this.domCache.batch(operations);
  }

  /**
   * DOM 캐시 무효화
   */
  invalidateCache(selector?: string): void {
    this.domCache.invalidate(selector);
  }

  /**
   * 배치 DOM 업데이트 추가
   */
  batchUpdate(update: DOMUpdate): void {
    this.batchUpdates.push(update);
    this.scheduleBatch();
  }

  /**
   * 즉시 DOM 업데이트
   */
  updateElement(element: HTMLElement, update: Omit<DOMUpdate, 'element'>): void {
    try {
      // 스타일 적용
      if (update.styles) {
        Object.assign(element.style, update.styles);
      }

      // 클래스 적용
      if (update.classes) {
        if (update.classes.add) {
          element.classList.add(...update.classes.add);
        }
        if (update.classes.remove) {
          element.classList.remove(...update.classes.remove);
        }
      }

      // 속성 적용
      if (update.attributes) {
        Object.entries(update.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
    } catch (error) {
      logger.error('DOM 업데이트 실패:', error);
    }
  }

  /**
   * 이벤트 리스너 추가 (자동 정리 포함)
   */
  addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    element.addEventListener(type, listener, options);

    return () => {
      element.removeEventListener(type, listener, options);
    };
  }

  /**
   * 요소 가시성 확인
   */
  isVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * 부모 요소 탐색
   */
  closestParent(element: HTMLElement, selector: string): HTMLElement | null {
    return element.closest(selector) as HTMLElement | null;
  }

  /**
   * 클래스 토글
   */
  toggleClass(element: HTMLElement, className: string, force?: boolean): void {
    if (force !== undefined) {
      element.classList.toggle(className, force);
    } else {
      element.classList.toggle(className);
    }
  }

  /**
   * 안전한 요소 제거
   */
  safeRemove(element: HTMLElement): void {
    try {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      logger.error('요소 제거 실패:', error);
    }
  }

  private scheduleBatch(): void {
    if (this.batchScheduled) return;

    this.batchScheduled = true;
    requestAnimationFrame(() => {
      this.processBatch();
      this.batchScheduled = false;
    });
  }

  private processBatch(): void {
    const updates = this.batchUpdates.splice(0);

    updates.forEach(update => {
      this.updateElement(update.element, update);
    });

    if (updates.length > 0) {
      logger.debug(`배치 DOM 업데이트 완료: ${updates.length}개 요소`);
    }
  }
}

// 전역 인스턴스 export
export const coreDOMManager = CoreDOMManager.getInstance();

// 편의 함수들
export const select = <T extends Element = Element>(selector: string): T | null =>
  coreDOMManager.select<T>(selector);

export const selectAll = <T extends Element = Element>(selector: string): NodeListOf<T> =>
  coreDOMManager.selectAll<T>(selector);

export const updateElement = (element: HTMLElement, update: Omit<DOMUpdate, 'element'>): void =>
  coreDOMManager.updateElement(element, update);

// 기존 batchUpdate (DOMUpdate 인터페이스 사용)
export const batchDOMUpdate = (update: DOMUpdate): void => coreDOMManager.batchUpdate(update);

// 테스트용 batchUpdate (간단한 배열 형태)
export const batchUpdate = (
  element: HTMLElement,
  updates: Array<{ property: string; value: string }>
): void => {
  requestAnimationFrame(() => {
    updates.forEach(({ property, value }) => {
      const parts = property.split('.');
      if (parts.length === 2) {
        const [obj, prop] = parts;
        if (obj === 'style' && element.style && prop) {
          // 타입 안전하게 스타일 속성 설정
          if (prop in element.style) {
            (element.style as unknown as Record<string, string>)[prop] = value;
          }
        } else if (obj === 'data' && prop) {
          element.setAttribute(`data-${prop}`, value);
        }
      } else if (property === 'className') {
        element.className = value;
      } else if (property.startsWith('data-')) {
        element.setAttribute(property, value);
      } else {
        element.setAttribute(property, value);
      }
    });
  });
};

// Phase 2 추가: 배치 DOM 작업 편의 함수
export const batchDOMOperations = (operations: BatchOperation[]): { processed: number } =>
  coreDOMManager.batchDOMOperations(operations);
