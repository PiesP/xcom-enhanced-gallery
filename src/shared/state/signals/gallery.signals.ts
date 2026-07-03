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

import { logger } from '@shared/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';
import { createEventEmitter } from '@shared/utils/events/emitter';
import { clampIndex } from '@shared/utils/types/number-utils';
import { batch, createSignal } from 'solid-js';
import { _setIsProcessing } from './gallery-download-signals';
import {
  INITIAL_NAV_SOURCE,
  type NavigationSource,
  recordNavigation,
  resetNavigation,
  setNavIndex,
  setNavSource,
  setNavTimestamp,
} from './gallery-navigation-signals';

export type { NavigationSource };
export { recordNavigation, resetNavigation };

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
    setIsOpenSig(state.isOpen);
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

  if (__DEV__ && clampedIndex !== targetIndex) {
    console.debug('[gallery] navigateToItem clamped index', {
      targetIndex,
      clampedIndex,
      itemCount: items.length,
    });
  }

  if (clampedIndex === current) return;

  batch(() => {
    setCurrentIndex(clampedIndex);
    setFocusedIndex(clampedIndex);
  });

  recordNavigation(clampedIndex, source);
  galleryIndexEvents.emit('navigate:complete', { index: clampedIndex, trigger: source });
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
