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

import { clampIndex } from '@piesp/browser-core/util';
import { logger } from '@shared/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';
import { createEventEmitter } from '@shared/utils/events/emitter';
import { batch, createSignal } from 'solid-js';
import {
  _setDownloadStatus,
  setBulkDownloadOutcome,
  setSingleDownloadOutcome,
} from './gallery-download-signals';
import { resolveAdjacentNavigationTarget, resolveDisplayedIndex } from './gallery-navigation';
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

type GalleryErrorOwner = 'bulkDownload' | null;
const [errorOwnerSig, setErrorOwner] = createSignal<GalleryErrorOwner>(null);

interface GallerySessionState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly focusedIndex: number | null;
  readonly currentVideoElement: HTMLVideoElement | null;
  readonly error: string | null;
  readonly recoveryScope: 'visible-tile' | 'visible-article' | 'api-supported-subset' | null;
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

let _galleryIndexEvents: ReturnType<
  typeof createEventEmitter<{
    'navigate:complete': GalleryNavigateCompletePayload;
  }>
> | null = null;

function getGalleryIndexEvents() {
  if (!_galleryIndexEvents) {
    _galleryIndexEvents = createEventEmitter();
  }
  return _galleryIndexEvents;
}

export const galleryIndexEvents = {
  get on() {
    return getGalleryIndexEvents().on.bind(getGalleryIndexEvents());
  },
  get emit() {
    return getGalleryIndexEvents().emit.bind(getGalleryIndexEvents());
  },
  dispose() {
    _galleryIndexEvents?.dispose();
    _galleryIndexEvents = null;
  },
};

const [isOpenSig, setIsOpenSig] = createSignal<boolean>(INITIAL_STATE.isOpen);
const [mediaItemsSig, setMediaItems] = createSignal<readonly MediaInfo[]>(INITIAL_STATE.mediaItems);
const [sessionRevisionSig, setSessionRevision] = createSignal(0);
const [recoveryScopeSig, setRecoveryScope] = createSignal<
  'visible-tile' | 'visible-article' | 'api-supported-subset' | null
>(null);
const [currentIndexSig, setCurrentIndex] = createSignal<number>(INITIAL_STATE.currentIndex);
const [focusedIndexSig, _setFocusedIndex] = createSignal<number | null>(null);

/**
 * Set the focused index directly without triggering navigation events.
 * Used for UI-only focus tracking updates based on the displayed item,
 * where scroll-to-item behavior is undesirable.
 */
export function setFocusedIndexOnly(index: number | null): void {
  _setFocusedIndex(index);
}
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
  /** Changes on every open, close, or disposal, even when media IDs repeat. */
  get sessionRevision() {
    return sessionRevisionSig();
  },
  get recoveryScope() {
    return recoveryScopeSig();
  },
  get currentIndex() {
    return currentIndexSig();
  },
  get error() {
    return _errorSig();
  },
  get errorOwner(): GalleryErrorOwner {
    return errorOwnerSig();
  },
  get focusedIndex() {
    return focusedIndexSig();
  },
  get currentVideoElement() {
    return currentVideoElementSig();
  },
};

/** Commit a source check only to the same live media objects in this session. */
export function applyObservedDownloadSources(
  original: readonly MediaInfo[],
  resolved: readonly MediaInfo[],
  sessionRevision: number
): void {
  if (
    !isOpenSig() ||
    sessionRevisionSig() !== sessionRevision ||
    original.length !== resolved.length
  ) {
    return;
  }
  const current = mediaItemsSig();
  if (
    current.length !== original.length ||
    current.some((media, index) => media !== original[index])
  ) {
    return;
  }
  let changed = false;
  const next = current.map((media, index) => {
    const replacement = resolved[index];
    if (
      media.downloadSource?.quality === 'unverified-original' &&
      replacement &&
      replacement !== media
    ) {
      changed = true;
      return replacement;
    }
    return media;
  });
  if (changed) {
    setMediaItems(next);
  }
}

/**
 * Sets or clears the gallery error message.
 * Pass `null` to clear a previously set error.
 *
 * @param error - Error message string, or `null` to clear
 */
export function setError(error: string | null, owner: GalleryErrorOwner = null): void {
  batch(() => {
    setErrorOwner(error ? owner : null);
    _setErrorSig(error);
  });
}

