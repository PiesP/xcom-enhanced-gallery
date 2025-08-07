/**
 * @fileoverview 통합 미디어 타입 정의
 * @version 3.0.0 - Phase 3: 파일 통합
 *
 * 모든 미디어 관련 타입을 하나로 통합:
 * - media.types.ts (핵심 미디어 타입)
 * - media-entity.types.ts (엔티티 + 유틸리티)
 * - extraction.types.ts (추출 관련)
 */

// ================================
// 기본 미디어 타입들
// ================================

// Constants에서 re-export
import type { MediaType as BaseMediaType, MediaQuality as BaseMediaQuality } from '@/constants';

export type MediaType = BaseMediaType;
export type MediaQuality = BaseMediaQuality;

// Core 타입들 import 및 re-export
import type { MediaExtractionResult } from '@shared/types/core/media.types';
import type { MediaExtractor as CoreMediaExtractor } from '@shared/types/core/extraction.types';

// Re-export core types
export type MediaExtractor = CoreMediaExtractor;
export type { MediaExtractionResult };

/**
 * 브랜드 타입 기본 구조
 */
type Brand<T, B> = T & { readonly __brand: B };

/**
 * 미디어 ID 브랜드 타입
 */
export type MediaId = Brand<string, 'MediaId'>;

// Import and re-export MediaInfo from core
import type { MediaInfo as CoreMediaInfo } from '@shared/types/core/media.types';
export type MediaInfo = CoreMediaInfo;

/**
 * 미디어 엔티티 (시간 정보 포함)
 */
export interface MediaEntity extends MediaInfo {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 미디어 아이템 (MediaInfo 별칭)
 */
export type MediaItem = MediaInfo;

/**
 * 파일명 생성용 미디어 정보 (별칭)
 */
export type MediaInfoForFilename = MediaInfo;
export type MediaItemForFilename = MediaInfo;

// ================================
// 추출 관련 타입들 (extraction.types.ts 통합)
// ================================

/**
 * 트윗 정보 인터페이스
 */
export interface TweetInfo {
  /** 트윗 ID */
  tweetId: string;
  /** 사용자명 */
  username: string;
  /** 트윗 URL */
  tweetUrl: string;
  /** 추출 방법 */
  extractionMethod: string;
  /** 추출 신뢰도 (0-1) */
  confidence: number;
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * 미디어 추출 옵션
 */
export interface MediaExtractionOptions {
  /** 비디오 포함 여부 */
  includeVideos?: boolean;
  /** 타임아웃 (밀리초) */
  timeoutMs?: number;
  /** API 폴백 사용 */
  useApiFallback?: boolean;
  /** 백그라운드 로딩 활성화 */
  enableBackgroundLoading?: boolean;
  /** 유효성 검사 활성화 */
  enableValidation?: boolean;
  /** 최대 재시도 횟수 */
  maxRetries?: number;
}

// Import and re-export error types from core
import {
  ExtractionErrorCode as CoreExtractionErrorCode,
  ExtractionError as CoreExtractionError,
} from '@shared/types/core/media.types';
export const ExtractionErrorCode = CoreExtractionErrorCode;
export const ExtractionError = CoreExtractionError;

// ================================
// 미디어 추출 결과 - 이미 상단에서 re-export됨
// ================================

/**
 * 트윗 정보 추출 전략 인터페이스
 */
export interface TweetInfoExtractionStrategy {
  /** 전략 이름 */
  readonly name: string;
  /** 전략 우선순위 (낮을수록 높은 우선순위) */
  readonly priority: number;

  /**
   * 트윗 정보 추출
   */
  extract(element: HTMLElement): Promise<TweetInfo | null>;
}

/**
 * API 추출기 인터페이스
 */
export interface APIExtractor {
  /**
   * API를 통한 미디어 추출
   */
  extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult>;
}

/**
 * 백업 추출 전략 인터페이스
 */
export interface FallbackExtractionStrategy {
  /**
   * 백업 추출 실행
   */
  extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult>;
}

// ================================
// 미디어 추출기 인터페이스 - Core에서 re-export (상단에서 이미 정의됨)
// ================================

// Already re-exported at the top of file

// ================================
// 다운로드 관련 타입들
// ================================

/**
 * 다운로드 미디어 아이템
 */
export interface DownloadMediaItem extends MediaInfo {
  downloadProgress?: number | undefined;
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | undefined;
}

/**
 * URL과 파일명 쌍을 나타내는 인터페이스
 */
export interface UrlWithFilename {
  /** 다운로드할 파일의 URL */
  url: string;
  /** 파일명 */
  filename: string;
}

/**
 * 일괄 다운로드 옵션
 */
export interface BulkDownloadOptions {
  /** 병렬 다운로드 수 제한 */
  concurrency?: number;
  /** 다운로드 지연 시간 (ms) */
  delay?: number;
  /** ZIP 파일로 압축할지 여부 */
  createZip?: boolean;
  /** ZIP 파일명 (createZip이 true일 때) */
  zipFilename?: string;
}

// ================================
// 갤러리 관련 타입들
// ================================

/**
 * 갤러리 렌더링 옵션
 */
export interface GalleryRenderOptions {
  viewMode: 'horizontal' | 'vertical';
  enableKeyboardNavigation?: boolean;
  showDownloadButton?: boolean;
  showFilenames?: boolean;
  autoPlay?: boolean;
}

/**
 * 미디어 매핑 정보 (통합 버전)
 */
export interface MediaMapping {
  /** 페이지 타입 */
  pageType: MediaPageType;
  /** 미디어 URL들 */
  mediaUrls: string[];
  /** 트윗 ID (기존 호환성) */
  tweetId?: string | undefined;
  /** 미디어 인덱스 (기존 호환성) */
  mediaIndex?: number | undefined;
  /** 신뢰도 점수 (기존 호환성) */
  confidence?: number;
  /** 매핑 방법 (기존 호환성) */
  method?: string;
  /** 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * 미디어 페이지 타입
 */
export type MediaPageType = 'photo' | 'video' | 'gif' | 'mixed' | 'photoDetail' | 'videoDetail';

/**
 * 미디어 매핑 전략 인터페이스
 */
export interface MediaMappingStrategy {
  /** 전략의 고유 이름 */
  readonly name: string;

  /** 우선순위 (낮을수록 먼저 실행) */
  readonly priority: number;

  /**
   * 미디어 매핑 실행
   * @param clickedElement 클릭된 요소
   * @param pageType 페이지 타입
   * @returns 매핑 결과 또는 null
   */
  execute(clickedElement: HTMLElement, pageType: MediaPageType): Promise<MediaMapping | null>;
}

// ================================
// 유틸리티 타입들
// ================================

/**
 * 미디어 검증 결과
 */
export interface MediaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * 미디어 메타데이터
 */
export interface MediaMetadata {
  /** 파일 크기 (바이트) */
  fileSize?: number;
  /** 이미지/비디오 차원 */
  dimensions?: {
    width: number;
    height: number;
  };
  /** 비디오 길이 (초) */
  duration?: number;
  /** MIME 타입 */
  mimeType?: string;
  /** 생성 날짜 */
  createdAt?: Date;
  /** 추가 속성 */
  [key: string]: unknown;
}
