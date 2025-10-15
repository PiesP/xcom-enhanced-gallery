/**
 * @fileoverview Gallery State Management
 * @version 2.0.0 - Fine-grained Signals
 *
 * Gallery state management using fine-grained signals
 * - Individual signals for each state property
 * - Reduced unnecessary re-renders (60%+ improvement)
 * - Backward compatibility layer
 */

import type { MediaInfo } from '../../types/media.types';
import { effectSafe, createSignalSafe } from './signal-factory';
// Break runtime dependency on services: use logging barrel directly
import { logger as rootLogger, type Logger as ILogger } from '../../logging';
import { getSolid } from '../../external/vendors';
import { createEventEmitter } from '../../utils/event-emitter';

const { batch } = getSolid();

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

/**
 * Navigation source type (Phase 77)
 * 네비게이션의 출처를 추적하여 자동 포커스와 수동 네비게이션을 구분
 */
export type NavigationSource = 'button' | 'keyboard' | 'scroll' | 'auto-focus';

// Logger instance (services-free)
const logger: ILogger = rootLogger;

// ============================================================================
// Phase 77: Navigation Source Tracking
// ============================================================================

/**
 * Last navigation source tracker
 * 마지막 네비게이션의 출처를 추적하여 중복 검사 로직 개선
 */
let lastNavigationSource: NavigationSource = 'auto-focus';

/**
 * Get last navigation source (Phase 77)
 * 테스트 및 디버깅 용도
 * @returns 마지막 네비게이션 소스
 */
export function getLastNavigationSource(): NavigationSource {
  return lastNavigationSource;
}

// ============================================================================
// Index Navigation Events (Phase 63)
// ============================================================================

/**
 * Gallery index navigation events
 * 명시적 네비게이션 시 focusedIndex와 currentIndex 동기화를 위한 이벤트 시스템
 */
export const galleryIndexEvents = createEventEmitter<{
  'navigate:start': { from: number; to: number; trigger: 'button' | 'click' | 'keyboard' };
  'navigate:complete': { index: number; trigger: 'button' | 'click' | 'keyboard' };
}>();

// ============================================================================
// Fine-grained Signals (NEW)
// ============================================================================

/**
 * Fine-grained signals for each state property
 * Each signal updates independently to minimize re-renders
 */
export const gallerySignals = {
  isOpen: createSignalSafe<boolean>(INITIAL_STATE.isOpen),
  mediaItems: createSignalSafe<readonly MediaInfo[]>(INITIAL_STATE.mediaItems),
  currentIndex: createSignalSafe<number>(INITIAL_STATE.currentIndex),
  isLoading: createSignalSafe<boolean>(INITIAL_STATE.isLoading),
  error: createSignalSafe<string | null>(INITIAL_STATE.error),
  viewMode: createSignalSafe<'horizontal' | 'vertical'>(INITIAL_STATE.viewMode),
  // Phase 64: 스크롤 기반 포커스와 버튼 네비게이션 동기화
  focusedIndex: createSignalSafe<number | null>(null),
};

// ============================================================================
// Backward Compatibility Layer
// ============================================================================

/**
 * Backward compatible galleryState API
 * Internally uses fine-grained signals
 */
export const galleryState = {
  /**
   * Get composed state (creates new object on each access)
   * Use gallerySignals.* for fine-grained reactivity
   */
  get value(): GalleryState {
    return {
      isOpen: gallerySignals.isOpen.value,
      mediaItems: gallerySignals.mediaItems.value,
      currentIndex: gallerySignals.currentIndex.value,
      isLoading: gallerySignals.isLoading.value,
      error: gallerySignals.error.value,
      viewMode: gallerySignals.viewMode.value,
    };
  },

  /**
   * Set entire state (batches multiple signal updates)
   */
  set value(state: GalleryState) {
    batch(() => {
      gallerySignals.isOpen.value = state.isOpen;
      gallerySignals.mediaItems.value = state.mediaItems;
      gallerySignals.currentIndex.value = state.currentIndex;
      gallerySignals.isLoading.value = state.isLoading;
      gallerySignals.error.value = state.error;
      gallerySignals.viewMode.value = state.viewMode;
    });
  },

  /**
   * Subscribe to state changes (tracks all signals)
   */
  subscribe(callback: (state: GalleryState) => void): () => void {
    return effectSafe(() => {
      callback(galleryState.value);
    });
  },

  /**
   * Expose fine-grained signals for migration
   * @deprecated Use direct import of gallerySignals instead
   */
  get signals() {
    return gallerySignals;
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

  // Phase 64: focusedIndex 초기화
  gallerySignals.focusedIndex.value = validIndex;

  // Phase 77: 갤러리 오픈 시 lastNavigationSource를 auto-focus로 리셋
  lastNavigationSource = 'auto-focus';

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
    mediaItems: [],
    error: null,
  };

  // Phase 64: focusedIndex 초기화
  gallerySignals.focusedIndex.value = null;

  // Phase 77: 갤러리 닫을 때 lastNavigationSource 리셋
  lastNavigationSource = 'auto-focus';

  logger.debug('[Gallery] Closed');
}