function applyGallerySessionUpdate(state: GallerySessionState): void {
  setSingleDownloadOutcome(null);
  batch(() => {
    setSessionRevision((revision) => revision + 1);
    setErrorOwner(null);
    setRecoveryScope(state.recoveryScope);
    setMediaItems(state.mediaItems);
    setCurrentIndex(state.currentIndex);
    _setFocusedIndex(state.focusedIndex);
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
export function openGallery(
  items: readonly MediaInfo[],
  startIndex = 0,
  recoveryScope: 'visible-tile' | 'visible-article' | 'api-supported-subset' | null = null
): void {
  const validIndex = clampIndex(startIndex, items.length);
  applyGallerySessionUpdate({
    isOpen: true,
    mediaItems: items,
    currentIndex: validIndex,
    focusedIndex: validIndex,
    currentVideoElement: null,
    error: null,
    recoveryScope,
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
    recoveryScope: null,
  });
  resetNavigation();
  if (__DEV__) {
    logger.debug('[Gallery] Closed');
  }
}

/**
 * Resolves the anchor index for prev/next navigation.
 * Prefers focusedIndexSig (what the user is actually looking at after
 * manual scrolling) over currentIndexSig (last explicitly navigated to).
 * Only uses focusedIndex when it is a valid in-bounds value.
 */
function _resolveNavAnchor(): number {
  return resolveDisplayedIndex(currentIndexSig(), focusedIndexSig(), mediaItemsSig().length) ?? 0;
}

/** The media item described by the toolbar and used for current-item actions. */
export function getDisplayedMediaIndex(): number | null {
  return resolveDisplayedIndex(currentIndexSig(), focusedIndexSig(), mediaItemsSig().length);
}

function commitNavigation(targetIndex: number, source: NavigationSource): void {
  batch(() => {
    setCurrentIndex(targetIndex);
    _setFocusedIndex(targetIndex);
  });
  recordNavigation(targetIndex, source);
  galleryIndexEvents.emit('navigate:complete', { index: targetIndex, trigger: source });
}

/**
 * Navigates to the next item in the gallery.
 * Uses focusedIndex as anchor when available (what the user is looking at),
 * falling back to currentIndex. No-op when at the last item or ≤1 items.
 * Emits `navigate:complete` event on success.
 *
 * @param trigger - How the navigation was triggered (default: `'click'`)
 */
export function navigateNext(trigger: NavigationSource = 'click'): void {
  const items = mediaItemsSig();
  const targetIndex = resolveAdjacentNavigationTarget(_resolveNavAnchor(), 1, items.length);
  if (targetIndex === null) {
    return;
  }

  commitNavigation(targetIndex, trigger);
}

/**
 * Navigates to the previous item in the gallery.
 * Uses focusedIndex as anchor when available (what the user is looking at),
 * falling back to currentIndex. No-op when at the first item or ≤1 items.
 * Emits `navigate:complete` event on success.
 *
 * @param trigger - How the navigation was triggered (default: `'click'`)
 */
export function navigatePrevious(trigger: NavigationSource = 'click'): void {
  const items = mediaItemsSig();
  const targetIndex = resolveAdjacentNavigationTarget(_resolveNavAnchor(), -1, items.length);
  if (targetIndex === null) {
    return;
  }

  commitNavigation(targetIndex, trigger);
}

/**
 * Navigates directly to a specific item index.
 * The target index is clamped to the valid range. No-op only when both the
 * displayed item and last requested destination already match the target.
 * Emits `navigate:complete` event on success.
 *
 * @param targetIndex - Desired item index (clamped to `[0, items.length)`)
 * @param source - How the navigation was triggered
 */
export function navigateToItem(targetIndex: number, source: NavigationSource): void {
  const items = mediaItemsSig();
  if (items.length === 0) {
    return;
  }
  const clampedIndex = clampIndex(targetIndex, items.length);
  const current = currentIndexSig();
  const displayed = getDisplayedMediaIndex();

  if (__DEV__ && clampedIndex !== targetIndex) {
    logger.debug('gallery.navigate-clamped', {
      targetIndex,
      clampedIndex,
      itemCount: items.length,
    });
  }

  if (clampedIndex === current && clampedIndex === displayed) {
    return;
  }

  commitNavigation(clampedIndex, source);
}

/**
 * Resets all gallery signals to their initial state.
 * Called during cleanup to prevent stale state across sessions.
 */
export function disposeGallerySignals(): void {
  galleryIndexEvents.dispose();
  batch(() => {
    setSessionRevision((revision) => revision + 1);
    setErrorOwner(null);
    setRecoveryScope(null);
    setIsOpenSig(INITIAL_STATE.isOpen);
    setMediaItems(INITIAL_STATE.mediaItems);
    setCurrentIndex(INITIAL_STATE.currentIndex);
    _setFocusedIndex(null);
    setCurrentVideoElement(null);
    setNavIndex(null);
    setNavSource(INITIAL_NAV_SOURCE);
    setNavTimestamp(0);
  });

  _setDownloadStatus('idle');
  setBulkDownloadOutcome(null);
  setSingleDownloadOutcome(null);
}
