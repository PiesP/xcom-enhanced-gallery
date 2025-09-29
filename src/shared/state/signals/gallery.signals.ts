/**
 * @fileoverview Gallery State Management
 * @version 1.0.0 - Clean Architecture
 *
 * Gallery state management using Solid signals
 * - Clear structure
 * - Type safety
 * - Immutable state
 */

import type { MediaInfo } from '@shared/types/media.types';
// 글로벌 테스트 폴백 타입 선언 (window 확장)
// 전역 객체 확장 인터페이스 (브라우저/노드 겸용 최소 타입)
type XegGlobal = {
  __XEG_GALLERY_STATE?: { isOpen: boolean };
} & Record<string, unknown>;
import { defaultLogger, type ILogger } from '@shared/services/core-services';
import { registerGallerySignalAccess } from '../mediators/gallery-signal-mediator';
import { createGlobalSignal } from '../createGlobalSignal';

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

const signal = createGlobalSignal<GalleryState>(INITIAL_STATE);

// Logger instance (default fallback)
const logger: ILogger = defaultLogger;

registerGallerySignalAccess(() => ({
  isOpen: () => signal.peek().isOpen,
  currentIndex: () => signal.peek().currentIndex,
}));

/**
 * Gallery state access
 */
export const galleryState = {
  get value(): GalleryState {
    return signal.value;
  },

  set value(newState: GalleryState) {
    signal.value = newState;
  },

  subscribe(callback: (state: GalleryState) => void): () => void {
    return signal.subscribe(callback);
  },

  update(updater: (previous: GalleryState) => GalleryState): void {
    signal.update(updater);
  },

  accessor: signal.accessor,

  peek(): GalleryState {
    return signal.peek();
  },
};

// Action Functions
// =============================================================================

/**
 * Open gallery with media items
 */
export function openGallery(items: readonly MediaInfo[], startIndex = 0): void {
  const validIndex = Math.max(0, Math.min(startIndex, items.length - 1));

  galleryState.value = {
    ...galleryState.value,
    isOpen: true,
    mediaItems: items,
    currentIndex: validIndex,
    error: null,
  };

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
  galleryState.value = {
    ...galleryState.value,
    isOpen: false,
    currentIndex: 0,
    error: null,
  };

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
  const state = galleryState.value;
  const validIndex = Math.max(0, Math.min(index, state.mediaItems.length - 1));

  if (validIndex === state.currentIndex) {
    logger.warn(`[Gallery] Already at index ${index}`);
    return;
  }

  galleryState.value = {
    ...state,
    currentIndex: validIndex,
  };

  logger.debug(`[Gallery] Navigated to item: ${index}`);
}

/**
 * Navigate to previous media
 */
export function navigatePrevious(): void {
  const state = galleryState.value;
  const newIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.mediaItems.length - 1;
  navigateToItem(newIndex);
}

/**
 * Navigate to next media
 */
export function navigateNext(): void {
  const state = galleryState.value;
  const newIndex = state.currentIndex < state.mediaItems.length - 1 ? state.currentIndex + 1 : 0;
  navigateToItem(newIndex);
}

/**
 * Set loading state
 */
export function setLoading(isLoading: boolean): void {
  galleryState.value = {
    ...galleryState.value,
    isLoading,
  };
}

/**
 * Set error state
 */
export function setError(error: string | null): void {
  galleryState.value = {
    ...galleryState.value,
    error,
    isLoading: false,
  };

  if (error) {
    logger.error(`[Gallery] Error: ${error}`);
  }
}

/**
 * Set view mode
 */
export function setViewMode(viewMode: 'horizontal' | 'vertical'): void {
  galleryState.value = {
    ...galleryState.value,
    viewMode,
  };

  logger.debug(`[Gallery] View mode changed to: ${viewMode}`);
}

// Utility Functions
// =============================================================================

/**
 * Get current media item
 */
export function getCurrentMediaItem(): MediaInfo | null {
  const state = galleryState.value;
  return state.mediaItems[state.currentIndex] || null;
}

/**
 * Check if gallery has media items
 */
export function hasMediaItems(): boolean {
  return galleryState.value.mediaItems.length > 0;
}

/**
 * Get media items count
 */
export function getMediaItemsCount(): number {
  return galleryState.value.mediaItems.length;
}

/**
 * Check if previous media exists
 */
export function hasPreviousMedia(): boolean {
  const state = galleryState.value;
  return state.mediaItems.length > 1;
}

/**
 * Check if next media exists
 */
export function hasNextMedia(): boolean {
  const state = galleryState.value;
  return state.mediaItems.length > 1;
}

// State Accessor Functions
export const isGalleryOpen = (): boolean => galleryState.value.isOpen;
export const getCurrentIndex = (): number => galleryState.value.currentIndex;
export const getMediaItems = (): readonly MediaInfo[] => galleryState.value.mediaItems;
export const isLoading = (): boolean => galleryState.value.isLoading;
export const getError = (): string | null => galleryState.value.error;
export const getViewMode = (): 'horizontal' | 'vertical' => galleryState.value.viewMode;
