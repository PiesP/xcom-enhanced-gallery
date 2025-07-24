/**
 * @fileoverview 이벤트 디스패처
 * @description 범용 이벤트 리스너 관리 및 추적 기능 제공
 * @version 1.0.0 - Core Layer
 */

import { logger } from '@shared/logging/logger';

interface EventContext {
  id: string;
  element: EventTarget;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions;
  context?: string;
  created: number;
}

/**
 * 이벤트 디스패처
 *
 * 모든 이벤트 리스너를 중앙에서 추적하고 관리하여
 * 메모리 누수를 방지하고 일관된 이벤트 처리를 제공합니다.
 */
export class EventDispatcher {
  private static instance: EventDispatcher | null = null;
  private readonly listeners = new Map<string, EventContext>();
  private listenerIdCounter = 0;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }

  /**
   * 이벤트 리스너 추가
   *
   * @param element 이벤트 대상 요소
   * @param type 이벤트 타입
   * @param listener 이벤트 리스너
   * @param options 이벤트 옵션
   * @param context 선택적 컨텍스트 식별자
   * @returns 리스너 ID
   */
  public add(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    if (!element || !type || !listener) {
      logger.warn('[EventDispatcher] Invalid parameters provided', { element, type, listener });
      return '';
    }

    const id = this.generateId(context);

    try {
      element.addEventListener(type, listener, options);

      const eventContext: EventContext = {
        id,
        element,
        type,
        listener,
        ...(options !== undefined && { options }),
        ...(context !== undefined && { context }),
        created: Date.now(),
      };

      this.listeners.set(id, eventContext);
      logger.debug(`[EventDispatcher] Event listener added: ${id}`, { type, context });

      return id;
    } catch (error) {
      logger.error(`[EventDispatcher] Failed to add event listener`, { type, context, error });
      return '';
    }
  }

  /**
   * 여러 이벤트 타입에 동일한 리스너 추가
   *
   * @param element 이벤트 대상 요소
   * @param types 이벤트 타입 배열
   * @param listener 이벤트 리스너
   * @param options 이벤트 옵션
   * @param context 선택적 컨텍스트 식별자
   * @returns 생성된 리스너 ID 배열
   */
  public addMultiple(
    element: EventTarget,
    types: string[],
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string[] {
    const ids: string[] = [];

    for (const type of types) {
      const id = this.add(element, type, listener, options, context);
      if (id) {
        ids.push(id);
      }
    }

    return ids;
  }

  /**
   * 특정 이벤트 리스너 제거
   *
   * @param id 리스너 ID
   * @returns 제거 성공 여부
   */
  public remove(id: string): boolean {
    const eventContext = this.listeners.get(id);
    if (!eventContext) {
      return false;
    }

    try {
      eventContext.element.removeEventListener(
        eventContext.type,
        eventContext.listener,
        eventContext.options
      );

      this.listeners.delete(id);
      logger.debug(`[EventDispatcher] Event listener removed: ${id}`);
      return true;
    } catch (error) {
      logger.warn(`[EventDispatcher] Failed to remove event listener: ${id}`, { error });
      return false;
    }
  }

  /**
   * 컨텍스트별 이벤트 리스너 제거
   *
   * @param context 컨텍스트 식별자
   * @returns 제거된 리스너 수
   */
  public removeByContext(context: string): number {
    let count = 0;
    const contextPrefix = `${context}:`;

    for (const [id, eventContext] of this.listeners.entries()) {
      if (id.startsWith(contextPrefix) || eventContext.context === context) {
        if (this.remove(id)) {
          count++;
        }
      }
    }

    logger.debug(`[EventDispatcher] Removed ${count} event listeners for context: ${context}`);
    return count;
  }

  /**
   * 이벤트 타입별 리스너 제거
   *
   * @param type 이벤트 타입
   * @returns 제거된 리스너 수
   */
  public removeByType(type: string): number {
    let count = 0;

    for (const [id, eventContext] of this.listeners.entries()) {
      if (eventContext.type === type) {
        if (this.remove(id)) {
          count++;
        }
      }
    }

    logger.debug(`[EventDispatcher] Removed ${count} event listeners of type: ${type}`);
    return count;
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  public removeAll(): void {
    const count = this.listeners.size;

    for (const [id, eventContext] of this.listeners.entries()) {
      try {
        eventContext.element.removeEventListener(
          eventContext.type,
          eventContext.listener,
          eventContext.options
        );
      } catch (error) {
        logger.warn(`[EventDispatcher] Failed to remove event listener during cleanup: ${id}`, {
          error,
        });
      }
    }

    this.listeners.clear();
    logger.debug(`[EventDispatcher] Removed all event listeners: ${count}`);
  }

  /**
   * 이벤트 리스너 상태 정보 반환
   */
  public getStatus(): {
    total: number;
    byType: Record<string, number>;
    byContext: Record<string, number>;
    oldest?: { id: string; age: number };
  } {
    const byType: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    let oldest: { id: string; age: number } | undefined;
    const now = Date.now();

    for (const [id, eventContext] of this.listeners.entries()) {
      byType[eventContext.type] = (byType[eventContext.type] || 0) + 1;

      if (eventContext.context) {
        byContext[eventContext.context] = (byContext[eventContext.context] || 0) + 1;
      }

      const age = now - eventContext.created;
      if (!oldest || age > oldest.age) {
        oldest = { id, age };
      }
    }

    return {
      total: this.listeners.size,
      byType,
      byContext,
      ...(oldest && { oldest }),
    };
  }

  /**
   * 정리 (Cleanupable 인터페이스)
   */
  public cleanup(): void {
    this.removeAll();
  }

  /**
   * 리스너 ID 생성
   */
  private generateId(context?: string): string {
    const timestamp = Date.now();
    const counter = ++this.listenerIdCounter;
    const random = Math.random().toString(36).substr(2, 6);

    return context
      ? `${context}:${timestamp}_${counter}_${random}`
      : `event_${timestamp}_${counter}_${random}`;
  }
}
