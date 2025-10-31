/**
 * @fileoverview 통합 미디어 타입 정의
 * @version 4.0.0 - Phase 195: 최종 통합 (core/media.types.ts 병합)
 *
 * 모든 미디어 관련 타입을 하나로 통합:
 * - media.types.ts (핵심 미디어 타입)
 * - core/media.types.ts (추출 및 갤러리 관련) ← 병합 완료
 * - extraction.types.ts (추출 전략 및 옵션) ← 병합 예정
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
  filename?: string;
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

/**
 * MediaInfoWithFilename - 파일명이 포함된 미디어 정보 (다운로드용)
 *
 * MediaInfo에서 필수 필드들을 required로 만든 버전
 */
export interface MediaInfoWithFilename extends MediaInfo {
  /** 미디어 고유 식별자 (필수) */
  id: string;
  /** 원본 페이지 URL (필수) */
  originalUrl: string;
  /** 저장할 파일명 (필수) */
  filename: string;
}

// ================================
// 추출 관련 타입들
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
 * 페이지 타입 정의 (Core에서 병합)
 */
export enum PageType {
  TIMELINE = 'timeline',
  SINGLE_TWEET = 'single_tweet',
  MEDIA_TAB = 'media_tab',
  SINGLE_MEDIA = 'single_media',
  PROFILE = 'profile',
  UNKNOWN = 'unknown',
}

/**
 * 추출 소스 타입 (Core에서 병합)
 */
export enum ExtractionSource {
  CURRENT_PAGE = 'current_page',
  BACKGROUND_LOAD = 'background_load',
  CACHE = 'cache',
  API = 'api',
}

/**
 * 트윗 URL 정보 (Core에서 병합)
 */
export interface TweetUrl {
  readonly url: string;
  readonly tweetId: string;
  readonly userId: string;
  readonly mediaIndex?: number | undefined;
  readonly isValid: boolean;
}

/**
 * 추출 옵션 상세 (Core에서 병합)
 */
export interface ExtractionOptions {
  readonly enableBackgroundLoading: boolean;
  readonly enableCache: boolean;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly fallbackStrategies: boolean;
  readonly debugMode: boolean;
}

/**
 * 추출 메타데이터 (Core에서 병합)
 */
export interface ExtractionMetadata {
  readonly extractionTime?: number;
  readonly extractedAt?: number;
  readonly strategiesUsed?: string[];
  readonly sourceCount?: number;
  readonly cacheHits?: number;
  readonly retryCount?: number;
  readonly sourceType?: string;
  readonly strategy?: string;
  readonly error?: string;
  readonly performance?: {
    readonly totalTime: number;
    readonly backgroundLoadTime?: number;
    readonly parseTime: number;
  };
  readonly [key: string]: unknown;
}

/**
 * 추출 컨텍스트 (Core에서 병합)
 */
export interface ExtractionContext {
  readonly clickedElement?: HTMLElement;
  readonly currentUrl: string;
  readonly pageType: PageType;
  readonly options: ExtractionOptions;
  readonly timestamp: number;
}

/**
 * 추출 신뢰도 점수 (Core에서 병합)
 */
export interface ExtractionConfidence {
  /** 전체 신뢰도 (0-1) */
  overall: number;
  /** URL 매칭 신뢰도 */
  urlMatching: number;
  /** DOM 구조 신뢰도 */
  domStructure: number;
  /** 메타데이터 신뢰도 */
  metadata: number;
  /** API 데이터 신뢰도 */
  apiData?: number;
}

/**
 * 미디어 추출 결과
 */
export interface MediaExtractionResult {
  mediaItems: MediaInfo[];
  success: boolean;
  errors?: ExtractionError[];
  clickedIndex?: number | undefined;
  tweetInfo?: TweetInfo | null | undefined;
  // Backward compatibility with core version
  source?: ExtractionSource;
  sourceType?: string;
  metadata?:
    | ExtractionMetadata
    | {
        extractionMethod?: string;
        extractionTime?: number;
        source?: string;
        extractionId?: string;
        extractedAt?: number;
        sourceType?: string;
        error?: string;
        [key: string]: unknown;
      };
}

/**
 * 추출 에러 코드
 *
 * @deprecated ErrorCode를 사용하세요 (Phase 195에서 ErrorCode로 통합)
 * 호환성을 위해 별칭으로 유지됩니다.
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
 */
export interface GalleryRenderOptions {
  /** 시작 인덱스 */
  startIndex?: number | undefined;
  /** 뷰 모드 */
  viewMode?: 'horizontal' | 'vertical' | undefined;
  /** 클래스명 */
  className?: string | undefined;
  /** 트윗 ID */
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
 * 갤러리 열기 이벤트 세부 정보 (Core에서 병합)
 */
export interface GalleryOpenEventDetail {
  /** 미디어 아이템 목록 */
  media: MediaItem[];
  /** 시작 인덱스 */
  startIndex: number;
}

/**
 * 갤러리 열기 커스텀 이벤트 (Core에서 병합)
 */
export interface GalleryOpenEvent extends CustomEvent<GalleryOpenEventDetail> {
  type: 'xeg:gallery:open' | 'xeg:openGallery';
}

/**
 * 갤러리 닫기 커스텀 이벤트 (Core에서 병합)
 */
export interface GalleryCloseEvent extends CustomEvent<void> {
  type: 'xeg:gallery:close';
}

/**
 * 미디어 컬렉션 인터페이스 (Core에서 병합)
 */
export interface MediaCollection {
  items: MediaItem[];
  totalCount: number;
  currentIndex: number;
}

/**
 * 미디어 페이지 타입 (Core 버전 - 더 세분화됨)
 *
 * Root 버전: 'photo' | 'video' | 'gif' | 'mixed' | 'photoDetail' | 'videoDetail'
 * Core 버전: 'mediaGrid' | 'photoDetail' | 'videoDetail' | 'mediaTimeline' | 'unknown'
 * → 통합: union 타입으로 모두 허용
 */
export type MediaPageType =
  | 'photo'
  | 'video'
  | 'gif'
  | 'mixed'
  | 'photoDetail'
  | 'videoDetail'
  | 'mediaGrid'
  | 'mediaTimeline'
  | 'timeline'
  | 'unknown';

/**
 * 미디어 추출 전략
 */
export type ExtractionStrategy =
  | 'api-first'
  | 'dom-only'
  | 'hybrid'
  | 'multi-strategy'
  | 'conservative';

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
  confidence?: ExtractionConfidence | number;
  /** 매핑 방법 (기존 호환성) */
  method?: string;
  /** 메타데이터 */
  metadata?: Record<string, unknown>;
}

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
   */
  execute(clickedElement: HTMLElement, pageType: MediaPageType): Promise<MediaMapping | null>;
}

// ================================
// 검증 관련 타입들
// ================================

/**
 * 검증 이슈 (Core에서 병합)
 */
export interface ValidationIssue {
  /** 문제 타입 */
  type: 'url' | 'metadata' | 'content' | 'structure';
  /** 심각도 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 문제 설명 */
  message: string;
  /** 영향받는 필드 */
  field?: string;
}

/**
 * 검증 결과 (Core에서 병합)
 */
export interface ValidationResult {
  /** 유효성 */
  isValid: boolean;
  /** 전체 점수 (0-1) */
  score: number;
  /** 발견된 문제들 */
  issues: ValidationIssue[];
  /** 개선 제안 */
  suggestions: string[];
}

/**
 * 미디어 검증 결과 (기존 버전 - 간단함)
 */
export interface MediaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ================================
// 메타데이터 타입들
// ================================

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
