/**
 * @fileoverview 통합 미디어 타입 정의
 * @version 3.1.0 - Phase 195: ExtractionErrorCode -> ErrorCode 통합
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
// ErrorCode 통합을 위해 import (ExtractionErrorCode 별칭으로 제공)
import type { ErrorCode } from './result.types';

export type MediaType = BaseMediaType;
export type MediaQuality = BaseMediaQuality;

/**
 * 브랜드 타입 기본 구조
 */
type Brand<T, B> = T & { readonly __brand: B };

/**
 * 미디어 ID 브랜드 타입
 */
export type MediaId = Brand<string, 'MediaId'>;

/**
 * 기본 미디어 정보
 */
export interface MediaInfo {
  id: string;
  url: string;
  originalUrl?: string | undefined;
  type: 'image' | 'video' | 'gif';
  filename: string;
  fileSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  alt?: string;
  tweetUsername?: string | undefined;
  tweetId?: string | undefined;
  tweetUrl?: string;
  metadata?: Record<string, unknown>;
}

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
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * 추출 에러 코드 (Phase 195: ErrorCode로 통합)
 * @deprecated ErrorCode를 사용하세요. 호환성을 위해 별칭으로 유지됩니다.
 */
export { ErrorCode as ExtractionErrorCode } from './result.types';

/**
 * 추출 에러 클래스
 */
export class ExtractionError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/**
 * 미디어 추출 결과
 */
export interface MediaExtractionResult {
  mediaItems: MediaInfo[];
  success: boolean;
  errors?: ExtractionError[];
  clickedIndex?: number | undefined; // 갤러리에서 사용되는 클릭된 인덱스
  tweetInfo?: TweetInfo | null | undefined; // 추출된 트윗 정보
  metadata?: {
    extractionMethod?: string;
    extractionTime?: number;
    source?: string;
    extractionId?: string;
    extractedAt?: number; // 추출 시간
    sourceType?: string; // 소스 타입
    error?: string; // 에러 메시지
    [key: string]: unknown; // 추가 메타데이터 허용
  };
}

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

/**
 * 미디어 추출기 인터페이스
 */
export interface MediaExtractor {
  /**
   * 클릭된 요소에서 미디어 추출
   */
  extractFromClickedElement(
    element: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;

  /**
   * 컨테이너에서 모든 미디어 추출
   */
  extractAllFromContainer(
    container: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;
}

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
 *
 * Features 계층의 GalleryRenderer에 전달되는 옵션
 * 참고: GalleryRenderOptions는 이전에 interfaces/gallery.interfaces.ts에도
 * 정의되었으나, Phase 200에서 이곳으로 통합됨
 */
export interface GalleryRenderOptions {
  /** 시작 인덱스 (gallery.interfaces.ts에서 마이그레이션) */
  startIndex?: number | undefined;
  /** 뷰 모드 */
  viewMode?: 'horizontal' | 'vertical' | undefined;
  /** 클래스명 (gallery.interfaces.ts에서 마이그레이션) */
  className?: string | undefined;
  /** 트윗 ID (gallery.interfaces.ts에서 마이그레이션) */
  tweetId?: string | undefined;
  /** 키보드 네비게이션 활성화 */
  enableKeyboardNavigation?: boolean;
  /** 다운로드 버튼 표시 */
  showDownloadButton?: boolean;
  /** 파일명 표시 */
  showFilenames?: boolean;
  /** 자동 재생 */
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
