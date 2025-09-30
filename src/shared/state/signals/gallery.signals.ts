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
 */
export function navigateToItem(index: number): void {
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

  logger.debug(`[Gallery] Navigated to item: ${index}`);
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

/**
 * Get current media item (memoized)
 */
export const getCurrentMediaItem = createMemo((): MediaInfo | null => {
  const state = galleryState();
  return state.mediaItems[state.currentIndex] || null;
});

/**
 * Check if gallery has media items (memoized)
 */
export const hasMediaItems = createMemo((): boolean => {
  return galleryState().mediaItems.length > 0;
});

/**
 * Get media items count (memoized)
 */
export const getMediaItemsCount = createMemo((): number => {
  return galleryState().mediaItems.length;
});

/**
 * Check if previous media exists (memoized)
 */
export const hasPreviousMedia = createMemo((): boolean => {
  const state = galleryState();
  return state.mediaItems.length > 1;
});

/**
 * Check if next media exists (memoized)
 */
export const hasNextMedia = createMemo((): boolean => {
  const state = galleryState();
  return state.mediaItems.length > 1;
});

// State Accessor Functions (memoized)
export const isGalleryOpen = createMemo((): boolean => galleryState().isOpen);
export const getCurrentIndex = createMemo((): number => galleryState().currentIndex);
export const getMediaItems = createMemo((): readonly MediaInfo[] => galleryState().mediaItems);
export const isLoading = createMemo((): boolean => galleryState().isLoading);
export const getError = createMemo((): string | null => galleryState().error);
export const getViewMode = createMemo((): 'horizontal' | 'vertical' => galleryState().viewMode);
