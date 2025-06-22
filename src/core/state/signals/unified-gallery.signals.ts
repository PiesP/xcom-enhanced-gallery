/**
 * @fileoverview Unified Gallery State Management
 * @version 1.0.0 - Clean Architecture 적용
 *
 * 단일 책임 원칙에 따라 갤러리 상태를 통합 관리
 * - 명확한 상태 구조
 * - 타입 안전성 보장
 * - 간결한 액션 함수
 */

import type { MediaInfo } from '../../types/media.types';
import { getPreactSignals } from '../../../infrastructure/external/vendors';
import { defaultLogger, type ILogger } from '../../services/logger.interface';

// Signal 타입 정의
type Signal<T> = {
  value: T;
  subscribe?: (callback: (value: T) => void) => () => void;
};

/**
 * 갤러리 상태 인터페이스
 */
export interface UnifiedGalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly viewMode: 'horizontal' | 'vertical';
}

/**
 * 초기 상태
 */
const INITIAL_STATE: UnifiedGalleryState = {
  isOpen: false,
  mediaItems: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  viewMode: 'vertical',
};

/**
 * 갤러리 이벤트 타입
 */
export type GalleryEvents = {
  'gallery:open': { items: readonly MediaInfo[]; startIndex: number };
  'gallery:close': Record<string, never>;
  'gallery:navigate': { index: number };
  'gallery:error': { error: string };
};

// Preact Signals 지연 초기화
let galleryStateSignal: { value: UnifiedGalleryState } | null = null;

// 로거 인스턴스 (의존성 주입 가능)
const logger: ILogger = defaultLogger;

function getGalleryStateSignal(): Signal<UnifiedGalleryState> {
  if (!galleryStateSignal) {
    const { signal } = getPreactSignals();
    galleryStateSignal = signal<UnifiedGalleryState>(INITIAL_STATE);
  }
  return galleryStateSignal;
}

/**
 * 갤러리 상태 접근자
 */
export const galleryState = {
  get value(): UnifiedGalleryState {
    return getGalleryStateSignal().value;
  },

  set value(newState: UnifiedGalleryState) {
    getGalleryStateSignal().value = newState;
  },

  /**
   * 상태 변경 구독
   */
  subscribe(callback: (state: UnifiedGalleryState) => void): () => void {
    const { effect } = getPreactSignals();
    return effect(() => {
      callback(this.value);
    });
  },
};

/**
 * 이벤트 디스패처
 */
function dispatchEvent<K extends keyof GalleryEvents>(event: K, data: GalleryEvents[K]): void {
  const customEvent = new CustomEvent(`xeg:${event}`, {
    detail: { ...data, timestamp: Date.now() },
  });
  document.dispatchEvent(customEvent);
  logger.debug(`[Gallery] ${event} 이벤트 발생`, data);
}

// =============================================================================
// 액션 함수들
// =============================================================================

/**
 * 갤러리 열기
 */
export function openGallery(items: readonly MediaInfo[], startIndex = 0): void {
  if (!items.length) {
    logger.warn('[Gallery] 표시할 미디어가 없음');
    return;
  }

  const validIndex = Math.max(0, Math.min(startIndex, items.length - 1));

  galleryState.value = {
    ...INITIAL_STATE,
    isOpen: true,
    mediaItems: items,
    currentIndex: validIndex,
  };

  logger.info(`[Gallery] 갤러리 열림 - ${items.length}개 미디어, 인덱스: ${validIndex}`);
  dispatchEvent('gallery:open', { items, startIndex: validIndex });
}

/**
 * 갤러리 닫기
 */
export function closeGallery(): void {
  if (!galleryState.value.isOpen) return;

  galleryState.value = INITIAL_STATE;

  logger.info('[Gallery] 갤러리 닫힘');
  dispatchEvent('gallery:close', {});
}

/**
 * 미디어 선택
 */
export function navigateToMedia(index: number): void {
  const current = galleryState.value;

  if (!current.isOpen || index < 0 || index >= current.mediaItems.length) {
    logger.warn(`[Gallery] 유효하지 않은 인덱스: ${index}`);
    return;
  }

  galleryState.value = {
    ...current,
    currentIndex: index,
    error: null,
  };

  logger.debug(`[Gallery] 미디어 선택: ${index}`);
  dispatchEvent('gallery:navigate', { index });
}

/**
 * 이전 미디어
 */
export function navigatePrevious(): void {
  const current = galleryState.value;
  if (current.currentIndex > 0) {
    navigateToMedia(current.currentIndex - 1);
  }
}

/**
 * 다음 미디어
 */
export function navigateNext(): void {
  const current = galleryState.value;
  if (current.currentIndex < current.mediaItems.length - 1) {
    navigateToMedia(current.currentIndex + 1);
  }
}

/**
 * 로딩 상태 설정
 */
