/**
 * Core Types
 * @version 1.0.0
 *
 * Core 레이어에서 사용하는 기본 타입 정의
 */

// Re-export MediaItem from media.types to avoid duplication
export type { MediaItem } from './media.types';

export interface GalleryConfig {
  /** 자동 재생 여부 */
  autoPlay: boolean;
  /** 썸네일 표시 여부 */
  showThumbnails: boolean;
  /** 다운로드 기능 활성화 여부 */
  downloadEnabled: boolean;
  /** 키보드 네비게이션 활성화 여부 */
  keyboardNavigation?: boolean;
  /** 풀스크린 모드 지원 여부 */
  fullscreenEnabled?: boolean;
  /** 이미지 확대/축소 기능 */
  zoomEnabled?: boolean;
}

export interface ThemeConfig {
  /** 테마 모드 */
  mode: 'light' | 'dark' | 'auto';
  /** 색상 스킴 */
  colorScheme?: 'twitter' | 'minimal' | 'custom';
  /** 애니메이션 활성화 여부 */
  animationsEnabled?: boolean;
}

export interface DownloadOptions {
  /** 다운로드 품질 */
  quality?: 'original' | 'high' | 'medium';
  /** 파일명 형식 */
  filenameFormat?: string;
  /** 압축 활성화 여부 */
  compressionEnabled?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** 일반적인 이벤트 핸들러 타입 */
export type EventHandler<T = Event> = (event: T) => void;

/** 비동기 이벤트 핸들러 타입 */
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/** 취소 가능한 함수 타입 */
export type CancelableFunction = () => void;

/** 로딩 상태 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** 에러 정보 */
export interface ErrorInfo {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}
