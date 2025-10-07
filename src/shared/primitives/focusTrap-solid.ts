import { getSolid } from '@shared/external/vendors';
const { createEffect, onCleanup } = getSolid();
import type { Accessor } from '@shared/external/vendors';

/**
 * Focus Trap Solid Primitive (Phase 3)
 * @description Solid.js reactive primitive for focus trap functionality
 * @version 3.0.0 - Refactored to return external signal directly (fine-grained reactivity)
 *
 * Migration notes:
 * - Returns external isActiveAccessor directly for synchronous reads
 * - createEffect handles side effects only (DOM manipulation)
 * - Manual activate/deactivate only affect DOM, not external signal
 * - This follows Solid's philosophy: effects for side effects, signals for state
 */

import {
  createFocusTrap as createFocusTrapUtil,
  type FocusTrap as FocusTrapUtil,
  type FocusTrapOptions as UtilOptions,
} from '../utils/focusTrap';

export interface FocusTrapOptions extends UtilOptions {
  previousFocusElement?: HTMLElement | null;
  previousFocusSelector?: string | null;
}

export interface FocusTrapResult {
  /** Focus trap 활성 상태 (reactive accessor) */
  isActive: Accessor<boolean>;
  /** Focus trap 활성화 (DOM only - does not change external signal) */
  activate: () => void;
  /** Focus trap 비활성화 (DOM only - does not change external signal) */
  deactivate: () => void;
}

/**
 * Create a focus trap primitive (Solid.js)
 * @param containerAccessor Reactive accessor for the container element
 * @param isActiveAccessor Reactive accessor for the active state
 * @param options Focus trap options
 * @returns FocusTrapResult with reactive isActive accessor
 */
export function createFocusTrap(
  containerAccessor: Accessor<HTMLElement | null>,
  isActiveAccessor: Accessor<boolean>,
  options: FocusTrapOptions = {}
): FocusTrapResult {
  let trapInstance: FocusTrapUtil | null = null;

  // Effect 1: Container lifecycle management
  createEffect(() => {
    const container = containerAccessor();

    // Cleanup previous instance
    if (trapInstance) {
      trapInstance.destroy();
      trapInstance = null;
    }

    // Create new instance if container exists
    if (container) {
      trapInstance = createFocusTrapUtil(container, options);

      // Check if we should activate immediately
      const shouldBeActive = isActiveAccessor();
      if (shouldBeActive) {
        trapInstance.activate();
      }
    }

    // Cleanup on disposal
    onCleanup(() => {
      if (trapInstance) {
        trapInstance.destroy();
        trapInstance = null;
      }
    });
  });

  // Effect 2: Active state synchronization
  createEffect(() => {
    const shouldBeActive = isActiveAccessor();

    if (!trapInstance) return;

    if (shouldBeActive) {
      trapInstance.activate();
    } else {
      trapInstance.deactivate();
    }
  });

  return {
    // Return external signal directly - synchronous reads
    isActive: isActiveAccessor,
    // Manual methods only affect DOM, not external signal
    activate: () => {
      if (trapInstance) {
        trapInstance.activate();
      }
    },
    deactivate: () => {
      if (trapInstance) {
        trapInstance.deactivate();
      }
    },
  };
}
