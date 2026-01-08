/**
 * Gallery state management with fine-grained signals
 *
 * Provides reactive gallery state management using Solid.js signals.
 * Delegates to specialized modules:
 * - navigation.state.ts for navigation tracking
 * - ui.state.ts for UI state (loading, error, viewMode)
 *
 * Maintains backward compatibility while using modular state management.
 *
 * @module gallery.signals
 * @version 3.2.0
 *
 * @remarks
 * **CRITICAL**: Signal update order within batch() operations is critical.
 * See {@link applyGalleryStateUpdate} for implementation details.
 * The `isOpen` signal must be updated LAST to prevent race conditions
 * with subscribers that depend on other state values.
 */

import { logger } from '@shared/logging/logger';
import {
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

// ============================================================================
// Types
// ============================================================================

/**
 * Batch executor function type
 *
 * @remarks
 * Wraps Solid.js batch() for cleaner type signatures and testability
 */
type BatchExecutor = (fn: () => void) => void;

const batch: BatchExecutor = (fn: () => void): void => solidBatch(fn);

/**
 * Gallery state interface
 *
 * @property isOpen - True when gallery is visible and active
 * @property mediaItems - Array of media items currently loaded in gallery
 * @property currentIndex - Zero-based index of current media item
 * @property isLoading - True when media content is loading
 * @property error - Error message if gallery operation failed, null otherwise
 * @property viewMode - Current view mode ('vertical' or 'horizontal')
 *
 * @remarks
 * All properties are readonly to enforce immutability.
 * State updates should use {@link galleryState} setter or action functions.
 */
interface GalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly viewMode: ViewMode;
}

/**
 * Initial gallery state
 *
 * @remarks
 * Default state when gallery is closed:
 * - Gallery is not open
 * - No media items loaded
 * - Index at 0
 * - No loading or error state
 * - Vertical view mode by default
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
 * Gallery navigation trigger types
 *
 * @remarks
 * Alias for {@link NavigationTrigger} from navigation.state.ts.
 * Represents user actions that trigger gallery navigation:
 * - 'button': Navigation button click
 * - 'keyboard': Keyboard shortcut
 * - 'scroll': Scroll gesture
 * - 'auto': Programmatic navigation
 */
type GalleryNavigationTrigger = NavigationTrigger;

/**
 * Payload for gallery navigation start event
 *
 * @property from - Starting index before navigation
 * @property to - Target index after navigation
 * @property trigger - User action that triggered navigation
 */
export interface GalleryNavigateStartPayload {
  readonly from: number;
  readonly to: number;
  readonly trigger: GalleryNavigationTrigger;
}

/**
 * Payload for gallery navigation complete event
 *
 * @property index - Final index after navigation completed
 * @property trigger - User action that triggered navigation
 */
export interface GalleryNavigateCompletePayload {
  readonly index: number;
  readonly trigger: GalleryNavigationTrigger;
}

// ============================================================================
// Navigation State Management (delegated to navigation.state.ts)
// ============================================================================

/**
 * Gallery index navigation events for tracking navigation state transitions
 *
 * @remarks
 * Emits events when gallery navigation starts and completes.
 * Use this to track navigation lifecycle and respond to index changes.
 *
 * @example
 * ```typescript
 * // Listen to navigation start
 * const unsubscribe = galleryIndexEvents.on('navigate:start', (payload) => {
 *   console.log(`Navigating from ${payload.from} to ${payload.to}`);
 * });
 *
 * // Listen to navigation complete
 * galleryIndexEvents.on('navigate:complete', (payload) => {
 *   console.log(`Navigation complete at index ${payload.index}`);
 * });
 * ```
 */
export const galleryIndexEvents = createEventEmitter<{
  'navigate:start': GalleryNavigateStartPayload;
  'navigate:complete': GalleryNavigateCompletePayload;
}>();

// ============================================================================
// Fine-grained Signals
// ============================================================================

