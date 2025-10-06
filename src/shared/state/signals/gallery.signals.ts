/**
 * @fileoverview Gallery State Management
 * @version 2.0.0 - SolidJS Native Pattern
 *
 * Gallery state management using native SolidJS signals
 * - Native createSignal pattern (no legacy wrapper)
 * - Direct Accessor/Setter export
 * - Type safety with strict mode
 * - Immutable state updates
 */

import type { MediaInfo } from '@shared/types/media.types';
// 글로벌 테스트 폴백 타입 선언 (window 확장)
// 전역 객체 확장 인터페이스 (브라우저/노드 겸용 최소 타입)
type XegGlobal = {
  __XEG_GALLERY_STATE?: { isOpen: boolean };
} & Record<string, unknown>;
import { defaultLogger, type ILogger } from '@shared/services/core-services';
import { registerGallerySignalAccess } from '../mediators/gallery-signal-mediator';
import { getSolidCore } from '@shared/external/vendors';

const { createSignal, createMemo } = getSolidCore();

/**
 * Gallery state interface
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly viewMode: 'horizontal' | 'vertical';
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

// Native SolidJS signal (no wrapper)
const [galleryStateSignal, setGalleryStateSignal] = createSignal<GalleryState>(INITIAL_STATE);

// Export native Accessor/Setter
export const galleryState = galleryStateSignal;
export const setGalleryState = setGalleryStateSignal;

// Logger instance (default fallback)
const logger: ILogger = defaultLogger;

registerGallerySignalAccess(() => ({
  isOpen: () => galleryState().isOpen,
  currentIndex: () => galleryState().currentIndex,
}));

// Action Functions
// =============================================================================

/**
 * Open gallery with media items
 */
export function openGallery(items: readonly MediaInfo[], startIndex = 0): void {
  const validIndex = Math.max(0, Math.min(startIndex, items.length - 1));

  setGalleryState({
    ...galleryState(),
    isOpen: true,
    mediaItems: items,
    currentIndex: validIndex,
    error: null,
  });

  logger.debug(`[Gallery] Opened with ${items.length} items, starting at index ${validIndex}`);
  // 테스트 환경(비반응 mock signals)용 폴백 글로벌 플래그
  try {
    const g = globalThis as XegGlobal;
    g.__XEG_GALLERY_STATE = { ...(g.__XEG_GALLERY_STATE || { isOpen: false }), isOpen: true };
  } catch {
    /* noop */
  }
}

/**
 * Close gallery
 */
export function closeGallery(): void {
  setGalleryState({
    ...galleryState(),
    isOpen: false,
    currentIndex: 0,
    error: null,
  });

  logger.debug('[Gallery] 갤러리 종료 완료');
  try {
    const g = globalThis as XegGlobal;
    g.__XEG_GALLERY_STATE = { ...(g.__XEG_GALLERY_STATE || { isOpen: false }), isOpen: false };
  } catch {
    /* noop */
  }
}

/**
 * Navigate to media item
 * @param index - Target index
 * @param options - Navigation options
 * @param options.skipScroll - If true, update currentIndex without triggering scroll (default: false)
 */
export function navigateToItem(index: number, options?: { skipScroll?: boolean }): void {
  const state = galleryState();
  const validIndex = Math.max(0, Math.min(index, state.mediaItems.length - 1));

  if (validIndex === state.currentIndex) {
    logger.warn(`[Gallery] Already at index ${index}`);
    return;
  }

  setGalleryState({
    ...state,
    currentIndex: validIndex,
  });

  logger.debug(
    `[Gallery] Navigated to item: ${index}${options?.skipScroll ? ' (skipScroll)' : ''}`
  );
}

/**
 * Navigate to previous media
 */
export function navigatePrevious(): void {
  const state = galleryState();
  const newIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.mediaItems.length - 1;
  navigateToItem(newIndex);
}

/**
 * Navigate to next media
 */
export function navigateNext(): void {
  const state = galleryState();
  const newIndex = state.currentIndex < state.mediaItems.length - 1 ? state.currentIndex + 1 : 0;
  navigateToItem(newIndex);
}

/**
 * Set loading state
 */
export function setLoading(isLoading: boolean): void {
  setGalleryState({
    ...galleryState(),
    isLoading,
  });
}

/**
 * Set error state
 */
export function setError(error: string | null): void {
  setGalleryState({
    ...galleryState(),
    error,
    isLoading: false,
  });

  if (error) {
    logger.error(`[Gallery] Error: ${error}`);
  }
}

/**
 * Set view mode
 */
export function setViewMode(viewMode: 'horizontal' | 'vertical'): void {
  setGalleryState({
    ...galleryState(),
    viewMode,
  });

  logger.debug(`[Gallery] View mode changed to: ${viewMode}`);
}

// Utility Functions
// =============================================================================

// Disposer for derived state cleanup
let _derivedStateDisposer: (() => void) | undefined;

