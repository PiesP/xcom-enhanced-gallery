/**
 * @fileoverview DOM 모듈 통합 export - TDD GREEN Phase 2
 * @description 단일 통합 DOM 서비스 중심으로 완전 통합
 */

import {
  UnifiedDOMService,
  unifiedDOMService,
  querySelector,
  querySelectorAll,
  createElement,
  addEventListener,
  removeEventListener,
  setStyle,
  setStyles,
  addClass,
  removeClass,
  toggleClass,
  setAttribute,
  removeAttribute,
  getAttribute,
  batch,
  cleanup,
  DOMService,
  componentManager,
} from './unified-dom-service';

// ===== 개별 named exports - 충돌 방지 =====
export {
  UnifiedDOMService,
  unifiedDOMService,
  querySelector,
  querySelectorAll,
  createElement,
  addEventListener,
  removeEventListener,
  setStyle,
  setStyles,
  addClass,
  removeClass,
  toggleClass,
  setAttribute,
  removeAttribute,
  getAttribute,
  batch,
  cleanup,
  DOMService,
  componentManager,
};

// measurePerformance는 DOM 전용 이름으로 export
export { measurePerformance as measureDOMPerformance } from './unified-dom-service';

// ===== Type exports =====
export interface ElementOptions {
  id?: string;
  className?: string;
  textContent?: string;
  innerHTML?: string;
  style?: Partial<CSSStyleDeclaration>;
  attributes?: Record<string, string>;
  children?: (HTMLElement | string)[];
}

export interface EventOptions {
  once?: boolean;
  passive?: boolean;
  capture?: boolean;
  signal?: AbortSignal;
}

// ===== Backward Compatibility Classes =====
// 기존 DOM 유틸리티 호환성 - utils/dom.ts 대체
export {
  querySelector as safeQuerySelector,
  querySelectorAll as safeQuerySelectorAll,
  createElement as safeCreateElement,
  addClass as safeAddClass,
  removeClass as safeRemoveClass,
  setStyle as safeSetStyle,
  setAttribute as safeSetAttribute,
  removeAttribute as safeRemoveAttribute,
} from './unified-dom-service';

// 기존 DOMService 호환성 (이제 unified-dom-service의 별칭)
export { DOMService as LegacyDOMService } from './unified-dom-service';

// 캐싱 기능 (dom-cache.ts 대체)
export class DOMCache {
  static querySelector = querySelector;
  static querySelectorAll = querySelectorAll;
  static clearCache = cleanup;
  static getCacheSize = () => unifiedDOMService.getPerformanceStats();
}

export const globalDOMCache = new DOMCache();

// 이벤트 관리 (dom-event-manager.ts 대체)
export class DOMEventManager {
  private readonly listeners = new Map<
    Element,
    Map<string, EventListenerOrEventListenerObject[]>
  >();

  addEventListener(
    element: Element,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: EventOptions
  ) {
    const eventListener = typeof listener === 'function' ? listener : listener.handleEvent;
    addEventListener(element, type, eventListener, options);

    // 내부 추적용
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    const elementListeners = this.listeners.get(element)!;
    if (!elementListeners.has(type)) {
      elementListeners.set(type, []);
    }
    elementListeners.get(type)!.push(listener);
  }

  removeEventListener(
    element: Element,
    type: string,
    listener: EventListenerOrEventListenerObject
  ) {
    const eventListener = typeof listener === 'function' ? listener : listener.handleEvent;
    removeEventListener(element, type, eventListener);

    // 내부 추적에서 제거
    const elementListeners = this.listeners.get(element);
    if (elementListeners) {
      const typeListeners = elementListeners.get(type);
      if (typeListeners) {
        const index = typeListeners.indexOf(listener);
        if (index !== -1) {
          typeListeners.splice(index, 1);
        }
      }
    }
  }

  cleanup() {
    cleanup();
    this.listeners.clear();
  }

  static addEventListener = addEventListener;
  static removeEventListener = removeEventListener;
  static cleanup = cleanup;
}

export const createEventManager = () => new DOMEventManager();

// ===== 주요 default export =====
export { unifiedDOMService as default };
