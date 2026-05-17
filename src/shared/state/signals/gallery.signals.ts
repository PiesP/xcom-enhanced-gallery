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
import type { NavigationSource } from '@shared/types/navigation.types';
import { createEventEmitter } from '@shared/utils/events/emitter';
import { clampIndex } from '@shared/utils/types/safety';
import { batch, createSignal } from 'solid-js';

export type GalleryNavigationTrigger = NavigationSource;

// ========================
// Navigation state (inlined from navigation.state.ts)
// ========================
const INITIAL_NAV_SOURCE: NavigationSource = 'auto-focus';

const [_navSource, setNavSource] = createSignal<NavigationSource>(INITIAL_NAV_SOURCE);
const [_navTimestamp, setNavTimestamp] = createSignal<number>(0);
const [_navIndex, setNavIndex] = createSignal<number | null>(null);

const isManualSource = (source: NavigationSource): boolean =>
  source === 'button' || source === 'keyboard';

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

export function resetNavigation(nowMs?: number): void {
  setNavSource(INITIAL_NAV_SOURCE);
  setNavTimestamp(nowMs ?? performance.now());
  setNavIndex(null);
}

export function resolveNavigationSource(trigger: NavigationSource): NavigationSource {
  if (trigger === 'scroll') return 'scroll';
  if (trigger === 'keyboard') return 'keyboard';
  return 'button';
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
  readonly trigger: GalleryNavigationTrigger;
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

const [isOpenSig, _setIsOpenInternal] = createSignal<boolean>(INITIAL_STATE.isOpen);
export function setIsOpen(value: boolean): void {
  _setIsOpenInternal(value);
}
const [mediaItemsSig, setMediaItems] = createSignal<readonly MediaInfo[]>(INITIAL_STATE.mediaItems);
const [currentIndexSig, setCurrentIndex] = createSignal<number>(INITIAL_STATE.currentIndex);
const [focusedIndexSig, setFocusedIndex] = createSignal<number | null>(null);
export const [currentVideoElementSig, setCurrentVideoElement] =
  createSignal<HTMLVideoElement | null>(null);

// UI state signals (inlined from ui.state.ts)
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

export function setError(error: string | null): void {
  _setErrorSig(error);
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

export const galleryState = {
  get value(): GalleryState {
    return {
      isOpen: isOpenSig(),
      mediaItems: mediaItemsSig(),
      currentIndex: currentIndexSig(),
      error: gallerySignals.error,
    };
  },

  set value(state: GalleryState) {
    applyGallerySessionUpdate({
      isOpen: state.isOpen,
      mediaItems: state.mediaItems,
      currentIndex: state.currentIndex,
      focusedIndex: state.currentIndex,
      currentVideoElement: null,
      error: state.error,
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

/** @internal Export for test use only */
export function setGalleryFocus(focusIndex: number | null, _source?: unknown): void {
  setFocusedIndex(focusIndex);
}