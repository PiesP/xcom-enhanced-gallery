/**
 * Gallery state management with fine-grained signals
 *
 * Provides reactive gallery state management using Solid.js signals.
 * Delegates to specialized modules:
 * - navigation.state.ts for navigation tracking
 * - ui.state.ts for UI state (loading, error, viewMode)
 *
 * Gallery open/close transitions are committed through a dedicated session
 * update helper so subscribers observe a complete snapshot.
 *
 * @module gallery.signals
 */

import { logger } from '@shared/logging/logger';
import {
  recordFocusChange,
  recordNavigation,
  resetNavigation,
  resolveNavigationSource,
  validateFocusParams,
  validateNavigationParams,
} from '@shared/state/signals/navigation.state';
import { effectSafe } from '@shared/state/signals/signal-factory';
import type { MediaInfo } from '@shared/types/media.types';
import type { NavigationSource } from '@shared/types/navigation.types';
import { createEventEmitter } from '@shared/utils/events/emitter';
import { clampIndex } from '@shared/utils/types/safety';
import { createSignal, batch as solidBatch } from 'solid-js';

type BatchExecutor = (fn: () => void) => void;
const batch: BatchExecutor = (fn: () => void): void => solidBatch(fn);

export type GalleryNavigationTrigger = NavigationSource;

export type ViewMode = 'vertical';

export interface GalleryState {
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

interface GallerySessionState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly focusedIndex: number | null;
  readonly currentVideoElement: HTMLVideoElement | null;
  readonly error: string | null;
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

const [isOpenSig, setIsOpen] = createSignal<boolean>(INITIAL_STATE.isOpen);
const [mediaItemsSig, setMediaItems] = createSignal<readonly MediaInfo[]>(INITIAL_STATE.mediaItems);
const [currentIndexSig, setCurrentIndex] = createSignal<number>(INITIAL_STATE.currentIndex);
const [focusedIndexSig, setFocusedIndex] = createSignal<number | null>(null);
export const [currentVideoElementSig, setCurrentVideoElement] =
  createSignal<HTMLVideoElement | null>(null);

// UI state signals (inlined from ui.state.ts)
const [_viewModeSig, _setViewMode] = createSignal<ViewMode>(INITIAL_STATE.viewMode);
const [_isLoadingSig, _setIsLoading] = createSignal<boolean>(INITIAL_STATE.isLoading);
const [_errorSig, _setErrorSig] = createSignal<string | null>(INITIAL_STATE.error);

export const gallerySignals = {
  get isOpen() {
    return isOpenSig();
  },
  get mediaItems() {
    return mediaItemsSig();
  },
  get currentIndex() {
    return currentIndexSig();
  },
  get isLoading() {
    return _isLoadingSig();
  },
  get error() {
    return _errorSig();
  },
  get viewMode() {
    return _viewModeSig();
  },
  get focusedIndex() {
    return focusedIndexSig();
  },
  get currentVideoElement() {
    return currentVideoElementSig();
  },
};

export function setError(error: string | null): void {
  _setErrorSig(error);
  if (error) {
    _setIsLoading(false);
  }
}

export function subscribeIsOpen(cb: (v: boolean) => void): () => void {
  return effectSafe(() => cb(isOpenSig()));
}

function applyGallerySessionUpdate(state: GallerySessionState): void {
  batch(() => {
    setMediaItems(state.mediaItems);
    setCurrentIndex(state.currentIndex);
    setFocusedIndex(state.focusedIndex);
    setCurrentVideoElement(state.currentVideoElement);
    _setErrorSig(state.error);
    setIsOpen(state.isOpen);
  });
}

export function applyGalleryStateUpdate(state: GalleryState): void {
  batch(() => {
    setMediaItems(state.mediaItems);
    setCurrentIndex(state.currentIndex);
    _setIsLoading(state.isLoading);
    _setErrorSig(state.error);
    _setViewMode(state.viewMode);
    setIsOpen(state.isOpen);
  });
}

export const galleryState = {
  get value(): GalleryState {
    return {
      isOpen: isOpenSig(),
      mediaItems: mediaItemsSig(),
      currentIndex: currentIndexSig(),
      isLoading: gallerySignals.isLoading,
      error: gallerySignals.error,
      viewMode: gallerySignals.viewMode,
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

export function openGallery(items: readonly MediaInfo[], startIndex = 0): void {
  const validIndex = clampIndex(startIndex, items.length);
  applyGallerySessionUpdate({
    isOpen: true,
    mediaItems: items,
    currentIndex: validIndex,
    focusedIndex: validIndex,
    currentVideoElement: null,
    error: null,
  });
  resetNavigation();
  if (__DEV__) {
    logger.debug(`[Gallery] Opened with ${items.length} items, starting at index ${validIndex}`);
  }
}

export function closeGallery(): void {
  applyGallerySessionUpdate({
    isOpen: false,
    currentIndex: 0,
    mediaItems: [],
    focusedIndex: null,
    currentVideoElement: null,
    error: null,
  });
  resetNavigation();
  if (__DEV__) {
    logger.debug('[Gallery] Closed');
  }
}

export function navigateNext(trigger: GalleryNavigationTrigger = 'click'): void {
  const items = mediaItemsSig();
  const current = currentIndexSig();
  if (items.length <= 1) return;

  const next = current + 1;
  if (next >= items.length) return;

  batch(() => {
    setCurrentIndex(next);
    setFocusedIndex(next);
  });
  recordNavigation(next, resolveNavigationSource(trigger));
  galleryIndexEvents.emit('navigate:complete', { index: next, trigger });
}

export function navigatePrevious(trigger: GalleryNavigationTrigger = 'click'): void {
  const items = mediaItemsSig();
  const current = currentIndexSig();
  if (items.length <= 1) return;

  const prev = current - 1;
  if (prev < 0) return;

  batch(() => {
    setCurrentIndex(prev);
    setFocusedIndex(prev);
  });
  recordNavigation(prev, resolveNavigationSource(trigger));
  galleryIndexEvents.emit('navigate:complete', { index: prev, trigger });
}

export function navigateToItem(
  targetIndex: number,
  trigger: GalleryNavigationTrigger,
  source: NavigationSource
): void {
  validateNavigationParams(targetIndex, source, trigger, 'navigateToItem');

  const items = mediaItemsSig();
  const clampedIndex = clampIndex(targetIndex, items.length);
  const current = currentIndexSig();

  if (clampedIndex === current) return;

  batch(() => {
    setCurrentIndex(clampedIndex);
    setFocusedIndex(clampedIndex);
  });

  recordNavigation(clampedIndex, source);
  galleryIndexEvents.emit('navigate:complete', { index: clampedIndex, trigger });
}

export function setGalleryFocus(focusIndex: number | null, source: NavigationSource): void {
  validateFocusParams(focusIndex, source, 'setGalleryFocus');
  setFocusedIndex(focusIndex);
  recordFocusChange(source);
}