/**
 * Fine-grained reactive signals for gallery state
 *
 * @remarks
 * Provides granular reactivity for gallery state properties.
 * Prefer accessing individual signals over {@link galleryState} when only
 * specific properties are needed to optimize reactivity.
 *
 * Properties:
 * - `isOpen`: Gallery visibility state
 * - `mediaItems`: Array of loaded media items
 * - `currentIndex`: Current media index
 * - `isLoading`: Loading state (delegated to ui.state.ts)
 * - `error`: Error state (delegated to ui.state.ts)
 * - `viewMode`: View mode (delegated to ui.state.ts)
 * - `focusedIndex`: Currently focused item index for scroll tracking
 * - `currentVideoElement`: Current video element reference for keyboard controls
 *
 * @example
 * ```typescript
 * // Subscribe to specific signal
 * createEffect(() => {
 *   console.log('Gallery open:', gallerySignals.isOpen.value);
 * });
 * ```
 */
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
// State Update Helpers
// ============================================================================

/**
 * Signal update order documentation
 *
 * @remarks
 * **CRITICAL**: `isOpen` must be updated LAST within batch() operations.
 *
 * **Reason**: createSignalSafe's notify() is called immediately when a value
 * is set, even inside batch(). GalleryRenderer subscribes to isOpen and
 * checks mediaItems.value.length in renderGallery(). If isOpen is set first,
 * the subscriber callback fires before mediaItems is updated, causing
 * renderGallery() to see an empty array and skip rendering.
 *
 * **Correct order**: data signals → trigger signal (isOpen)
 * Order: mediaItems → currentIndex → isLoading → error → viewMode → isOpen
 *
 * @see GalleryRenderer.setupStateSubscription for the subscriber that depends on this order
 * @see applyGalleryStateUpdate for the implementation that enforces this order
 */

/**
 * Apply gallery state updates in the correct order within a batch
 *
 * @param state - The new gallery state to apply
 *
 * @remarks
 * This helper ensures `isOpen` is always set last to prevent race conditions
 * with subscribers that depend on other state values being ready.
 *
 * **Update Order**:
 * 1. Data signals (mediaItems, currentIndex, isLoading, error, viewMode)
 * 2. Trigger signal (isOpen) - MUST BE LAST
 *
 * The order among data signals doesn't matter, but `isOpen` must be updated
 * after all data signals are ready.
 *
 * @internal
 *
 * @example
 * ```typescript
 * // Correct usage
 * applyGalleryStateUpdate({
 *   isOpen: true,
 *   mediaItems: [...items],
 *   currentIndex: 0,
 *   isLoading: false,
 *   error: null,
 *   viewMode: 'vertical'
 * });
 * ```
 */
export function applyGalleryStateUpdate(state: GalleryState): void {
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
 * Composed state accessor with subscription support
 *
 * @remarks
 * Provides read/write access to complete gallery state and subscription mechanism.
 * The setter uses {@link applyGalleryStateUpdate} to ensure correct signal update
 * order (isOpen must be updated last).
 *
 * **Prefer** {@link gallerySignals} for fine-grained reactivity when only specific
 * properties are needed.
 *
 * @example
 * ```typescript
 * // Read state
 * const state = galleryState.value;
 * console.log('Gallery open:', state.isOpen);
 *
 * // Update state
 * galleryState.value = {
 *   ...galleryState.value,
 *   isOpen: true
 * };
 *
 * // Subscribe to changes
 * const unsubscribe = galleryState.subscribe((newState) => {
 *   console.log('State changed:', newState);
 * });
 * ```
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

// ============================================================================
// Actions
// ============================================================================

/**
 * Open gallery with media items
 *
 * @param items - Array of media items to display in gallery
 * @param startIndex - Zero-based starting index (default: 0, clamped to valid range)
 *
 * @remarks
 * - Validates and clamps startIndex to valid range [0, items.length)
 * - Sets gallery to open state
 * - Initializes focusedIndex to startIndex
 * - Resets navigation tracking
 * - Clears any previous error state
 *
 * @example
 * ```typescript
 * // Open gallery with 5 items, starting at index 2
 * openGallery(mediaItems, 2);
 *
 * // Open gallery at first item (default)
 * openGallery(mediaItems);
 * ```
 */
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

  if (__DEV__) {
    logger.debug(`[Gallery] Opened with ${items.length} items, starting at index ${validIndex}`);
  }
}

/**
 * Close gallery and reset state
 *
 * @remarks
 * - Sets gallery to closed state
 * - Clears all media items
 * - Resets current index to 0
 * - Clears focusedIndex and currentVideoElement
 * - Resets navigation tracking
 * - Clears error state
 *
 * Safe to call when gallery is already closed.
 *
 * @example
 * ```typescript
 * closeGallery();
 * console.log('Gallery closed');
 * ```
 */
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

  if (__DEV__) {
    logger.debug('[Gallery] Closed');
  }
}

