/**
 * @fileoverview 간소화된 이벤트 디스패처
 * @description 함수 기반 이벤트 리스너 관리 시스템
 * @version 2.0.0 - Phase 3 Simplified
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

// 모듈 레벨 상태 관리
const listeners = new Map<string, EventContext>();
let listenerIdCounter = 0;

/**
 * 고유 리스너 ID 생성
 */
function generateListenerId(context?: string): string {
  const timestamp = Date.now();
  const counter = ++listenerIdCounter;
  const random = Math.random().toString(36).substr(2, 6);

  return context
    ? `${context}:${timestamp}_${counter}_${random}`
    : `event_${timestamp}_${counter}_${random}`;
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
export function addEventListenerManaged(
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

  const id = generateListenerId(context);

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

    listeners.set(id, eventContext);
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
export function addMultipleEventListeners(
  element: EventTarget,
  types: string[],
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string[] {
  const ids: string[] = [];

  for (const type of types) {
    const id = addEventListenerManaged(element, type, listener, options, context);
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
export function removeEventListenerManaged(id: string): boolean {
  const eventContext = listeners.get(id);
  if (!eventContext) {
    return false;
  }

  try {
    eventContext.element.removeEventListener(
      eventContext.type,
      eventContext.listener,
      eventContext.options
    );

    listeners.delete(id);
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
export function removeEventListenersByContext(context: string): number {
  let count = 0;
  const contextPrefix = `${context}:`;

  for (const [id, eventContext] of listeners.entries()) {
    if (id.startsWith(contextPrefix) || eventContext.context === context) {
      if (removeEventListenerManaged(id)) {
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
export function removeEventListenersByType(type: string): number {
  let count = 0;

  for (const [id, eventContext] of listeners.entries()) {
    if (eventContext.type === type) {
      if (removeEventListenerManaged(id)) {
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
export function removeAllEventListeners(): void {
  const count = listeners.size;

  for (const [id, eventContext] of listeners.entries()) {
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

  listeners.clear();
  logger.debug(`[EventDispatcher] Removed all event listeners: ${count}`);
}

/**
 * 이벤트 리스너 상태 정보 반환
 */
export function getEventListenerStatus(): {
  total: number;
  byType: Record<string, number>;
  byContext: Record<string, number>;
  oldest?: { id: string; age: number };
} {
  const byType: Record<string, number> = {};
  const byContext: Record<string, number> = {};
  let oldest: { id: string; age: number } | undefined;
  const now = Date.now();

  for (const [id, eventContext] of listeners.entries()) {
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
    total: listeners.size,
    byType,
    byContext,
    ...(oldest && { oldest }),
  };
}

/**
 * 이벤트 디스패처 정리 (리소스 관리용)
 */
export function cleanupEventDispatcher(): void {
  removeAllEventListeners();
}

// 레거시 클래스 API 호환성 제공
export class EventDispatcher {
  public static getInstance(): EventDispatcher {
    return new EventDispatcher();
  }

  public add(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    return addEventListenerManaged(element, type, listener, options, context);
  }

  public addMultiple(
    element: EventTarget,
    types: string[],
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string[] {
    return addMultipleEventListeners(element, types, listener, options, context);
  }

  public remove(id: string): boolean {
    return removeEventListenerManaged(id);
  }

  public removeByContext(context: string): number {
    return removeEventListenersByContext(context);
  }

  public removeByType(type: string): number {
    return removeEventListenersByType(type);
  }

  public removeAll(): void {
    removeAllEventListeners();
  }

  public getStatus() {
    return getEventListenerStatus();
  }

  public cleanup(): void {
    cleanupEventDispatcher();
  }
}
