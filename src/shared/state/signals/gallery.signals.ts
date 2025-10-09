/**
 * @fileoverview Gallery State Management
 * @version 2.0.0 - Solid.js Signals
 *
 * Gallery state management using Solid.js signals
 * - Preact .value accessor 호환 유지
 * - Clear structure
 * - Type safety
 * - Immutable state
 */

import type { MediaInfo } from '../../types/media.types';
import { effectSafe, createSignalSafe } from './signal-factory-solid';
// Break runtime dependency on services: use logging barrel directly
import { logger as rootLogger, type Logger as ILogger } from '../../logging';
import { getSolid } from '../../external/vendors';

// Solid API
const { createMemo } = getSolid();

// Signal type
type Signal<T> = {
  value: T;
  subscribe?: (callback: (value: T) => void) => () => void;
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

// Logger instance (services-free)
const logger: ILogger = rootLogger;

function getGalleryStateSignal(): Signal<GalleryState> {
  if (!galleryStateSignal) {
    galleryStateSignal = createSignalSafe<GalleryState>(INITIAL_STATE);
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
    return effectSafe(() => {
      callback(getGalleryStateSignal().value);
    });
  },
};

/**
 * Phase 9.21.3: Derived signal - isOpen만 추적
 *
 * createMemo를 사용하여 galleryState.value.isOpen만 파생
 * - currentIndex 등 다른 속성 변경 시: createMemo 재실행되지만 결과값 동일 → 의존자 업데이트 안 함
 * - isOpen 변경 시에만 의존자(GalleryRenderer의 createEffect) 재실행
 * - Phase 9.21.2의 untrack() 패턴 실패 원인: untrack 내부 값은 반응성 없음
 */
export const isGalleryOpen = createMemo(() => galleryState.value.isOpen);

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
// Note: isGalleryOpen은 Phase 9.21.3에서 createMemo derived signal로 변경됨
export const getCurrentIndex = (): number => galleryState.value.currentIndex;
export const getMediaItems = (): readonly MediaInfo[] => galleryState.value.mediaItems;
export const isLoading = (): boolean => galleryState.value.isLoading;
export const getError = (): string | null => galleryState.value.error;
export const getViewMode = (): 'horizontal' | 'vertical' => galleryState.value.viewMode;
