/**
 * Gallery state management with fine-grained signals
 *
 * Provides reactive gallery state management using Solid.js signals.
 * Delegates to specialized modules:
 * - navigation.state.ts for navigation tracking
 * - ui.state.ts for UI state (loading, error, viewMode)
 *
 * **CRITICAL**: `isOpen` signal must be updated LAST in batch() to prevent
 * race conditions with subscribers that depend on other state values.
 *
 * @module gallery.signals
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

type BatchExecutor = (fn: () => void) => void;
const batch: BatchExecutor = (fn: () => void): void => solidBatch(fn);

type GalleryNavigationTrigger = NavigationTrigger;

interface GalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly viewMode: ViewMode;
}

export interface GalleryNavigateStartPayload {
  readonly from: number;
  readonly to: number;
  readonly trigger: GalleryNavigationTrigger;
}

export interface GalleryNavigateCompletePayload {
  readonly index: number;
  readonly trigger: GalleryNavigationTrigger;
}

const INITIAL_STATE: GalleryState = {
  isOpen: false,
  mediaItems: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  viewMode: 'vertical',
};

export const galleryIndexEvents = createEventEmitter<{
  'navigate:start': GalleryNavigateStartPayload;
  'navigate:complete': GalleryNavigateCompletePayload;
}>();

export const gallerySignals = {
  isOpen: createSignalSafe<boolean>(INITIAL_STATE.isOpen),
  mediaItems: createSignalSafe<readonly MediaInfo[]>(INITIAL_STATE.mediaItems),
  currentIndex: createSignalSafe<number>(INITIAL_STATE.currentIndex),
  isLoading: uiSignals.isLoading,
  error: uiSignals.error,
  viewMode: uiSignals.viewMode,
  focusedIndex: createSignalSafe<number | null>(null),
  currentVideoElement: createSignalSafe<HTMLVideoElement | null>(null),
};

export function applyGalleryStateUpdate(state: GalleryState): void {
  batch(() => {
    gallerySignals.mediaItems.value = state.mediaItems;
    gallerySignals.currentIndex.value = state.currentIndex;
    gallerySignals.isLoading.value = state.isLoading;
    gallerySignals.error.value = state.error;
    gallerySignals.viewMode.value = state.viewMode;
    gallerySignals.isOpen.value = state.isOpen;
  });
}

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

export function navigateToItem(
  index: number,
  trigger: NavigationTrigger = 'button',
  source?: NavigationSource
): void {
  const state = galleryState.value;
  const validIndex = clampIndex(index, state.mediaItems.length);
  const navigationSource = source ?? resolveNavigationSource(trigger);

  if (__DEV__) {
    validateNavigationParams(validIndex, navigationSource, trigger, 'navigateToItem');
  }

  const result = recordNavigation(validIndex, navigationSource);

  if (result.isDuplicate) {
    gallerySignals.focusedIndex.value = validIndex;
    return;
  }

  galleryIndexEvents.emit('navigate:start', {
    from: state.currentIndex,
    to: validIndex,
    trigger,
  });

  batch(() => {
    galleryState.value = { ...state, currentIndex: validIndex };
    gallerySignals.focusedIndex.value = validIndex;
  });

  galleryIndexEvents.emit('navigate:complete', { index: validIndex, trigger });

  if (__DEV__) {
    logger.debug(
      `[Gallery] Navigated to item: ${index} (trigger: ${trigger}, source: ${navigationSource})`
    );
  }
}

export function navigatePrevious(trigger: NavigationTrigger = 'button'): void {
  const state = galleryState.value;
  const baseIndex = getCurrentActiveIndex();
  const newIndex = baseIndex > 0 ? baseIndex - 1 : state.mediaItems.length - 1;
  const source = resolveNavigationSource(trigger);
  navigateToItem(newIndex, trigger, source);
}

export function navigateNext(trigger: NavigationTrigger = 'button'): void {
  const state = galleryState.value;
  const baseIndex = getCurrentActiveIndex();
  const newIndex = baseIndex < state.mediaItems.length - 1 ? baseIndex + 1 : 0;
  const source = resolveNavigationSource(trigger);
  navigateToItem(newIndex, trigger, source);
}

export function setFocusedIndex(
  index: number | null,
  source: NavigationSource = 'auto-focus'
): void {
  const state = galleryState.value;

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

export function isGalleryOpen(): boolean {
  return galleryState.value.isOpen;
}

export function getCurrentIndex(): number {
  return galleryState.value.currentIndex;
}

export function getMediaItems(): readonly MediaInfo[] {
  return galleryState.value.mediaItems;
}
