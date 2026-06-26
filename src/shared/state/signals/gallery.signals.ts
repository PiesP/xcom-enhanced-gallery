// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Gallery state management with fine-grained signals
 *
 * Provides reactive gallery state management using Solid.js signals.
 * Gallery open/close transitions are committed through a dedicated session
 * update helper so subscribers observe a complete snapshot.
 *
 * @module gallery.signals
 */

/** Navigation source type - tracks what triggered the navigation */
export type NavigationSource =
  | 'button'
  | 'click'
  | 'keyboard'
  | 'programmatic'
  | 'scroll'
  | 'auto-focus';

import { logger } from '@shared/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';
import { createEventEmitter } from '@shared/utils/events/emitter';
import { clampIndex } from '@shared/utils/types/number-utils';
import { batch, createSignal } from 'solid-js';

// ========================
// Navigation state (inlined from navigation.state.ts)
// ========================
const INITIAL_NAV_SOURCE: NavigationSource = 'auto-focus';

const [_navSource, setNavSource] = createSignal<NavigationSource>(INITIAL_NAV_SOURCE);
const [_navTimestamp, setNavTimestamp] = createSignal<number>(0);
const [_navIndex, setNavIndex] = createSignal<number | null>(null);

const isManualSource = (source: NavigationSource): boolean =>
  source === 'button' || source === 'keyboard';

/**
 * Records a navigation event with target index, source, and timestamp.
 * Skips duplicate manual-source navigations to the same index (only updates timestamp).
 *
 * @param targetIndex - The navigation target item index
 * @param source - How the navigation was triggered (button, keyboard, scroll, etc.)
 * @param nowMs - Optional timestamp in milliseconds (defaults to `performance.now()`)
 */
export function recordNavigation(
  targetIndex: number,
  source: NavigationSource,
  nowMs?: number
): void {
  const timestamp = nowMs ?? performance.now();
  const currentIndex = _navIndex();
  const currentSource = _navSource();

  if (targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource)) {
    setNavTimestamp(timestamp);
    return;
  }

  setNavSource(source);
  setNavTimestamp(timestamp);
  setNavIndex(targetIndex);
}

/**
 * Resets navigation state to initial values.
 * Typically called on gallery open/close to clear the previous session's navigation history.
 *
 * @param nowMs - Optional timestamp in milliseconds (defaults to `performance.now()`)
 */
export function resetNavigation(nowMs?: number): void {
  setNavSource(INITIAL_NAV_SOURCE);
  setNavTimestamp(nowMs ?? performance.now());
  setNavIndex(null);
}

// ========================

export interface GalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly error: string | null;
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
  readonly trigger: NavigationSource;
}

const INITIAL_STATE: GalleryState = {
  isOpen: false,
  mediaItems: [],
  currentIndex: 0,
  error: null,
};

export const galleryIndexEvents = createEventEmitter<{
  'navigate:complete': GalleryNavigateCompletePayload;
}>();

const [isOpenSig, setIsOpenSig] = createSignal<boolean>(INITIAL_STATE.isOpen);
function setIsOpen(value: boolean): void {
  setIsOpenSig(value);
}
const [mediaItemsSig, setMediaItems] = createSignal<readonly MediaInfo[]>(INITIAL_STATE.mediaItems);
const [currentIndexSig, setCurrentIndex] = createSignal<number>(INITIAL_STATE.currentIndex);
const [focusedIndexSig, setFocusedIndex] = createSignal<number | null>(null);
export const [currentVideoElementSig, setCurrentVideoElement] =
  createSignal<HTMLVideoElement | null>(null);

const [_errorSig, _setErrorSig] = createSignal<string | null>(INITIAL_STATE.error);

/**
 * Gallery state proxy object.
 *
 * ⚠️ IMPORTANT: This object's getters read signals and are ONLY reactive
 * inside Solid.js tracking scopes (createEffect, createMemo, JSX).
 * Reading these properties outside a tracking scope returns stale values.
 *
 * For direct signal access, use the exported signal accessors instead.
 */
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
  get error() {
    return _errorSig();
  },
  get focusedIndex() {
    return focusedIndexSig();
  },
  get currentVideoElement() {
    return currentVideoElementSig();
  },
};