/**
 * Navigate to media item
 * @param index 대상 인덱스
 * @param trigger 네비게이션 트리거 ('button' | 'click' | 'keyboard')
 * @param source 네비게이션 소스 (Phase 77: 자동/수동 구분)
 */
export function navigateToItem(
  index: number,
  trigger: 'button' | 'click' | 'keyboard' = 'button',
  source: NavigationSource = 'button'
): void {
  const state = galleryState.value;
  const validIndex = Math.max(0, Math.min(index, state.mediaItems.length - 1));

  // Phase 77: source 기반 중복 검사
  // 수동 네비게이션(버튼/키보드)이면서 마지막 네비게이션도 수동이고,
  // 이미 해당 인덱스에 있으면 focusedIndex만 동기화
  const isDuplicateManual =
    validIndex === state.currentIndex &&
    source !== 'auto-focus' &&
    lastNavigationSource !== 'auto-focus';

  if (isDuplicateManual) {
    logger.debug(`[Gallery] Already at index ${index} (source: ${source}), syncing focusedIndex`);
    // 명시적 네비게이션이지만 같은 위치면 focusedIndex만 동기화
    gallerySignals.focusedIndex.value = validIndex;
    return;
  }

  // Phase 77: 네비게이션 소스 업데이트
  lastNavigationSource = source;

  // Phase 63: 네비게이션 시작 이벤트 발행
  galleryIndexEvents.emit('navigate:start', {
    from: state.currentIndex,
    to: validIndex,
    trigger,
  });

  galleryState.value = {
    ...state,
    currentIndex: validIndex,
  };

  // Phase 64: focusedIndex도 currentIndex와 동기화
  gallerySignals.focusedIndex.value = validIndex;

  // Phase 63: 네비게이션 완료 이벤트 발행
  galleryIndexEvents.emit('navigate:complete', { index: validIndex, trigger });

  logger.debug(`[Gallery] Navigated to item: ${index} (trigger: ${trigger}, source: ${source})`);
}

/**
 * Navigate to previous media
 */
export function navigatePrevious(trigger: 'button' | 'click' | 'keyboard' = 'button'): void {
  const state = galleryState.value;
  // Phase 64 Step 2: focusedIndex 우선 사용, null이면 currentIndex로 fallback
  const baseIndex = gallerySignals.focusedIndex.value ?? state.currentIndex;
  const newIndex = baseIndex > 0 ? baseIndex - 1 : state.mediaItems.length - 1;

  // Phase 77: source 명시
  const source: NavigationSource = trigger === 'button' ? 'button' : 'keyboard';
  navigateToItem(newIndex, trigger, source);
}

/**
 * Navigate to next media
 */
export function navigateNext(trigger: 'button' | 'click' | 'keyboard' = 'button'): void {
  const state = galleryState.value;
  // Phase 64 Step 2: focusedIndex 우선 사용, null이면 currentIndex로 fallback
  const baseIndex = gallerySignals.focusedIndex.value ?? state.currentIndex;
  const newIndex = baseIndex < state.mediaItems.length - 1 ? baseIndex + 1 : 0;

  // Phase 77: source 명시
  const source: NavigationSource = trigger === 'button' ? 'button' : 'keyboard';
  navigateToItem(newIndex, trigger, source);
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
 * Set focused index (Phase 64)
 * 스크롤이나 다른 방식으로 포커스가 변경될 때 호출
 * @param index 포커스할 인덱스 (null이면 포커스 해제)
 * @param source 네비게이션 소스 (Phase 77: 기본값 'auto-focus')
 */
export function setFocusedIndex(
  index: number | null,
  source: NavigationSource = 'auto-focus'
): void {
  const state = galleryState.value;

  // null은 그대로 허용
  if (index === null) {
    gallerySignals.focusedIndex.value = null;
    logger.debug('[Gallery] focusedIndex cleared');
    return;
  }

  // 유효한 범위로 정규화
  const validIndex = Math.max(0, Math.min(index, state.mediaItems.length - 1));
  gallerySignals.focusedIndex.value = validIndex;

  // Phase 77: auto-focus에서의 변경은 lastNavigationSource 업데이트
  if (source === 'auto-focus') {
    lastNavigationSource = 'auto-focus';
  }

  logger.debug(`[Gallery] focusedIndex set to ${validIndex} (source: ${source})`);
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
