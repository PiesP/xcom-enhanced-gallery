/**
 * DOM Ready Solid Primitive (Phase 3)
 * @description Solid.js reactive primitive for DOM ready detection
 * @version 1.0.0 - Migrated from Preact hooks to Solid primitives
 *
 * Migration notes:
 * - Uses createSignal for ready state
 * - Uses createEffect for dependency tracking
 * - Double requestAnimationFrame ensures layout & paint completion
 */

import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';
import { logger } from '@shared/logging/logger';

/**
 * Create a DOM ready primitive (Solid.js)
 * @param dependenciesAccessor Reactive accessor for dependencies array
 * @returns Accessor for DOM ready state
 *
 * @description
 * Returns true after DOM rendering is fully complete.
 * Uses double requestAnimationFrame to ensure both layout and paint are done.
 *
 * @example
 * ```typescript
 * const [count] = createSignal(0);
 * const isReady = createDOMReady(() => [count()]);
 *
 * createEffect(() => {
 *   if (isReady()) {
 *     // DOM is fully rendered
 *     scrollToElement();
 *   }
 * });
 * ```
 */
export function createDOMReady(dependenciesAccessor: Accessor<unknown[]>): Accessor<boolean> {
  const [isReady, setIsReady] = createSignal(false);
  let frameHandle1: number | undefined;
  let frameHandle2: number | undefined;

  // Effect: Track dependencies and check DOM ready
  createEffect(() => {
    // Track dependencies
    const deps = dependenciesAccessor();

    // Reset ready state
    setIsReady(false);

    // Cancel any pending frames
    if (frameHandle1 !== undefined) {
      cancelAnimationFrame(frameHandle1);
    }
    if (frameHandle2 !== undefined) {
      cancelAnimationFrame(frameHandle2);
    }

    logger.debug('createDOMReady: DOM 준비 상태 체크 시작', { deps });

    // Double requestAnimationFrame ensures complete rendering
    frameHandle1 = requestAnimationFrame(() => {
      frameHandle2 = requestAnimationFrame(() => {
        logger.debug('createDOMReady: DOM 렌더링 완료 감지');
        setIsReady(true);
      });
    });
  });

  // Cleanup on disposal
  onCleanup(() => {
    if (frameHandle1 !== undefined) {
      cancelAnimationFrame(frameHandle1);
    }
    if (frameHandle2 !== undefined) {
      cancelAnimationFrame(frameHandle2);
    }
  });

  return isReady;
}
