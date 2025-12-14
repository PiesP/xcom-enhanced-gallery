/**
 * @fileoverview Gallery State Management
 * @version 3.1.0 - Phase: Signal Update Order Fix
 *
 * Gallery state management using fine-grained signals.
 * Refactored to use modular state management:
 * - navigation.state.ts for navigation tracking
 * - ui.state.ts for UI state (loading, error, viewMode)
 *
 * This file maintains backward compatibility while delegating to specialized modules.
 *
 * IMPORTANT: Signal update order within batch() operations is critical.
 * See GALLERY_SIGNAL_UPDATE_ORDER and applyGalleryStateUpdate for details.
 */

import { logger } from '@shared/logging';
import {
  type NavigationStateData,
  type NavigationTrigger,
  recordFocusChange,
  recordNavigation,
  resetNavigation,
  resolveNavigationSource,
  validateFocusParams,
  validateNavigationParams,
} from '@shared/state/signals/navigation.state';
import { createSignalSafe, effectSafe } from '@shared/state/signals/signal-factory';
import { uiSignals, type ViewMode } from '@shared/state/signals/ui.state';
import type { MediaInfo } from '@shared/types/media.types';
import type { NavigationSource } from '@shared/types/navigation.types';
import { createEventEmitter } from '@shared/utils/events/emitter';
import { clampIndex } from '@shared/utils/types/safety';
import { batch as solidBatch } from 'solid-js';

type BatchExecutor = (fn: () => void) => void;

const batch: BatchExecutor = solidBatch;

/**
 * Gallery state interface
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly viewMode: ViewMode;
}

/**
 * Initial state
 */
const INITIAL_STATE: GalleryState = {
  isOpen: false,
  mediaItems: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  viewMode: 'vertical',
};

/**
 * Gallery event types
 */
export type GalleryEvents = {
  'gallery:open': { items: readonly MediaInfo[]; startIndex: number };
  'gallery:close': Record<string, never>;
  'gallery:navigate': { index: number };
  'gallery:error': { error: string };
};

export type GalleryNavigationTrigger = NavigationTrigger;

export interface GalleryNavigateStartPayload {
  from: number;
  to: number;
  trigger: GalleryNavigationTrigger;
}

export interface GalleryNavigateCompletePayload {
  index: number;
  trigger: GalleryNavigationTrigger;
}

// Re-export NavigationSource type for backward compatibility
export type { NavigationSource };

// Re-export navigation types from navigation.state.ts
export type { NavigationTrigger };

// ============================================================================
// Navigation State Management (delegated to navigation.state.ts)
// ============================================================================

// Re-export NavigationState as NavigationStateData for backward compatibility
export type { NavigationStateData as NavigationState };

// Removed deprecated delegation functions. Use direct imports:
// - getNavigationState() from '@shared/state/signals/navigation.state'
// - getLastNavigationSource() from '@shared/state/signals/navigation.state'

/**
 * Gallery index navigation events for tracking navigation state transitions
 */
export const galleryIndexEvents = createEventEmitter<{
  'navigate:start': GalleryNavigateStartPayload;
  'navigate:complete': GalleryNavigateCompletePayload;
}>();

// ============================================================================
// Fine-grained Signals
// ============================================================================

export const gallerySignals = {
  isOpen: createSignalSafe<boolean>(INITIAL_STATE.isOpen),
  mediaItems: createSignalSafe<readonly MediaInfo[]>(INITIAL_STATE.mediaItems),
  currentIndex: createSignalSafe<number>(INITIAL_STATE.currentIndex),
  // Delegate to ui.state.ts signals
  isLoading: uiSignals.isLoading,
  error: uiSignals.error,
  viewMode: uiSignals.viewMode,
  focusedIndex: createSignalSafe<number | null>(null),
  /**
   * Phase 329: DOM query caching
   * Current gallery video element (keyboard performance optimization)
   * - Use Signal reference instead of DOM query per keyboard event
   * - Performance improvement: 30% ↑
   */
  currentVideoElement: createSignalSafe<HTMLVideoElement | null>(null),
};

// ============================================================================
// Backward Compatibility Layer
// ============================================================================

