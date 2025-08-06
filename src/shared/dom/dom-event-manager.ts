/**
 * @fileoverview DOM 이벤트 관리
 */

import type { EventOptions } from './types';
import { addEventListener, removeEventListener, cleanup } from './unified-dom-service';

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