/**
 * Sets or clears the gallery error message.
 * Pass `null` to clear a previously set error.
 *
 * @param error - Error message string, or `null` to clear
 */
export function setError(error: string | null): void {
  batch(() => {
    _setErrorSig(error);
  });
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

/**
 * Opens the gallery with the given media items.
 * Resets navigation state and clears any previous error.
 * All state updates are batched so subscribers receive a single snapshot.
 *
 * @param items - Media items to display in the gallery
 * @param startIndex - Initial focused item index (default: 0, clamped to valid range)
 */
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

/**
 * Closes the gallery and resets all session state.
 * Media items are cleared, indices reset, and navigation state is re-initialized.
 */
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

/**
 * Navigates to the next item in the gallery.
 * No-op when at the last item or when there are ≤1 items.
 * Emits `navigate:complete` event on success.
 *
 * @param trigger - How the navigation was triggered (default: `'click'`)
 */
export function navigateNext(trigger: NavigationSource = 'click'): void {
  const items = mediaItemsSig();
  const current = currentIndexSig();
  if (items.length <= 1) return;

  const next = current + 1;
  if (next >= items.length) return;

  batch(() => {
    setCurrentIndex(next);
    setFocusedIndex(next);
  });
  recordNavigation(next, trigger);
  galleryIndexEvents.emit('navigate:complete', { index: next, trigger });
}

/**
 * Navigates to the previous item in the gallery.
 * No-op when at the first item or when there are ≤1 items.
 * Emits `navigate:complete` event on success.
 *
 * @param trigger - How the navigation was triggered (default: `'click'`)
 */
export function navigatePrevious(trigger: NavigationSource = 'click'): void {
  const items = mediaItemsSig();
  const current = currentIndexSig();
  if (items.length <= 1) return;

  const prev = current - 1;
  if (prev < 0) return;

  batch(() => {
    setCurrentIndex(prev);
    setFocusedIndex(prev);
  });
  recordNavigation(prev, trigger);
  galleryIndexEvents.emit('navigate:complete', { index: prev, trigger });
}

/**
 * Navigates directly to a specific item index.
 * The target index is clamped to the valid range. No-op when already at the target.
 * Emits `navigate:complete` event on success.
 *
 * @param targetIndex - Desired item index (clamped to `[0, items.length)`)
 * @param source - How the navigation was triggered
 */
export function navigateToItem(targetIndex: number, source: NavigationSource): void {
  const items = mediaItemsSig();
  const clampedIndex = clampIndex(targetIndex, items.length);
  const current = currentIndexSig();

  if (clampedIndex === current) return;

  batch(() => {
    setCurrentIndex(clampedIndex);
    setFocusedIndex(clampedIndex);
  });

  recordNavigation(clampedIndex, source);
  galleryIndexEvents.emit('navigate:complete', { index: clampedIndex, trigger: source });
}

// ========================
// Download state (inlined from download.signals.ts)
// ========================

const [_isProcessing, _setIsProcessing] = createSignal<boolean>(false);

export const downloadState = {
  get isProcessing(): boolean {
    return _isProcessing();
  },
};

/**
 * Sets the download processing state.
 * Used by download hooks to signal that a download operation is in progress,
 * which disables UI controls to prevent concurrent downloads.
 *
 * @param value - `true` when a download starts, `false` when it completes
 */
export function setDownloading(value: boolean): void {
  _setIsProcessing(value);
}

/**
 * Resets all gallery signals to their initial state.
 * Called during cleanup to prevent stale state across sessions.
 */
export function disposeGallerySignals(): void {
  galleryIndexEvents.dispose();
  batch(() => {
    setIsOpenSig(INITIAL_STATE.isOpen);
    setMediaItems(INITIAL_STATE.mediaItems);
    setCurrentIndex(INITIAL_STATE.currentIndex);
    setFocusedIndex(null);
    setCurrentVideoElement(null);
    _setErrorSig(INITIAL_STATE.error);
    setNavSource(INITIAL_NAV_SOURCE);
    setNavTimestamp(0);
    setNavIndex(null);
    _setIsProcessing(false);
  });
}
