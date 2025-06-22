/**
 * Gallery Core Types - Clean Architecture Implementation
 *
 * @version 8.0.0 - Clean Architecture 완전 적용
 * @description 갤러리 관련 핵심 도메인 타입 정의
 */

import type { MediaInfo } from './media.types';

/**
 * 갤러리 뷰 모드 타입
 */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * 갤러리 상태 인터페이스 (불변성 보장)
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly currentIndex: number;
  readonly items: readonly MediaInfo[];
  readonly viewMode: GalleryViewMode;
  readonly isFullscreen: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/**
 * 갤러리 액션 인터페이스 (Clean Architecture)
 */
export interface GalleryActions {
  open(items: MediaInfo[], startIndex?: number): void;
  close(): void;
  next(): void;
  previous(): void;
  goToIndex(index: number): void;
  setViewMode(mode: GalleryViewMode): void;
  toggleFullscreen(): void;
  setLoading(isLoading: boolean): void;
  setError(error: string | null): void;
}

/**
 * 갤러리 설정 인터페이스
 */
export interface GalleryConfig {
  readonly autoPlay: boolean;
  readonly loopNavigation: boolean;
  readonly keyboardNavigation: boolean;
  readonly showThumbnails: boolean;
  readonly animationDuration: number;
  readonly maxZoomLevel: number;
}

/**
 * 갤러리 이벤트 타입
 */
export type GalleryEvents = {
  'gallery:open': { items: MediaInfo[]; startIndex: number };
  'gallery:close': {};
  'gallery:navigate': { index: number; item: MediaInfo };
  'gallery:viewModeChange': { mode: GalleryViewMode };
  'gallery:fullscreenToggle': { isFullscreen: boolean };
  'gallery:error': { error: string };
};

/**
 * 갤러리 생명주기 단계
 */
export type GalleryLifecycleState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'opening'
  | 'open'
  | 'closing'
  | 'error'
  | 'destroyed';

/**
 * 갤러리 초기화 옵션
 */
export interface GalleryInitOptions {
  readonly container?: HTMLElement;
  readonly config?: Partial<GalleryConfig>;
  readonly onError?: (error: string) => void;
}
