/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Export
 *
 * Unified interface for item scroll state management module
 * - Types: ItemScrollState, ItemScrollStateSignal
 * - Constants: INITIAL_ITEM_SCROLL_STATE
 * - Factories/Utils: creation, update, comparison, signal management
 */

/* ============================================================================
 * Types
 * ============================================================================ */
export type { ItemScrollState } from './item-scroll-state.ts';
export type { ItemScrollStateSignal } from './item-scroll-signal.ts';

/* ============================================================================
 * Constants & Factories
 * ============================================================================ */
export {
  INITIAL_ITEM_SCROLL_STATE,
  createItemScrollState,
  updateItemScrollState,
  resetItemScrollState,
  clearItemScrollTimeouts,
  isSameItemScrollState,
} from './item-scroll-state.ts';

/* ============================================================================
 * Signal Adapter & Utilities
 * ============================================================================ */
export {
  createItemScrollStateSignal,
  updateStateSignal,
  hasItemScrollStateChanged,
} from './item-scroll-signal.ts';
