/**
 * @fileoverview Unified Type Definitions
 * @version 2.0.0
 *
 * 프로젝트 전체에서 사용되는 통합 타입 정의
 * 중복과 분산을 제거하고 일관성을 보장
 */

// ===================== 기본 타입 =====================
export type ID = string;
export type Timestamp = number;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// ===================== 브랜드 타입 =====================
export type TweetId = string & { readonly _brand: 'TweetId' };
export type UserId = string & { readonly _brand: 'UserId' };
export type MediaId = string & { readonly _brand: 'MediaId' };

// ===================== 결과 타입 =====================
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// ===================== 비동기 상태 =====================
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// ===================== 미디어 타입 =====================
export type MediaType = 'image' | 'video' | 'gif';
export type MediaQuality = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

export interface MediaDimensions {
  readonly width: number;
  readonly height: number;
}

export interface MediaMetadata {
  readonly tweetId: TweetId;
  readonly username: string;
  readonly timestamp: Timestamp;
  readonly quality: MediaQuality;
}

export interface MediaItem {
  readonly id: MediaId;
  readonly type: MediaType;
  readonly url: string;
  readonly originalUrl: string;
  readonly filename: string;
  readonly size?: number;
  readonly dimensions?: MediaDimensions;
  readonly metadata: MediaMetadata;
  readonly alt?: string;
}

// ===================== 갤러리 타입 =====================
export type ViewMode = 'verticalList';

export interface GalleryState {
  readonly isOpen: boolean;
  readonly items: readonly MediaItem[];
  readonly selectedIndex: number;
  readonly viewMode: ViewMode;
}

// ===================== 다운로드 타입 =====================
export type DownloadStatus = 'idle' | 'pending' | 'downloading' | 'completed' | 'error';

export interface DownloadOptions {
  readonly quality: MediaQuality;
  readonly format?: string;
  readonly includeMetadata?: boolean;
}

export interface DownloadProgress {
  readonly current: number;
  readonly total: number;
  readonly percentage: number;
  readonly status: DownloadStatus;
}

export interface DownloadResult {
  readonly success: boolean;
  readonly downloadedCount: number;
  readonly failedCount: number;
  readonly errors: readonly string[];
}

// ===================== 서비스 타입 =====================
export interface BaseService {
  readonly name: string;
  initialize?(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
}

export type ServiceState = 'unregistered' | 'registered' | 'initializing' | 'initialized' | 'error';

// ===================== UI 타입 =====================
export type Theme = 'light' | 'dark' | 'auto';
export type ToastType = 'info' | 'warning' | 'error' | 'success';
export type Size = 'small' | 'medium' | 'large';
export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'icon';

// ===================== 이벤트 타입 =====================
export type EventHandler<T = Event> = (event: T) => void;
export type MouseEventHandler = EventHandler<MouseEvent>;
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;

// ===================== 헬퍼 타입 =====================
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

// ===================== 유틸리티 함수 =====================
export function createTweetId(id: string): TweetId {
  return id as TweetId;
}

export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createMediaId(id: string): MediaId {
  return id as MediaId;
}

export function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success;
}

export function isError<T>(result: Result<T>): result is { success: false; error: Error } {
  return !result.success;
}
