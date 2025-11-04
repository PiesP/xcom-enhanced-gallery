/**
 * @fileoverview 이벤트 리스너 매니저
 * @description Phase 329: 파일 분리 (SRP 준수)
 *              addListener, removeListener 등 리스너 조작 기능
 */

import { logger } from '@shared/logging';
import { listenerRegistry } from './listener-registry';
import type { EventContext } from './event-context';

/**
 * 리스너 ID 생성
 */
function generateListenerId(ctx?: string): string {
  const r = Math.random().toString(36).substr(2, 9);
  return ctx ? `${ctx}:${r}` : r;
}

/**
 * 이벤트 리스너 추가 (안전성 검사 포함)
 *
 * @param element - 이벤트를 등록할 요소
 * @param type - 이벤트 타입
 * @param listener - 이벤트 핸들러
 * @param options - 리스너 옵션
 * @param context - 컨텍스트 정보 (디버깅용)
 * @returns 리스너 ID
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
    if (!element || typeof element.addEventListener !== 'function') {
      logger.warn(`Invalid element passed to addListener: ${element}`, {
        type,
        context,
        elementType: typeof element,
        hasAddEventListener: element && typeof element.addEventListener,
      });
      return id;
    }

    const signal: AbortSignal | undefined = options?.signal as AbortSignal | undefined;
    if (signal?.aborted) {
      logger.debug(`Skip adding listener due to pre-aborted signal: ${type} (${id})`, {
        context,
      });
      return id;
    }

    element.addEventListener(type, listener, options);

    const eventContext: EventContext = {
      id,
      element,
      type,
      listener,
      options,
      context,
      created: Date.now(),
    };

    listenerRegistry.register(id, eventContext);

    // AbortSignal 처리
    if (signal && typeof signal.addEventListener === 'function') {
      const onAbort = () => {
        try {
          removeEventListenerManaged(id);
        } finally {
          try {
            signal.removeEventListener('abort', onAbort);
          } catch {
            logger.debug('AbortSignal removeEventListener safeguard failed (ignored)', {
              context,
            });
          }
        }
      };
      try {
        signal.addEventListener('abort', onAbort, { once: true } as AddEventListenerOptions);
      } catch {
        logger.debug('AbortSignal addEventListener not available (ignored)', { context });
      }
    }

    logger.debug(`Event listener added: ${type} (${id})`, { context });
    return id;
  } catch (error) {
    logger.error(`Failed to add event listener: ${type}`, { error, context });
    return id;
  }
}

/**
 * 이벤트 리스너 제거
 *
 * @param id - 리스너 ID
 * @returns 제거 성공 여부
 */
export function removeEventListenerManaged(id: string): boolean {
  const eventContext = listenerRegistry.get(id);
  if (!eventContext) {
    logger.warn(`Event listener not found for removal: ${id}`);
    return false;
  }

  try {
    eventContext.element.removeEventListener(
      eventContext.type,
      eventContext.listener,
      eventContext.options
    );
    listenerRegistry.unregister(id);

    logger.debug(`Event listener removed: ${eventContext.type} (${id})`);
    return true;
  } catch (error) {
    logger.error(`Failed to remove event listener: ${id}`, error);
    return false;
  }
}

/**
 * 컨텍스트별 리스너 제거
 *
 * @param context - 컨텍스트 문자열
 * @returns 제거된 리스너 개수
 */
export function removeEventListenersByContext(context: string): number {
  return listenerRegistry.unregisterByContext(context);
}

/**
 * 모든 리스너 제거
 */
export function removeAllEventListeners(): void {
  listenerRegistry.clear();
}

/**
 * 리스너 상태 조회
 */
export function getEventListenerStatus() {
  return listenerRegistry.getStatus();
}
