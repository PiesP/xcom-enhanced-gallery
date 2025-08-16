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
import { TIME_CONSTANTS } from '@/constants';
import { getPreactSignals } from '@shared/external/vendors';
import { defaultLogger, type ILogger } from '@shared/services/core-services';
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';
import { AnchorScrollPositionController } from '@shared/scroll/anchor-scroll-position-controller';
import { getScrollRestorationConfig } from '@shared/scroll/scroll-restoration-config';
import { stabilizeTimelinePosition } from '@shared/scroll/timeline-position-stabilizer';
import { setGalleryStateChecker } from '@shared/utils/events';

// Signal type (align with Preact signals: subscribe returns unsubscribe)
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
  readonly isSettingsOpen?: boolean;
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
  isSettingsOpen: false,
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

// (Removed jitter multi-pass variables) - 단일 restore 로 단순화

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

    // 순환 의존성 방지를 위한 상태 체커 주입
    setGalleryStateChecker({
      isOpen: () => galleryStateSignal?.value.isOpen ?? false,
    });
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
    const s = getGalleryStateSignal();
    if (typeof s.subscribe === 'function') {
      try {
        return s.subscribe(value => callback(value));
      } catch {
        // fall through to no-op below
      }
    }
    // Fallback: push current value once, return no-op
    try {
      callback(s.value);
    } catch {
      // ignore
    }
    return () => {};
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
  // (Phase1) Scroll position 저장: Controller 사용 (중복 방지를 위해 훅에서 또 저장한다면 향후 flag로 조정)
  try {
    if (getScrollRestorationConfig().enableSignalBasedGalleryScroll) {
      logger.info('[Gallery] Signal 기반 스크롤 저장 시작');

      // 이중 저장: 앵커 + 절대 좌표 모두 저장으로 안전장치 마련
      // key 옵션 생략 시 자동으로 새로운 키 시스템 사용 (buildAnchorScrollKey 기반)
      const anchorSaved = AnchorScrollPositionController.save();
      logger.info('[Gallery] 앵커 저장 결과:', anchorSaved);

      // 앵커 저장 성공 여부와 관계없이 절대 좌표도 항상 저장 (백업용)
      const absoluteSaved = ScrollPositionController.save();
      logger.info('[Gallery] 절대 좌표 백업 저장 결과:', absoluteSaved);
    } else {
      logger.info('[Gallery] Signal 기반 저장 비활성화됨');
    }
  } catch {
    // 비DOM 환경 보호
    logger.warn('[Gallery] 스크롤 저장 중 예외 발생');
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

  // 저장된 스크롤 위치로 복원 (강화된 앵커 우선 정책)
  try {
    if (getScrollRestorationConfig().enableSignalBasedGalleryScroll) {
      logger.info('[Gallery] Signal 기반 스크롤 복원 시작');

      // 1차: 앵커 기반 즉시 복원 시도 (DOM 안정화를 위해 최소 타임아웃 허용)
      // key 옵션 생략 시 자동으로 새로운 키 시스템 사용 (buildAnchorScrollKey 기반)
      const anchorRestored = AnchorScrollPositionController.restore({
        observe: false, // MutationObserver 대기 없이 즉시 시도
        timeoutMs: 50, // DOM 안정화를 위한 최소 여유 (50ms)
      });

      if (!anchorRestored) {
        // 2차: 앵커 실패 시 절대 좌표 즉시 복원 폴백
        logger.info('[Gallery] 앵커 복원 실패 - 절대 좌표 복원 시도');
        const absoluteRestored = ScrollPositionController.restore({
          smooth: false, // 스크롤 애니메이션 완전 차단
          mode: 'immediate', // 지연 없는 즉시 복원
        });
        logger.info('[Gallery] 절대 좌표 복원 결과:', absoluteRestored);
      } else {
        logger.info('[Gallery] 앵커 기반 즉시 복원 성공');
      }

      // 3차: 타임라인 위치 안정화 (드리프트 보정)
      try {
        logger.info('[Gallery] 타임라인 위치 안정화 시작');

        // 기본 복원 후 100ms 대기하여 DOM 안정화
        setTimeout(async () => {
          try {
            const stabilized = await stabilizeTimelinePosition(undefined, undefined, {
              stabilityTimeoutMs: 300, // 충분한 안정화 시간
              maxCorrectionAttempts: 2, // 최대 2회 보정 시도
            });
            logger.info('[Gallery] 타임라인 위치 안정화 결과:', stabilized);
          } catch (error) {
            logger.warn('[Gallery] 타임라인 안정화 중 오류:', error);
          }
        }, TIME_CONSTANTS.TIMELINE_STABILIZATION_DELAY_MS); // 안정화 시작 지연
      } catch (error) {
        logger.warn('[Gallery] 타임라인 안정화 설정 오류:', error);
      }
    } else {
      logger.info('[Gallery] Signal 기반 복원 비활성화됨');
    }
  } catch (error) {
    logger.warn('[Gallery] 스크롤 위치 복원 실패:', error);
    // 예외 발생 시 최후 수단으로 절대 좌표 복원 시도
    try {
      ScrollPositionController.restore({ smooth: false, mode: 'immediate' });
    } catch {
      // 비DOM 환경 보호
    }
  }

  // 상태 완전 초기화 - mediaItems도 함께 초기화
  galleryState.value = {
    ...currentState,
    isOpen: false,
    mediaItems: [], // 🔑 핵심: mediaItems 초기화로 상태 동기화 보장
    currentIndex: 0,
    error: null,
    isSettingsOpen: false,
  };

  logger.debug('[Gallery] 갤러리 종료 및 상태 완전 초기화 완료');

  // 이벤트 시스템 정리 - TDD GREEN 단계: 완전 정리로 변경
  try {
    // 설계 변경(2025-08-16): closeGallery 는 "부분 정리"만 수행하여
    // 캡처 단계 리스너를 유지하고 다음 미디어 클릭에서 재초기화(reinitialize)되도록 한다.
    // 실환경 문제: 완전 정리(destroy) 시 두 번째 클릭에서 트위터 네이티브 갤러리가 가로채는 이슈.
    // 해결: cleanupGalleryEvents() 만 호출 -> listener 유지 + isGalleryClosing=true 설정.
    const g: any = globalThis as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof g.__XEG_cleanupGalleryEvents === 'function') {
      g.__XEG_cleanupGalleryEvents(); // 내부적으로 cleanupGalleryEvents() 호출
    }
    // destroyGalleryEvents() 는 GalleryApp.cleanup() 시점에만 수행.
  } catch (error) {
    logger.warn('[Gallery] 이벤트 정리 실패:', error);
  }
}

// Settings modal visibility controls
export function openSettings(): void {
  const s = galleryState.value;
  galleryState.value = { ...s, isSettingsOpen: true };
}

export function closeSettings(): void {
  const s = galleryState.value;
  galleryState.value = { ...s, isSettingsOpen: false };
}

export function toggleSettings(force?: boolean): void {
  const s = galleryState.value;
  const next = typeof force === 'boolean' ? force : !s.isSettingsOpen;
  galleryState.value = { ...s, isSettingsOpen: next };
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
