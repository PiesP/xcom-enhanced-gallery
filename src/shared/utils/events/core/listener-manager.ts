/**
 * @fileoverview Event listener manager (Phase 420.3: Listener profiling)
 * @description Phase 329: File separation (SRP compliance)
 *              Listener manipulation features such as addListener, removeListener
 *              Phase 420.3: Integrated listener lifecycle profiling
 */

import { logger } from '@shared/logging';
import type { EventContext } from './event-context';
import { listenerRegistry } from './listener-registry';

/**
 * Generate listener ID
 */
function generateListenerId(ctx?: string): string {
  const r = Math.random().toString(36).slice(2, 11);
  return ctx ? `${ctx}:${r}` : r;
}

/**
 * Add event listener (with safety checks)
 *
 * @param element - Element to register event listener on
 * @param type - Event type
 * @param listener - Event handler
 * @param options - Listener options
 * @param context - Context information (for debugging)
 * @returns Listener ID
 */
export function addListener(
  element: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string,
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

    // **Phase 420.3: Record listener creation in profiler**
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

    // Handle AbortSignal
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
        signal.addEventListener('abort', onAbort, {
          once: true,
        } as AddEventListenerOptions);
      } catch {
        logger.debug('AbortSignal addEventListener not available (ignored)', {
          context,
        });
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
 * Remove event listener
 *
 * @param id - Listener ID
 * @returns Removal success
 */
export function removeEventListenerManaged(id: string): boolean {
  const eventContext = listenerRegistry.get(id);
  if (!eventContext) {
    logger.warn(`Event listener not found for removal: ${id}`);
    return false;
  }

  try {
    // **Phase 420.3: Record listener cleanup in profiler**
    eventContext.element.removeEventListener(
      eventContext.type,
      eventContext.listener,
      eventContext.options,
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
 * Remove listeners by context
 *
 * **Note**: SPA route changes may trigger this multiple times rapidly.
 * This function safely handles duplicate removal attempts by checking
 * if listeners still exist before removal.
 *
 * @param context - Context string
 * @returns Number of removed listeners
 */
export function removeEventListenersByContext(context: string): number {
  const listenersToRemove: string[] = [];

  // Collect listener IDs to remove
  listenerRegistry.forEach((eventContext, id) => {
    if (eventContext.context === context) {
      listenersToRemove.push(id);
    }
  });

  // Remove each listener via removeEventListenerManaged (also removes from DOM)
  // This function safely handles already-removed listeners (returns false)
  let removedCount = 0;
  for (const id of listenersToRemove) {
    if (removeEventListenerManaged(id)) {
      removedCount++;
    }
  }

  if (removedCount > 0) {
    logger.debug(
      `[removeEventListenersByContext] Removed ${removedCount} listeners for context: ${context}`,
    );
  }

  return removedCount;
}

/**
 * Remove all listeners
 */
export function removeAllEventListeners(): void {
  const listeners = listenerRegistry.drain();
  if (listeners.length === 0) {
    return;
  }

  let detachedCount = 0;
  for (const context of listeners) {
    try {
      context.element.removeEventListener(context.type, context.listener, context.options);
      detachedCount++;
    } catch (error) {
      logger.warn(`Failed to remove event listener during drain: ${context.type}`, {
        error,
        context: context.context,
      });
    }
  }

  logger.debug(`[removeAllEventListeners] Removed ${detachedCount} listeners`);
}

/**
 * Get listener status
 */
export function getEventListenerStatus() {
  return listenerRegistry.getStatus();
}
