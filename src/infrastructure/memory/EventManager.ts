/**
 * @fileoverview Event Manager - 이벤트 리스너 관리
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

interface EventListenerEntry {
  element: EventTarget;
  type: string;
  listener: EventListener | EventListenerObject;
  options?: boolean | AddEventListenerOptions;
}

/**
 * 이벤트 리스너 관리 유틸리티
 * 등록된 이벤트 리스너들을 추적하고 정리합니다.
 */
export class EventManager {
  private readonly listeners = new Set<EventListenerEntry>();

  /**
   * 이벤트 리스너를 등록하고 추적합니다.
   */
  public addEventListener(
    element: EventTarget,
    type: string,
    listener: EventListener | EventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(type, listener, options);

    const entry: EventListenerEntry = {
      element,
      type,
      listener,
    };

    if (options !== undefined) {
      entry.options = options;
    }

    this.listeners.add(entry);
    logger.debug(`[EventManager] Event listener added: ${type}`);
  }

  /**
   * 특정 이벤트 리스너를 제거합니다.
   */
  public removeEventListener(
    element: EventTarget,
    type: string,
    listener: EventListener | EventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    element.removeEventListener(type, listener, options);

    // 등록된 리스너에서 찾아서 제거
    for (const entry of this.listeners) {
      if (entry.element === element && entry.type === type && entry.listener === listener) {
        this.listeners.delete(entry);
        logger.debug(`[EventManager] Event listener removed: ${type}`);
        break;
      }
    }
  }

  /**
   * 특정 요소의 모든 이벤트 리스너를 제거합니다.
   */
  public removeAllEventListeners(element: EventTarget): void {
    const toRemove: EventListenerEntry[] = [];

    for (const entry of this.listeners) {
      if (entry.element === element) {
        toRemove.push(entry);
      }
    }

    for (const entry of toRemove) {
      entry.element.removeEventListener(entry.type, entry.listener, entry.options);
      this.listeners.delete(entry);
    }

    logger.debug(`[EventManager] Removed ${toRemove.length} event listeners from element`);
  }

  /**
   * 모든 이벤트 리스너를 정리합니다.
   */
  public cleanup(): void {
    for (const entry of this.listeners) {
      entry.element.removeEventListener(entry.type, entry.listener, entry.options);
    }

    const count = this.listeners.size;
    this.listeners.clear();

    logger.debug(`[EventManager] Removed ${count} event listeners`);
  }

  /**
   * 현재 활성 이벤트 리스너 수 조회
   */
  public getActiveCount(): number {
    return this.listeners.size;
  }

  /**
   * 타입별 이벤트 리스너 수 조회
   */
  public getCountByType(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const entry of this.listeners) {
      counts[entry.type] = (counts[entry.type] || 0) + 1;
    }

    return counts;
  }
}