/**
 * Signal update order for batch operations.
 *
 * CRITICAL: `isOpen` must be updated LAST within batch() operations.
 *
 * **Reason**: createSignalSafe's notify() is called immediately when a value
 * is set, even inside batch(). GalleryRenderer subscribes to isOpen and
 * checks mediaItems.value.length in renderGallery(). If isOpen is set first,
 * the subscriber callback fires before mediaItems is updated, causing
 * renderGallery() to see an empty array and skip rendering.
 *
 * **Correct order**: data signals → trigger signal (isOpen)
 *
 * @see GalleryRenderer.setupStateSubscription for the subscriber that depends on this order
 */
const GALLERY_SIGNAL_UPDATE_ORDER = [
  'mediaItems',
  'currentIndex',
  'isLoading',
  'error',
  'viewMode',
  'isOpen', // Must be last - triggers rendering
] as const;

/**
 * Apply gallery state updates in the correct order within a batch.
 *
 * This helper ensures isOpen is always set last to prevent race conditions
 * with subscribers that depend on other state values being ready.
 *
 * @param state - The new gallery state to apply
 * @internal
 */
function applyGalleryStateUpdate(state: GalleryState): void {
  batch(() => {
    // Update data signals first (order among these doesn't matter)
    gallerySignals.mediaItems.value = state.mediaItems;
    gallerySignals.currentIndex.value = state.currentIndex;
    gallerySignals.isLoading.value = state.isLoading;
    gallerySignals.error.value = state.error;
    gallerySignals.viewMode.value = state.viewMode;
    // Trigger signal MUST be last - subscribers may read other signals
    gallerySignals.isOpen.value = state.isOpen;
  });
}

/**
 * Composed state accessor (internally uses fine-grained signals)
 * Prefer gallerySignals.* for fine-grained reactivity
 *
 * @remarks
 * The setter uses {@link applyGalleryStateUpdate} to ensure correct
 * signal update order. See {@link GALLERY_SIGNAL_UPDATE_ORDER} for details.
 */
export const galleryState = {
  get value(): GalleryState {
    return {
      isOpen: gallerySignals.isOpen.value,
      mediaItems: gallerySignals.mediaItems.value,
      currentIndex: gallerySignals.currentIndex.value,
      isLoading: gallerySignals.isLoading.value,
      error: gallerySignals.error.value,
      viewMode: gallerySignals.viewMode.value,
    };
  },

  set value(state: GalleryState) {
    applyGalleryStateUpdate(state);
  },

  subscribe(callback: (state: GalleryState) => void): () => void {
    return effectSafe(() => {
      callback(galleryState.value);
    });
  },
};

// Export for testing purposes
export { GALLERY_SIGNAL_UPDATE_ORDER, applyGalleryStateUpdate };

// ============================================================================
// Actions
// ============================================================================

export function openGallery(items: readonly MediaInfo[], startIndex = 0): void {
  const validIndex = clampIndex(startIndex, items.length);

  galleryState.value = {
    ...galleryState.value,
    isOpen: true,
    mediaItems: items,
    currentIndex: validIndex,
    error: null,
  };

  gallerySignals.focusedIndex.value = validIndex;

  resetNavigation();

  logger.debug(`[Gallery] Opened with ${items.length} items, starting at index ${validIndex}`);
}

export function closeGallery(): void {
  galleryState.value = {
    ...galleryState.value,
    isOpen: false,
    currentIndex: 0,
    mediaItems: [],
    error: null,
  };

  gallerySignals.focusedIndex.value = null;
  gallerySignals.currentVideoElement.value = null;

  resetNavigation();

  logger.debug('[Gallery] Closed');
}

/**
 * Navigate to media item
 *
 * Synchronizes both currentIndex and focusedIndex to maintain consistency.
 * The focusedIndex represents the visual focus state and should always
 * match currentIndex after navigation.
 */
