/**
 * @fileoverview Hook Utilities Barrel Export
 * @description Phase 350: Common hook utilities unified export
 * @module shared/utils/hooks
 */

// Observer lifecycle management
export {
  createManagedIntersectionObserver,
  createManagedMutationObserver,
  createManagedResizeObserver,
  createObserverGroup,
} from './observer-lifecycle';
export type {
  ObserverType,
  ManagedObserver,
  IntersectionObserverOptions,
  MutationObserverOptions,
  ResizeObserverOptions,
} from './observer-lifecycle';

// Timer cleanup utilities
export {
  createManagedTimeout,
  createManagedInterval,
  createTimerGroup,
  createDebouncedFunction,
  retryWithBackoff,
} from './timer-cleanup';
export type { ManagedTimer } from './timer-cleanup';

// Signal state helpers
export {
  updatePartial,
  mergeDeep,
  resetToInitial,
  updateIf,
  toggle,
  increment,
  decrement,
  pushItem,
  filterItems,
  mapItems,
  updateItemAt,
  removeItemAt,
  batchUpdate,
} from './signal-state-helpers';
export type { SignalSetter, SignalGetter } from './signal-state-helpers';
