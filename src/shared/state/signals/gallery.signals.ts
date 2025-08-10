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
import { BrowserService } from '@shared/browser';

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
  try {
    BrowserService.scroll.save();
  } catch {
    // 비DOM 환경 보호
  }

  // 갤러리 오픈 시 재생 중인 모든 비디오 일시정지 (PC 전용 환경 가정)
  try {
    const collected: HTMLVideoElement[] = [];

    // 1) 표준 querySelectorAll → 배열로 안전 변환
    try {
      const nodeList = document.querySelectorAll('video');
      const arr = Array.from ? Array.from(nodeList) : Array.prototype.slice.call(nodeList);
      for (const el of arr) {
        if (el && el.tagName === 'VIDEO') {
          collected.push(el as HTMLVideoElement);
        }
      }
    } catch {
      // ignore
    }

    // 2) getElementsByTagName 보조
    try {
      const byTag = document.getElementsByTagName?.('video');
      if (byTag && typeof byTag.length === 'number') {
        for (let i = 0; i < byTag.length; i++) collected.push(byTag[i] as HTMLVideoElement);
      }
    } catch {
      // ignore
    }

    // 3) 구조 순회 폴백 (최후의 보루)
    try {
      const docAny: unknown = document;
      const root =
        (docAny as { body?: unknown; documentElement?: unknown }).body ||
        (docAny as { body?: unknown; documentElement?: unknown }).documentElement;
      const visit = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        const n = node as { tagName?: string; nodeName?: string; children?: unknown };
        const tn = (n.tagName || n.nodeName || '') as string;
        if (tn && tn.toUpperCase() === 'VIDEO') collected.push(node as HTMLVideoElement);
        const kids = n.children as unknown as { length?: number; [index: number]: unknown };
        const len = kids && typeof kids.length === 'number' ? kids.length : 0;
        for (let i = 0; i < len; i++) visit((kids as { [index: number]: unknown })[i]);
      };
      visit(root as unknown);
    } catch {
      // ignore
    }

    // 중복 제거
    const unique = Array.from(new Set(collected));
    for (const videoEl of unique) {
      try {
        // paused 속성이 없으면 일단 호출 시도
        const vUnknown: unknown = videoEl as unknown;
        const pausedProp = (vUnknown as { paused?: boolean }).paused;
        const isPaused = typeof pausedProp === 'boolean' ? pausedProp : false;
        if (!isPaused) {
          // pause가 존재하면 호출
          const maybePause = (vUnknown as { pause?: () => void }).pause;
          if (typeof maybePause === 'function') maybePause();
        }
      } catch {
        /* ignore 개별 비디오 오류 */
      }
    }
  } catch {
    // DOM 접근 실패는 무시 (비브라우저/테스트 환경 안전성)
  }

  // 배경 페이지 스크롤 방지
  try {
    const hasBodyAndStyle: boolean =
      typeof document !== 'undefined' && !!document.body && !!document.body.style;
    if (hasBodyAndStyle) {
      document.body.style.overflow = 'hidden';
    }
  } catch {
    // 테스트 환경에서 body/style이 없는 경우를 보호
  }

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
  try {
    const hasBodyAndStyle: boolean =
      typeof document !== 'undefined' && !!document.body && !!document.body.style;
    if (hasBodyAndStyle) {
      document.body.style.overflow = '';
    }
  } catch {
    // 비DOM 환경 보호
  }

  // 저장된 스크롤 위치로 복원
  try {
    BrowserService.scroll.restore();
  } catch {
    // 비DOM 환경 보호
  }

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