export function navigateToItem(
  index: number,
  trigger: NavigationTrigger = 'button',
  source?: NavigationSource
): void {
  const state = galleryState.value;
  const validIndex = clampIndex(index, state.mediaItems.length);
  const navigationSource = source ?? resolveNavigationSource(trigger);

  // Validate navigation parameters
  validateNavigationParams(validIndex, navigationSource, trigger, 'navigateToItem');

  const result = recordNavigation(validIndex, navigationSource);

  if (result.isDuplicate) {
    logger.debug(
      `[Gallery] Already at index ${index} (source: ${navigationSource}), ensuring sync`
    );
    // Ensure focusedIndex is synced even on duplicate navigation
    gallerySignals.focusedIndex.value = validIndex;
    return;
  }

  galleryIndexEvents.emit('navigate:start', {
    from: state.currentIndex,
    to: validIndex,
    trigger,
  });

  // Update both indices in sync
  batch(() => {
    galleryState.value = {
      ...state,
      currentIndex: validIndex,
    };
    gallerySignals.focusedIndex.value = validIndex;
  });

  galleryIndexEvents.emit('navigate:complete', { index: validIndex, trigger });

  logger.debug(
    `[Gallery] Navigated to item: ${index} (trigger: ${trigger}, source: ${navigationSource})`
  );
}

/**
 * Navigate to previous item (with wrap-around)
 *
 * Uses focusedIndex as base if available (for scroll-based navigation),
 * otherwise falls back to currentIndex.
 */
export function navigatePrevious(trigger: NavigationTrigger = 'button'): void {
  const state = galleryState.value;
  const baseIndex = getCurrentActiveIndex();
  const newIndex = baseIndex > 0 ? baseIndex - 1 : state.mediaItems.length - 1;
  const source = resolveNavigationSource(trigger);
  navigateToItem(newIndex, trigger, source);
}

/**
 * Navigate to next item (with wrap-around)
 *
 * Uses focusedIndex as base if available (for scroll-based navigation),
 * otherwise falls back to currentIndex.
 */
export function navigateNext(trigger: NavigationTrigger = 'button'): void {
  const state = galleryState.value;
  const baseIndex = getCurrentActiveIndex();
  const newIndex = baseIndex < state.mediaItems.length - 1 ? baseIndex + 1 : 0;
  const source = resolveNavigationSource(trigger);
  navigateToItem(newIndex, trigger, source);
}

// Removed deprecated setLoading(). Use setLoading() from '@shared/state/signals/ui.state' directly.

/**
 * Set focused index for scroll-based focus tracking
 */
export function setFocusedIndex(
  index: number | null,
  source: NavigationSource = 'auto-focus'
): void {
  const state = galleryState.value;

  // Validate focus parameters
  validateFocusParams(index, source, 'setFocusedIndex');

  recordFocusChange(source);

  if (index === null) {
    gallerySignals.focusedIndex.value = null;
    logger.debug('[Gallery] focusedIndex cleared');
    return;
  }

  const validIndex = clampIndex(index, state.mediaItems.length);
  gallerySignals.focusedIndex.value = validIndex;

  logger.debug(`[Gallery] focusedIndex set to ${validIndex} (source: ${source})`);
}

// Removed deprecated UI state delegations. Use direct imports:
// - setError() from '@shared/state/signals/ui.state'
// - setViewMode() from '@shared/state/signals/ui.state'

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get the current active index (focused or current)
 *
 * Returns focusedIndex if available (user is scrolling/viewing a specific item),
 * otherwise returns currentIndex (the officially navigated-to item).
 * This provides a single source of truth for "which item is the user looking at".
 */
export function getCurrentActiveIndex(): number {
  return gallerySignals.focusedIndex.value ?? galleryState.value.currentIndex;
}

export function getCurrentMediaItem(): MediaInfo | null {
  const state = galleryState.value;
  return state.mediaItems[state.currentIndex] || null;
}

export function hasMediaItems(): boolean {
  return galleryState.value.mediaItems.length > 0;
}

export function getMediaItemsCount(): number {
  return galleryState.value.mediaItems.length;
}

export function hasPreviousMedia(): boolean {
  return galleryState.value.mediaItems.length > 1;
}

export function hasNextMedia(): boolean {
  return galleryState.value.mediaItems.length > 1;
}

export const isGalleryOpen = (): boolean => galleryState.value.isOpen;
export const getCurrentIndex = (): number => galleryState.value.currentIndex;
export const getMediaItems = (): readonly MediaInfo[] => galleryState.value.mediaItems;

// Removed deprecated UI state selectors. Use direct imports:
// - isLoading() from '@shared/state/signals/ui.state'
// - getError() from '@shared/state/signals/ui.state'
// - getViewMode() from '@shared/state/signals/ui.state'