/**
 * Navigate to specific media item by index
 *
 * @param index - Target zero-based index (clamped to valid range)
 * @param trigger - Navigation trigger type (default: 'button')
 * @param source - Optional navigation source (resolved from trigger if not provided)
 *
 * @remarks
 * Synchronizes both currentIndex and focusedIndex to maintain consistency.
 * The focusedIndex represents the visual focus state and should always
 * match currentIndex after navigation.
 *
 * **Behavior**:
 * - Validates and clamps index to valid range
 * - Records navigation in navigation tracking system
 * - Emits 'navigate:start' and 'navigate:complete' events
 * - Updates both currentIndex and focusedIndex in sync
 * - Skips duplicate navigation (already at target index)
 *
 * @example
 * ```typescript
 * // Navigate to index 5 via button click
 * navigateToItem(5, 'button');
 *
 * // Navigate via keyboard shortcut
 * navigateToItem(3, 'keyboard');
 *
 * // Navigate with explicit source
 * navigateToItem(0, 'auto', 'programmatic');
 * ```
 */
export function navigateToItem(
  index: number,
  trigger: NavigationTrigger = 'button',
  source?: NavigationSource
): void {
  const state = galleryState.value;
  const validIndex = clampIndex(index, state.mediaItems.length);
  const navigationSource = source ?? resolveNavigationSource(trigger);

  // Validate navigation parameters (dev-only to keep the production bundle lean)
  if (__DEV__) {
    validateNavigationParams(validIndex, navigationSource, trigger, 'navigateToItem');
  }

  const result = recordNavigation(validIndex, navigationSource);

  if (result.isDuplicate) {
    if (__DEV__) {
      logger.debug(
        `[Gallery] Already at index ${index} (source: ${navigationSource}), ensuring sync`
      );
    }
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

  if (__DEV__) {
    logger.debug(
      `[Gallery] Navigated to item: ${index} (trigger: ${trigger}, source: ${navigationSource})`
    );
  }
}

/**
 * Navigate to previous media item with wrap-around
 *
 * @param trigger - Navigation trigger type (default: 'button')
 *
 * @remarks
 * Uses focusedIndex as base if available (for scroll-based navigation),
 * otherwise falls back to currentIndex.
 *
 * **Wrap-around behavior**:
 * - If at index 0, wraps to last item (length - 1)
 * - Otherwise, moves to (currentIndex - 1)
 *
 * @example
 * ```typescript
 * // Navigate to previous via button
 * navigatePrevious('button');
 *
 * // Navigate to previous via keyboard
 * navigatePrevious('keyboard');
 * ```
 */
export function navigatePrevious(trigger: NavigationTrigger = 'button'): void {
  const state = galleryState.value;
  const baseIndex = getCurrentActiveIndex();
  const newIndex = baseIndex > 0 ? baseIndex - 1 : state.mediaItems.length - 1;
  const source = resolveNavigationSource(trigger);
  navigateToItem(newIndex, trigger, source);
}

/**
 * Navigate to next media item with wrap-around
 *
 * @param trigger - Navigation trigger type (default: 'button')
 *
 * @remarks
 * Uses focusedIndex as base if available (for scroll-based navigation),
 * otherwise falls back to currentIndex.
 *
 * **Wrap-around behavior**:
 * - If at last item, wraps to first item (index 0)
 * - Otherwise, moves to (currentIndex + 1)
 *
 * @example
 * ```typescript
 * // Navigate to next via button
 * navigateNext('button');
 *
 * // Navigate to next via keyboard
 * navigateNext('keyboard');
 * ```
 */
export function navigateNext(trigger: NavigationTrigger = 'button'): void {
  const state = galleryState.value;
  const baseIndex = getCurrentActiveIndex();
  const newIndex = baseIndex < state.mediaItems.length - 1 ? baseIndex + 1 : 0;
  const source = resolveNavigationSource(trigger);
  navigateToItem(newIndex, trigger, source);
}

/**
 * Set focused index for scroll-based focus tracking
 *
 * @param index - Target index to focus (null to clear focus)
 * @param source - Navigation source (default: 'auto-focus')
 *
 * @remarks
 * Used for tracking which item has visual focus during scroll operations.
 * Does not trigger navigation events, only updates focusedIndex signal.
 *
 * **Behavior**:
 * - Validates index if non-null (clamped to valid range)
 * - Records focus change in navigation tracking
 * - Updates focusedIndex signal
 * - null clears the focus
 *
 * @internal
 *
 * @example
 * ```typescript
 * // Set focus to index 3 via scroll
 * setFocusedIndex(3, 'scroll');
 *
 * // Clear focus
 * setFocusedIndex(null);
 *
 * // Set focus with auto-focus source (default)
 * setFocusedIndex(5);
 * ```
 */
export function setFocusedIndex(
  index: number | null,
  source: NavigationSource = 'auto-focus'
): void {
  const state = galleryState.value;

  // Validate focus parameters (dev-only to keep the production bundle lean)
  if (__DEV__) {
    validateFocusParams(index, source, 'setFocusedIndex');
  }

  recordFocusChange(source);

  if (index === null) {
    gallerySignals.focusedIndex.value = null;
    if (__DEV__) {
      logger.debug('[Gallery] focusedIndex cleared');
    }
    return;
  }

  const validIndex = clampIndex(index, state.mediaItems.length);
  gallerySignals.focusedIndex.value = validIndex;

  if (__DEV__) {
    logger.debug(`[Gallery] focusedIndex set to ${validIndex} (source: ${source})`);
  }
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get the current active index (focused or current)
 *
 * @returns Currently focused index if available, otherwise current index
 *
 * @remarks
 * Returns focusedIndex if available (user is scrolling/viewing a specific item),
 * otherwise returns currentIndex (the officially navigated-to item).
 * This provides a single source of truth for "which item is the user looking at".
 *
 * Use this when you need to know which item should be considered "active"
 * for UI purposes (e.g., keyboard navigation, status display).
 *
 * @example
 * ```typescript
 * const activeIndex = getCurrentActiveIndex();
 * console.log('User is viewing item:', activeIndex);
 * ```
 */
export function getCurrentActiveIndex(): number {
  return gallerySignals.focusedIndex.value ?? galleryState.value.currentIndex;
}

/**
 * Get current media item
 *
 * @returns Current media item or null if index is out of bounds
 *
 * @internal
 *
 * @example
 * ```typescript
 * const item = getCurrentMediaItem();
 * if (item) {
 *   console.log('Current media:', item.url);
 * }
 * ```
 */
export function getCurrentMediaItem(): MediaInfo | null {
  const state = galleryState.value;
  return state.mediaItems[state.currentIndex] || null;
}

/**
 * Check if gallery has media items
 *
 * @returns True if gallery has at least one media item
 *
 * @internal
 */
export function hasMediaItems(): boolean {
  return galleryState.value.mediaItems.length > 0;
}

/**
 * Get total number of media items
 *
 * @returns Count of media items in gallery
 *
 * @internal
 */
export function getMediaItemsCount(): number {
  return galleryState.value.mediaItems.length;
}

/**
 * Check if previous media navigation is available
 *
 * @returns True if there are multiple items (wrap-around enabled)
 *
 * @remarks
 * Returns true when there are 2+ items, indicating previous navigation
 * will wrap to a different item.
 *
 * @internal
 */
export function hasPreviousMedia(): boolean {
  return galleryState.value.mediaItems.length > 1;
}

/**
 * Check if next media navigation is available
 *
 * @returns True if there are multiple items (wrap-around enabled)
 *
 * @remarks
 * Returns true when there are 2+ items, indicating next navigation
 * will wrap to a different item.
 *
 * @internal
 */
export function hasNextMedia(): boolean {
  return galleryState.value.mediaItems.length > 1;
}

/**
 * Check if gallery is currently open
 *
 * @returns True if gallery is open and visible
 *
 * @internal
 */
export function isGalleryOpen(): boolean {
  return galleryState.value.isOpen;
}

/**
 * Get current media index
 *
 * @returns Zero-based index of current media item
 *
 * @internal
 */
export function getCurrentIndex(): number {
  return galleryState.value.currentIndex;
}

/**
 * Get all media items in gallery
 *
 * @returns Readonly array of all media items
 *
 * @internal
 */
export function getMediaItems(): readonly MediaInfo[] {
  return galleryState.value.mediaItems;
}
