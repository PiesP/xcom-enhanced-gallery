/**
 * @fileoverview 기본 이벤트 리스너 관리
 */

import { logger } from '@shared/logging/logger';

// 기본 이벤트 관리
interface EventContext {
  id: string;
  element: EventTarget;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions | undefined;
  context?: string | undefined;
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
 * 이벤트 리스너 추가 (안전성 검사 포함)
 */
export function addListener(
  element: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string {
  const id = generateListenerId(context);

  try {
    element.addEventListener(type, listener, options);

    listeners.set(id, {
      id,
      element,
      type,
      listener,
      options,
      context,
      created: Date.now(),
    });

    logger.debug(`이벤트 리스너 추가: ${type} (ID: ${id})`);
    return id;
  } catch (error) {
    logger.error(`이벤트 리스너 추가 실패: ${type}`, error);
    throw error;
  }
}

/**
 * 여러 이벤트 리스너를 동시에 추가
 */
export function addMultipleEventListeners(
  element: EventTarget,
  events: Array<{ type: string; listener: EventListener; options?: AddEventListenerOptions }>,
  context?: string
): string[] {
  return events.map(({ type, listener, options }) =>
    addListener(element, type, listener, options, context)
  );
}

/**
 * 관리되는 이벤트 리스너 제거
 */
export function removeEventListenerManaged(id: string): boolean {
  const eventContext = listeners.get(id);
  if (!eventContext) {
    logger.warn(`이벤트 리스너를 찾을 수 없음: ${id}`);
    return false;
  }

  try {
    eventContext.element.removeEventListener(
      eventContext.type,
      eventContext.listener,
      eventContext.options
    );
    listeners.delete(id);
    logger.debug(`이벤트 리스너 제거: ${eventContext.type} (ID: ${id})`);
    return true;
  } catch (error) {
    logger.error(`이벤트 리스너 제거 실패: ${id}`, error);
    return false;
  }
}

/**
 * 컨텍스트별 이벤트 리스너 제거
 */
export function removeEventListenersByContext(context: string): number {
  let removedCount = 0;
  for (const [id, eventContext] of listeners) {
    if (eventContext.context === context) {
      if (removeEventListenerManaged(id)) {
        removedCount++;
      }
    }
  }
  logger.debug(`컨텍스트 '${context}'의 이벤트 리스너 ${removedCount}개 제거`);
  return removedCount;
}

/**
 * 타입별 이벤트 리스너 제거
 */
export function removeEventListenersByType(type: string): number {
  let removedCount = 0;
  for (const [id, eventContext] of listeners) {
    if (eventContext.type === type) {
      if (removeEventListenerManaged(id)) {
        removedCount++;
      }
    }
  }
  logger.debug(`타입 '${type}'의 이벤트 리스너 ${removedCount}개 제거`);
  return removedCount;
}

/**
 * 모든 이벤트 리스너 제거
 */
export function removeAllEventListeners(): void {
  const count = listeners.size;
  for (const [id] of listeners) {
    removeEventListenerManaged(id);
  }
  logger.debug(`모든 이벤트 리스너 ${count}개 제거`);
}

/**
 * 이벤트 리스너 상태 조회
 */
export function getEventListenerStatus() {
  return {
    total: listeners.size,
    byType: Array.from(listeners.values()).reduce(
      (acc, { type }) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byContext: Array.from(listeners.values()).reduce(
      (acc, { context }) => {
        if (context) {
          acc[context] = (acc[context] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

/**
 * 이벤트 디스패처 정리
 */
export function cleanupEventDispatcher(): void {
  removeAllEventListeners();
  logger.debug('이벤트 디스패처 정리 완료');
}
