/**
 * Focus Trap Hook for Accessibility (WCAG 2.1 AA)
 *
 * **Purpose**: Wraps the focus-trap utility to provide Solid.js reactive control over focus
 * trapping within modals and dialogs. Ensures keyboard focus remains confined within the
 * specified container while active, improving accessibility for screen reader users.
 *
 * **Features**:
 * - Reactive container and active state via Solid.js accessors
 * - Automatic trap lifecycle management with proper cleanup
 * - State synchronization between input signal and trap activation
 * - Support for both Ref objects and direct HTMLElement references
 * - Error-safe destruction (try-finally pattern)
 *
 * **Solid.js Integration**:
 * - `createEffect` for trap initialization and state tracking
 * - `onCleanup` for destruction and memory leak prevention
 * - Accessors for reactive container and active state
 *
 * **Performance Notes**:
 * - Trap creation is deferred until container resolves and effect runs
 * - Activation/deactivation do not re-create trap (lightweight state toggle)
 * - Destruction properly clears references to allow GC collection
 *
 * **Example**:
 * ```typescript
 * const [isDialogOpen, setIsDialogOpen] = createSignal(false);
 * const dialogRef = createRef<HTMLDivElement>();
 * const trapResult = useFocusTrap(dialogRef, isDialogOpen);
 *
 * // Focus is now trapped within dialogRef while isDialogOpen is true
 * // Tab navigation loops within dialog, returns to trigger on ESC
 * ```
 *
 * @version 3.0.0 - Implementation unified (util-delegation)
 * @internal Hook for modal/dialog component integration
 */

import { getSolid } from '@shared/external/vendors';
import {
  createFocusTrap,
  type FocusTrap as FocusTrapUtil,
  type FocusTrapOptions as UtilOptions,
} from '@shared/utils/focus-trap';

export interface FocusTrapOptions extends UtilOptions {
  /**
   * Previous focus element to restore after trap deactivates
   * Used for programmatic focus management
   * @internal Optional state tracking
   */
  previousFocusElement?: HTMLElement | null;
  /**
   * CSS selector for finding previous focus element
   * Fallback if direct reference not available
   * @internal Optional state tracking
   */
  previousFocusSelector?: string | null;
}

export interface FocusTrapResult {
  /**
   * Current activation state of the focus trap
   * @readonly
   */
  isActive: boolean;
  /**
   * Activate focus trapping
   * Confines keyboard focus to container, returns on ESC/outside click
   */
  activate: () => void;
  /**
   * Deactivate focus trapping
   * Restores normal focus behavior
   */
  deactivate: () => void;
}

type RefLike = { current: HTMLElement | null } | null;
type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

/**
 * Check if value is a Ref-like object
 * @internal Helper for Solid.js ref resolution
 */
function isRefLike(value: unknown): value is { current: HTMLElement | null } {
  if (typeof value !== 'object' || value === null) return false;
  return Object.prototype.hasOwnProperty.call(value as Record<string, unknown>, 'current');
}

/**
 * Resolve container element from Ref or direct HTMLElement
 * @internal Helper for container resolution
 */
function resolveElement(candidate: RefLike | HTMLElement | null): HTMLElement | null {
  if (!candidate) return null;
  if (isRefLike(candidate)) {
    return candidate.current;
  }
  return candidate as HTMLElement | null;
}

export function useFocusTrap(
  containerOrRef: MaybeAccessor<RefLike | HTMLElement | null>,
  isActiveInput: MaybeAccessor<boolean>,
  options: FocusTrapOptions = {}
): FocusTrapResult {
  /**
   * useFocusTrap: Reactive focus trap for modal/dialog accessibility
   *
   * **Arguments**:
   * - `containerOrRef`: Container element or Ref, or Solid.js signal/selector accessor
   * - `isActiveInput`: Boolean or Solid.js signal indicating if trap should be active
   * - `options`: FocusTrapOptions extending UtilOptions (focus selectors, previous focus)
   *
   * **Returns**: FocusTrapResult with isActive getter and activate/deactivate methods
   *
   * **Lifecycle**:
   * 1. Effect initializes trap when container resolves
   * 2. On mount: If isActive is true, immediately activates trap
   * 3. Secondary effect watches isActive changes and toggles trap without re-initialization
   * 4. On cleanup: Destroys trap with error handling (try-finally)
   * 5. References cleared to allow GC collection
   *
   * **State Synchronization**:
   * - Container changes: Re-creates trap (destroy → create → re-activate if needed)
   * - Active changes: Toggles existing trap (no re-creation)
   * - Error handling: Destruction always completes even if error occurs
   *
   * **Performance**:
   * - Trap creation deferred until container available (lazy initialization)
   * - Activate/deactivate are lightweight (no DOM queries, no re-creation)
   * - Memory-safe: All references cleared on unmount
   *
   * @internal Hook for Solid.js integration
   */
  const { createEffect, onCleanup } = getSolid();

  const resolveContainer: Accessor<RefLike | HTMLElement | null> =
    typeof containerOrRef === 'function'
      ? (containerOrRef as Accessor<RefLike | HTMLElement | null>)
      : () => containerOrRef;
  const resolveIsActive: Accessor<boolean> =
    typeof isActiveInput === 'function'
      ? (isActiveInput as Accessor<boolean>)
      : () => isActiveInput;
  let trap: FocusTrapUtil | null = null;
  let isActive = false;

  /**
   * Container resolution effect: Initialize trap on container change
   * @internal Solid.js effect
   */
  createEffect(() => {
    const element = resolveElement(resolveContainer());

    trap?.destroy();
    trap = null;
    isActive = false;

    if (!element) {
      return;
    }

    trap = createFocusTrap(element, options);
    if (resolveIsActive()) {
      trap.activate();
      isActive = true;
    }

    onCleanup(() => {
      try {
        trap?.destroy();
      } finally {
        trap = null;
        isActive = false;
      }
    });
  });

  /**
   * Active state change effect: Toggle trap without re-creation
   * Lightweight update that does not recreate trap instance
   * @internal Solid.js effect
   */
  createEffect(() => {
    if (!trap) return;
    const active = resolveIsActive();
    if (active && !isActive) {
      trap.activate();
      isActive = true;
    } else if (!active && isActive) {
      trap.deactivate();
      isActive = false;
    }
  });

  return {
    /**
     * Current trap activation state
     * Reflects actual activation (not input signal), updated by both effects
     * @readonly Getter, managed internally
     */
    get isActive() {
      return isActive;
    },
    /**
     * Manually activate trap (bypasses isActiveInput)
     * Useful for imperative activation without changing input signal
     * @internal Action
     */
    activate: () => {
      if (!trap) return;
      trap.activate();
      isActive = true;
    },
    /**
     * Manually deactivate trap (bypasses isActiveInput)
     * Useful for imperative deactivation without changing input signal
     * @internal Action
     */
    deactivate: () => {
      if (!trap) return;
      trap.deactivate();
      isActive = false;
    },
  } as FocusTrapResult;
}