export function setLoading(isLoading: boolean): void {
  galleryState.value = {
    ...galleryState.value,
    isLoading,
  };
}

/**
 * 에러 설정
 */
export function setError(error: string | null): void {
  galleryState.value = {
    ...galleryState.value,
    error,
  };

  if (error) {
    logger.error('[Gallery] 에러 발생:', error);
    dispatchEvent('gallery:error', { error });
  }
}

/**
 * 뷰 모드 변경
 */
export function setViewMode(viewMode: 'horizontal' | 'vertical'): void {
  galleryState.value = {
    ...galleryState.value,
    viewMode,
  };
}

// =============================================================================
// 선택자 함수들
// =============================================================================

/**
 * 현재 미디어 아이템 가져오기
 */
export function getCurrentMedia(): MediaInfo | null {
  const state = galleryState.value;
  return state.mediaItems[state.currentIndex] ?? null;
}

/**
 * 갤러리 정보 요약
 */
export function getGalleryInfo(): {
  isOpen: boolean;
  currentIndex: number;
  totalItems: number;
  currentItem: MediaInfo | null;
  mediaCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
  error: string | null;
  viewMode: 'horizontal' | 'vertical';
} {
  const state = galleryState.value;
  return {
    isOpen: state.isOpen,
    mediaCount: state.mediaItems.length,
    totalItems: state.mediaItems.length,
    currentIndex: state.currentIndex,
    currentItem: getCurrentMediaItem(),
    hasNext: state.currentIndex < state.mediaItems.length - 1,
    hasPrevious: state.currentIndex > 0,
    isLoading: state.isLoading,
    error: state.error,
    viewMode: state.viewMode,
  };
}

/**
 * 이벤트 리스너 등록
 */
export function addEventListener<K extends keyof GalleryEvents>(
  event: K,
  handler: (data: GalleryEvents[K]) => void
): () => void {
  const eventHandler = (e: Event): void => {
    const customEvent = e as CustomEvent<GalleryEvents[K]>;
    handler(customEvent.detail);
  };

  const eventName = `xeg:${event}`;
  document.addEventListener(eventName, eventHandler);

  return () => {
    document.removeEventListener(eventName, eventHandler);
  };
}

// =============================================================================
// 마이그레이션 호환성 API
// =============================================================================

/**
 * 갤러리 signals 초기화 (하위 호환성)
 */
export function initializeGallerySignals(): void {
  logger.debug('[Gallery] Signals 초기화 완료 (이미 초기화됨)');
}

/**
 * 갤러리 signals 초기화 상태 확인 (하위 호환성)
 */
export function isGallerySignalsInitialized(): boolean {
  return true; // unified signals는 항상 초기화된 상태
}

/**
 * 갤러리 상태 접근자 (하위 호환성)
 * @deprecated galleryState를 직접 사용하세요
 */
export function getGalleryState(): UnifiedGalleryState {
  logger.warn('[DEPRECATED] getGalleryState 사용 중. galleryState를 직접 사용하세요.');
  return galleryState.value;
}

/**
 * 다음 미디어 존재 여부 (하위 호환성)
 */
export function hasNext(): boolean {
  const state = galleryState.value;
  return state.currentIndex < state.mediaItems.length - 1;
}

/**
 * 이전 미디어 존재 여부 (하위 호환성)
 */
export function hasPrevious(): boolean {
  const state = galleryState.value;
  return state.currentIndex > 0;
}

/**
 * 갤러리 유효성 확인 (하위 호환성)
 */
export function isGalleryValid(): boolean {
  const state = galleryState.value;
  return (
    state.isOpen &&
    state.mediaItems.length > 0 &&
    state.currentIndex >= 0 &&
    state.currentIndex < state.mediaItems.length
  );
}

/**
 * 인덱스로 네비게이션 (하위 호환성)
 * @deprecated navigateToMedia를 사용하세요
 */
export function navigateToIndex(index: number): void {
  logger.warn('[DEPRECATED] navigateToIndex 사용 중. navigateToMedia를 사용하세요.');
  navigateToMedia(index);
}

/**
 * 최적화된 갤러리 열기 (하위 호환성)
 * @deprecated openGallery를 사용하세요
 */
export function openGalleryOptimized(items: readonly MediaInfo[], startIndex = 0): void {
  logger.warn('[DEPRECATED] openGalleryOptimized 사용 중. openGallery를 사용하세요.');
  openGallery(items, startIndex);
}

/**
 * 현재 미디어 아이템 가져오기 (하위 호환성)
 * @deprecated getCurrentMedia를 사용하세요
 */
export function getCurrentMediaItem(): MediaInfo | null {
  logger.warn('[DEPRECATED] getCurrentMediaItem 사용 중. getCurrentMedia를 사용하세요.');
  return getCurrentMedia();
}
