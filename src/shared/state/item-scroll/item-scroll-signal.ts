/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Signal Adapter
 * @description Solid.js Signal-based ItemScrollState management module
 */

import { getSolid } from '@shared/external/vendors';
import type { ItemScrollState } from './item-scroll-state.ts';
import {
  INITIAL_ITEM_SCROLL_STATE,
  createItemScrollState,
  updateItemScrollState,
  clearItemScrollTimeouts,
  isSameItemScrollState,
} from './item-scroll-state.ts';

const { createSignal } = getSolid();

type Setter<T> = (value: T | ((prev: T) => T)) => T;

/**
 * ItemScrollStateSignal: Solid.js Signal-based state management interface
 */
export interface ItemScrollStateSignal {
  /** Signal getter for current state */
  getState: () => ItemScrollState;
  /** Signal setter to update state */
  setState: Setter<ItemScrollState>;
  /** Reset state (cleanup purpose) */
  reset: () => void;
  /** Clear all timeout IDs */
  clearTimeouts: () => void;
}

/**
 * Item Scroll State Signal creation factory function
 * @param initialState - Initial state value (uses default if omitted)
 * @returns ItemScrollStateSignal interface
 *
 * @example
 * const stateSignal = createItemScrollStateSignal();
 * const state = stateSignal.getState(); // Read current state
 * stateSignal.setState(prev => ({ ...prev, lastScrolledIndex: 5 })); // Update state
 */
export function createItemScrollStateSignal(
  initialState?: Partial<ItemScrollState>
): ItemScrollStateSignal {
  const [getState, setState] = createSignal<ItemScrollState>(createItemScrollState(initialState));

  return {
    getState,
    setState,
    reset: () => {
      setState(INITIAL_ITEM_SCROLL_STATE);
    },
    clearTimeouts: () => {
      setState(prev => clearItemScrollTimeouts(prev));
    },
  };
}

/**
 * Item Scroll State update helper - Solid.js Signal compatible
 * @param setterFn - Solid.js Signal's setState function
 * @param updates - Properties to update
 *
 * @example
 * const stateSignal = createItemScrollStateSignal();
 * updateStateSignal(stateSignal.setState, { lastScrolledIndex: 10 });
 */
export function updateStateSignal(
  setterFn: Setter<ItemScrollState>,
  updates: Partial<ItemScrollState>
): void {
  setterFn(prev => updateItemScrollState(prev, updates));
}

/**
 * Item Scroll State equality comparison helper (Signal aware)
 * @param currentState - Current state
 * @param prevState - Previous state
 * @returns Whether state has changed
 *
 * @example
 * if (hasStateChanged(newState, oldState)) {
 *   // State changed - perform necessary actions
 * }
 */
export function hasItemScrollStateChanged(
  currentState: ItemScrollState,
  prevState: ItemScrollState
): boolean {
  return !isSameItemScrollState(currentState, prevState);
}