// Derived state accessors (initialized in createRoot)
let _getCurrentMediaItem: (() => MediaInfo | null) | undefined;
let _hasMediaItems: (() => boolean) | undefined;
let _getMediaItemsCount: (() => number) | undefined;
let _hasPreviousMedia: (() => boolean) | undefined;
let _hasNextMedia: (() => boolean) | undefined;
let _isGalleryOpen: (() => boolean) | undefined;
let _getCurrentIndex: (() => number) | undefined;
let _getMediaItems: (() => readonly MediaInfo[]) | undefined;
let _isLoading: (() => boolean) | undefined;
let _getError: (() => string | null) | undefined;
let _getViewMode: (() => 'horizontal' | 'vertical') | undefined;

/**
 * Initialize gallery derived state with createRoot wrapper
 * @description Prevents memory leaks by wrapping createMemo in createRoot
 */
export function initializeGalleryDerivedState(): void {
  if (_derivedStateDisposer) {
    return; // Already initialized
  }

  _derivedStateDisposer = getSolidCore().createRoot(dispose => {
    // Create all memos inside createRoot context
    _getCurrentMediaItem = createMemo((): MediaInfo | null => {
      const state = galleryState();
      return state.mediaItems[state.currentIndex] || null;
    });

    _hasMediaItems = createMemo((): boolean => {
      return galleryState().mediaItems.length > 0;
    });

    _getMediaItemsCount = createMemo((): number => {
      return galleryState().mediaItems.length;
    });

    _hasPreviousMedia = createMemo((): boolean => {
      const state = galleryState();
      return state.mediaItems.length > 1;
    });

    _hasNextMedia = createMemo((): boolean => {
      const state = galleryState();
      return state.mediaItems.length > 1;
    });

    _isGalleryOpen = createMemo((): boolean => galleryState().isOpen);
    _getCurrentIndex = createMemo((): number => galleryState().currentIndex);
    _getMediaItems = createMemo((): readonly MediaInfo[] => galleryState().mediaItems);
    _isLoading = createMemo((): boolean => galleryState().isLoading);
    _getError = createMemo((): string | null => galleryState().error);
    _getViewMode = createMemo((): 'horizontal' | 'vertical' => galleryState().viewMode);

    return dispose;
  });
}

/**
 * Dispose gallery derived state
 * @description Clean up all memos and allow reinitialization
 */
export function disposeGalleryDerivedState(): void {
  if (_derivedStateDisposer) {
    _derivedStateDisposer();
    _derivedStateDisposer = undefined;

    // Clear memo references
    _getCurrentMediaItem = undefined;
    _hasMediaItems = undefined;
    _getMediaItemsCount = undefined;
    _hasPreviousMedia = undefined;
    _hasNextMedia = undefined;
    _isGalleryOpen = undefined;
    _getCurrentIndex = undefined;
    _getMediaItems = undefined;
    _isLoading = undefined;
    _getError = undefined;
    _getViewMode = undefined;
  }
}

/**
 * Get current media item (memoized)
 * @throws {Error} If derived state not initialized
 */
export const getCurrentMediaItem = (): MediaInfo | null => {
  if (!_getCurrentMediaItem) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _getCurrentMediaItem();
};

/**
 * Check if gallery has media items (memoized)
 * @throws {Error} If derived state not initialized
 */
export const hasMediaItems = (): boolean => {
  if (!_hasMediaItems) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _hasMediaItems();
};

/**
 * Get media items count (memoized)
 * @throws {Error} If derived state not initialized
 */
export const getMediaItemsCount = (): number => {
  if (!_getMediaItemsCount) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _getMediaItemsCount();
};

/**
 * Check if previous media exists (memoized)
 * @throws {Error} If derived state not initialized
 */
export const hasPreviousMedia = (): boolean => {
  if (!_hasPreviousMedia) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _hasPreviousMedia();
};

/**
 * Check if next media exists (memoized)
 * @throws {Error} If derived state not initialized
 */
export const hasNextMedia = (): boolean => {
  if (!_hasNextMedia) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _hasNextMedia();
};

// State Accessor Functions (memoized)
export const isGalleryOpen = (): boolean => {
  if (!_isGalleryOpen) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _isGalleryOpen();
};

export const getCurrentIndex = (): number => {
  if (!_getCurrentIndex) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _getCurrentIndex();
};

export const getMediaItems = (): readonly MediaInfo[] => {
  if (!_getMediaItems) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _getMediaItems();
};

export const isLoading = (): boolean => {
  if (!_isLoading) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _isLoading();
};

export const getError = (): string | null => {
  if (!_getError) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _getError();
};

export const getViewMode = (): 'horizontal' | 'vertical' => {
  if (!_getViewMode) {
    throw new Error(
      'Gallery derived state not initialized. Call initializeGalleryDerivedState() first.'
    );
  }
  return _getViewMode();
};
