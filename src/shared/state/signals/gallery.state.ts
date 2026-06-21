// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Gallery state — central reactive state management for the gallery feature.
 *
 * Provides fine-grained signals for gallery open/close, media items,
 * current index, focused index, and video element tracking.
 *
 * State transitions are committed through `applyGallerySessionUpdate`
 * so subscribers observe a complete snapshot.
 */

import type { MediaInfo } from '@shared/types/media.types';
import { createEventEmitter } from '@shared/utils/events/emitter';
import { clampIndex } from '@shared/utils/types/safety';
import { createSignal } from 'solid-js';
import { setDownloading } from './download.state';
import {
  type NavigationSource,
  recordNavigation,
  resetNavigation,
  resolveNavigationSource,
} from './navigation.state';

// ─── Event emitter ──────────────────────────────────────────────────────────

export interface GalleryNavigateCompletePayload {
  readonly index: number;
  readonly trigger: NavigationSource;
}

export const galleryIndexEvents = createEventEmitter<{
  'navigate:complete': GalleryNavigateCompletePayload;
}>();

// ─── State interfaces ───────────────────────────────────────────────────────

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

// ─── Signals ────────────────────────────────────────────────────────────────

const INITIAL_STATE: GalleryState = {
  isOpen: false,
  mediaItems: [],
  currentIndex: 0,
  error: null,
};

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

// ─── Proxy object ───────────────────────────────────────────────────────────

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

// ─── State mutations ────────────────────────────────────────────────────────

export function setError(error: string | null): void {
  _setErrorSig(error);
}

function applyGallerySessionUpdate(state: GallerySessionState): void {
  setMediaItems(state.mediaItems);
  setCurrentIndex(state.currentIndex);
  setFocusedIndex(state.focusedIndex);
  setCurrentVideoElement(state.currentVideoElement);
  _setErrorSig(state.error);
  setIsOpen(state.isOpen);
}

/**
 * Opens the gallery with the given media items.
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
}

/**
 * Closes the gallery and resets all session state.
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
}

/**
 * Navigates to the next item in the gallery.
 */
export function navigateNext(trigger: NavigationSource = 'click'): void {
  const items = mediaItemsSig();
  const current = currentIndexSig();
  if (items.length <= 1) return;

  const next = current + 1;
  if (next >= items.length) return;

  setCurrentIndex(next);
  setFocusedIndex(next);
  recordNavigation(next, resolveNavigationSource(trigger));
  galleryIndexEvents.emit('navigate:complete', { index: next, trigger });
}

/**
 * Navigates to the previous item in the gallery.
 */
export function navigatePrevious(trigger: NavigationSource = 'click'): void {
  const items = mediaItemsSig();
  const current = currentIndexSig();
  if (items.length <= 1) return;

  const prev = current - 1;
  if (prev < 0) return;

  setCurrentIndex(prev);
  setFocusedIndex(prev);
  recordNavigation(prev, resolveNavigationSource(trigger));
  galleryIndexEvents.emit('navigate:complete', { index: prev, trigger });
}

/**
 * Navigates directly to a specific item index.
 */
export function navigateToItem(targetIndex: number, source: NavigationSource): void {
  const items = mediaItemsSig();
  const clampedIndex = clampIndex(targetIndex, items.length);
  const current = currentIndexSig();

  if (clampedIndex === current) return;

  setCurrentIndex(clampedIndex);
  setFocusedIndex(clampedIndex);

  recordNavigation(clampedIndex, source);
  galleryIndexEvents.emit('navigate:complete', { index: clampedIndex, trigger: source });
}

/** @internal */
export function setGalleryFocus(focusIndex: number | null, _source?: unknown): void {
  setFocusedIndex(focusIndex);
}

/**
 * Resets all gallery signals to their initial state.
 * Called during cleanup to prevent stale state across sessions.
 */
export function disposeGallerySignals(): void {
  setIsOpenSig(INITIAL_STATE.isOpen);
  setMediaItems(INITIAL_STATE.mediaItems);
  setCurrentIndex(INITIAL_STATE.currentIndex);
  setFocusedIndex(null);
  setCurrentVideoElement(null);
  _setErrorSig(INITIAL_STATE.error);
  setDownloading(false);
  resetNavigation();
}
