/**
 * @fileoverview Unified Shared Types
 * @version 1.0.0 - Phase 1A Integration
 *
 * 작은 타입 파일들을 통합하여 복잡성을 줄입니다.
 * 파일명, UI, Vendor 관련 타입들을 하나의 파일로 통합합니다.
 */

import type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  MotionAPI,
} from '@shared/external/vendors';

// ================================
// FILENAME TYPES (from filename.types.ts)
// ================================

// Infrastructure 레이어에서 실제 구현에 사용되는 타입들을 re-export
export type { FilenameOptions, ZipFilenameOptions } from '@shared/media/FilenameService';

/**
 * 파일명 검증 결과
 */
export interface FilenameValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 무효 이유 (유효하지 않은 경우) */
  reason?: string;
  /** 제안하는 대안 파일명 */
  suggestion?: string;
}

/**
 * 지원되는 미디어 파일 확장자
 */
export type MediaFileExtension = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'mov';

/**
 * 파일명 생성 전략
 */
export type FilenameStrategy = 'simple' | 'detailed' | 'timestamp' | 'custom';

// ================================
// UI TYPES (from ui.types.ts)
// ================================

/** 기본 컴포넌트 Props */
export interface BaseComponentProps {
  /** CSS 클래스명 */
  className?: string;
  /** 인라인 스타일 */
  style?: Record<string, string | number>;
  /** 데이터 테스트 ID */
  'data-testid'?: string;
}

/** 테마 설정 타입 */
export type Theme = 'light' | 'dark' | 'auto';

/** 갤러리 테마 설정 타입 (시스템 테마 포함) */
export type GalleryTheme = 'light' | 'dark' | 'auto' | 'system';

/** 토스트 메시지 타입 */
export type ToastType = 'info' | 'warning' | 'error' | 'success';

/** 컴포넌트 크기 설정 */
export type Size = 'small' | 'medium' | 'large';

/** 색상 변형 타입 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/** 버튼 변형 타입 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** 버튼 크기 타입 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** 애니메이션 설정 타입 */
export interface AnimationConfig {
  /** 지속 시간 (ms) */
  duration: number;
  /** 이징 함수 */
  easing?: string;
  /** 지연 시간 (ms) */
  delay?: number;
}

// ================================
// VENDOR TYPES (from vendor.types.ts)
// ================================

// Window 객체 확장을 위한 전역 타입 정의
declare global {
  interface Window {
    fflate?: FflateAPI;
    preact?: PreactAPI;
    preactHooks?: PreactHooksAPI;
    preactSignals?: PreactSignalsAPI;
    motion?: MotionAPI;
  }
}

// ================================
// IMAGE FIT TYPES
// ================================

/** 이미지 맞춤 모드 */
export type ImageFitMode =
  | 'original' // 원본 크기 (확대/축소 없음)
  | 'fitWidth' // 컨테이너 폭에 맞춤
  | 'fitHeight' // 컨테이너 높이에 맞춤
  | 'fitContainer'; // 컨테이너에 완전히 맞춤 (종횡비 유지)

/** 이미지 맞춤 콜백 인터페이스 */
export interface ImageFitCallbacks {
  /** 원본 크기로 맞추기 */
  onFitOriginal?: () => void;
  /** 폭에 맞추기 */
  onFitWidth?: () => void;
  /** 높이에 맞추기 */
  onFitHeight?: () => void;
  /** 컨테이너에 맞추기 */
  onFitContainer?: () => void;
}

/** 이미지 맞춤 설정 */
export interface ImageFitOptions {
  /** 맞춤 모드 */
  fit: ImageFitMode;
  /** 위치 설정 */
  position?: string;
  /** 배경색 */
  backgroundColor?: string;
}

// ================================
// BRANDED TYPES (from branded.ts)
// ================================

/**
 * 브랜드 타입 기본 구조
 */
export type Brand<T, B> = T & { readonly __brand: B };

/**
 * ID 타입들 - 서로 다른 종류의 ID가 섞이지 않도록 보장
 */
export type MediaId = Brand<string, 'MediaId'>;
export type UserId = Brand<string, 'UserId'>;
export type TweetId = Brand<string, 'TweetId'>;
export type ServiceKey = Brand<string, 'ServiceKey'>;
export type ElementId = Brand<string, 'ElementId'>;

/**
 * URL 타입들 - 용도별로 구분
 */
export type MediaUrl = Brand<string, 'MediaUrl'>;
export type ThumbnailUrl = Brand<string, 'ThumbnailUrl'>;
export type OriginalUrl = Brand<string, 'OriginalUrl'>;

/**
 * 파일명 타입들
 */
export type FileName = Brand<string, 'FileName'>;
export type FileExtension = Brand<string, 'FileExtension'>;

/**
 * 수치 타입들
 */
export type Percentage = Brand<number, 'Percentage'>;
export type PixelValue = Brand<number, 'PixelValue'>;
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * 브랜드 타입 생성 헬퍼
 */
export function createMediaId(id: string): MediaId {
  return id as MediaId;
}

export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createTweetId(id: string): TweetId {
  return id as TweetId;
}

export function createServiceKey(key: string): ServiceKey {
  return key as ServiceKey;
}

export function createElementId(id: string): ElementId {
  return id as ElementId;
}

// ================================
// COMMON TYPES (from common.ts)
// ================================

// Re-export core types for backward compatibility (excluding Size to avoid conflicts)
export type {
  MediaItem,
  GalleryConfig,
  ThemeConfig,
  DownloadOptions,
  Point,
  EventHandler,
  AsyncEventHandler,
  CancelableFunction,
  LoadingState,
  ErrorInfo,
} from './core/core-types';
