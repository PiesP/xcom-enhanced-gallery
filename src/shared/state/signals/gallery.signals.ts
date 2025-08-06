/**
 * @fileoverview Gallery State Management
 * @version 1.0.0 - Clean Architecture
 *
 * Gallery state management using Preact signals
 * - Clear structure
 * - Type safety
 * - Immutable state
 */

import type { MediaInfo } from '@shared/types/media.types';
import { getPreactSignals } from '@shared/external/vendors';
import { defaultLogger, type ILogger } from '@shared/services/core-services';
import { saveScrollPosition, restoreScrollPosition } from '@shared/browser/utils/browser-utils';

// Signal type
type Signal<T> = {
  value: T;
  subscribe?: (callback: (value: T) => void) => void;
};

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

// Preact Signals lazy initialization
let galleryStateSignal: Signal<GalleryState> | null = null;

// Logger instance - 안전한 접근
const logger: ILogger = defaultLogger;

function getGalleryStateSignal(): Signal<GalleryState> {
  if (!galleryStateSignal) {
    try {
      const signals = getPreactSignals();
      galleryStateSignal = signals.signal(INITIAL_STATE);
    } catch {
      // Fallback to simple state management if signals are not available
      logger.warn('[Gallery] Preact signals not available, using fallback state');
      galleryStateSignal = {
        value: INITIAL_STATE,
        subscribe: () => () => {}, // no-op unsubscribe
      };
    }
  }
  return galleryStateSignal;
}

/**
 * Gallery state access
 */
export const galleryState = {
  get value(): GalleryState {
    return getGalleryStateSignal().value;
  },

  set value(newState: GalleryState) {
    getGalleryStateSignal().value = newState;
  },

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: GalleryState) => void): () => void {
    const { effect } = getPreactSignals();
    return effect(() => {
      callback(getGalleryStateSignal().value);
    });
  },
};

// Action Functions
// =============================================================================

/**
 * Open gallery with media items
 */
export function openGallery(items: readonly MediaInfo[], startIndex = 0): void {
  const validIndex = Math.max(0, Math.min(startIndex, items.length - 1));

  // 현재 스크롤 위치 저장
  saveScrollPosition();

  // 배경 페이지 스크롤 방지
  document.body.style.overflow = 'hidden';

  galleryState.value = {
    ...galleryState.value,
    isOpen: true,
    mediaItems: items,
    currentIndex: validIndex,
    error: null,
  };

  logger.debug(`[Gallery] Opened with ${items.length} items, starting at index ${validIndex}`);
}

/**
 * Close gallery
 */
export function closeGallery(): void {
  const currentState = galleryState.value;

  // 이미 닫혀있으면 중복 실행 방지
  if (!currentState.isOpen) {
    logger.debug('[Gallery] 이미 닫힌 상태 - 건너뜀');
    return;
  }

  // 배경 페이지 스크롤 복원
  document.body.style.overflow = '';

  // 저장된 스크롤 위치로 복원
  restoreScrollPosition();

  // 상태 완전 초기화 - mediaItems도 함께 초기화
  galleryState.value = {
    ...currentState,
    isOpen: false,
    mediaItems: [], // 🔑 핵심: mediaItems 초기화로 상태 동기화 보장
    currentIndex: 0,
    error: null,
  };

  logger.debug('[Gallery] 갤러리 종료 및 상태 완전 초기화 완료');
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
  if (!state.mediaItems || state.mediaItems.length === 0) return;

  const newIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.mediaItems.length - 1;
  navigateToItem(newIndex);
}

/**
 * Navigate to next media
 */
export function navigateNext(): void {
  const state = galleryState.value;
  if (!state.mediaItems || state.mediaItems.length === 0) return;

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
