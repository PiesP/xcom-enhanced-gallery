/**
 * Core Media Types for X.com Enhanced Gallery
 *
 * This module contains the fundamental media type definitions that are used
 * across all layers of the application. These types should remain stable
 * and serve as the single source of truth for media-related interfaces.
 */

// Re-export from constants to avoid duplication
import type { MediaType as BaseMediaType, MediaQuality as BaseMediaQuality } from '../../constants';
export type MediaType = BaseMediaType;
export type MediaQuality = BaseMediaQuality;

/**
 * 브랜드 타입 기본 구조 (core 레이어 독립성을 위해 정의)
 */
type Brand<T, B> = T & { readonly __brand: B };

/**
 * 미디어 ID 브랜드 타입
 */
export type MediaId = Brand<string, 'MediaId'>;

/**
 * 기본 미디어 정보 인터페이스
 */
export interface MediaInfo {
  /** 미디어의 고유 식별자 */
  id?: string | undefined;
  /** 미디어의 기본 URL */
  url: string;
  /** 원본 해상도 미디어 URL */
  originalUrl?: string | undefined;
  /** 미디어 타입 (이미지, 비디오, GIF) */
  type: MediaType;
  /** 미디어 제목 (선택적) */
  title?: string | undefined;
  /** 다운로드용 파일명 */
  filename?: string | undefined;
  /** 파일 크기 (바이트) */
  fileSize?: number | undefined;
  /** 미디어 너비 (픽셀) */
  width?: number | undefined;
  /** 미디어 높이 (픽셀) */
  height?: number | undefined;
  /** 썸네일 URL (비디오의 경우) */
  thumbnailUrl?: string | undefined;
  /** 썸네일 URL (호환성을 위한 별칭) */
  thumbnail?: string | undefined;
  /** 대체 텍스트 (접근성) */
  alt?: string | undefined;
  /** 비디오 지속시간 (초) */
  duration?: number | undefined;
  /** 미디어 출처/소스 */
  source?: string | undefined;
  /** 미디어 순서 (컬렉션 내에서의 위치) */
  order?: number | undefined;
  // Tweet-specific properties
  /** 트윗 작성자 사용자명 */
  tweetUsername?: string | undefined;
  /** 트윗 ID */
  tweetId?: string | undefined;
  /** 트윗 URL */
  tweetUrl?: string | undefined;
  // Metadata
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown> | undefined;
  /** 대체 URL 목록 */
  urlAlternatives?: string[] | undefined;
} /**
 * 미디어 아이템 타입 (MediaInfo와 동일한 구조)
 * 애플리케이션 전반에서 일관된 미디어 데이터 구조를 위해 사용
 */
export type MediaItem = MediaInfo;

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
  /** 저장할 파일명 */
  filename: string;
}

/**
 * 파일명이 포함된 미디어 정보 (다운로드용)
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

/**
 * FilenameService에서 사용하는 기본 미디어 정보
 * (Infrastructure에서 이동한 타입)
 */
export interface MediaItemForFilename {
  /** 미디어 고유 식별자 */
  id?: string | undefined;
  /** 미디어 URL */
  url: string;
  /** 원본 URL (사용자명 추출용) */
  originalUrl?: string | undefined;
  /** 미디어 타입 */
  type: MediaType;
  /** 기존 파일명 */
  filename?: string | undefined;
  /** 트윗 작성자 사용자명 */
  tweetUsername?: string | undefined;
  /** 트윗 ID */
  tweetId?: string | undefined;
}

/**
 * FilenameService에서 사용하는 미디어 정보 타입
 * (Infrastructure에서 이동한 타입)
 */
export interface MediaInfoForFilename extends MediaItemForFilename {}

/**
 * 갤러리 열기 이벤트 세부 정보
 */
export interface GalleryOpenEventDetail {
  /** 미디어 아이템 목록 */
  media: MediaItem[];
  /** 시작 인덱스 */
  startIndex: number;
}

/**
 * 갤러리 열기 커스텀 이벤트
 */
export interface GalleryOpenEvent extends CustomEvent<GalleryOpenEventDetail> {
  type: 'xeg:gallery:open' | 'xeg:openGallery';
}

/**
 * 갤러리 닫기 커스텀 이벤트
 */
export interface GalleryCloseEvent extends CustomEvent<void> {
  type: 'xeg:gallery:close';
}

/**
 * 미디어 컬렉션 인터페이스
 */
export interface MediaCollection {
  items: MediaItem[];
  totalCount: number;
  currentIndex: number;
} /**
 * 미디어 페이지 타입
 */
export type MediaPageType =
  | 'mediaGrid' // /username/media
  | 'photoDetail' // /username/status/id/photo/1
  | 'videoDetail' // /username/status/id/video/1
  | 'mediaTimeline' // /username/with_replies (미디어 포함)
  | 'unknown';

/**
 * 미디어 추출 전략
 */
export type ExtractionStrategy =
  | 'api-first' // API 우선 전략
  | 'dom-only' // DOM 전용 전략
  | 'hybrid' // 하이브리드 전략
  | 'multi-strategy' // 다중 전략 조합
  | 'conservative'; // 보수적 전략

/**
 * 추출 신뢰도 점수
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
 * 매핑 결과
 */
export interface MediaMapping {
  /** 트윗 ID */
  tweetId: string | undefined;
  /** 미디어 인덱스 */
  mediaIndex?: number | undefined;
  /** 신뢰도 점수 */
  confidence: ExtractionConfidence;
  /** 매핑 방법 */
  method: string;
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * 검증 결과
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
 * 검증 문제
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
 * 페이지 타입 정의
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
 * 추출 소스 타입
 */
export enum ExtractionSource {
  CURRENT_PAGE = 'current_page',
  BACKGROUND_LOAD = 'background_load',
  CACHE = 'cache',
  API = 'api',
}

/**
 * 트윗 URL 정보
 */
export interface TweetUrl {
  readonly url: string;
  readonly tweetId: string;
  readonly userId: string;
  readonly mediaIndex?: number | undefined;
  readonly isValid: boolean;
}

/**
 * 추출 옵션
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
 * 추출 메타데이터
 */
export interface ExtractionMetadata {
  readonly extractionTime?: number; // Make optional for backward compatibility
  readonly extractedAt?: number; // backward compatibility
  readonly strategiesUsed?: string[]; // Make optional for backward compatibility
  readonly sourceCount?: number; // Make optional for backward compatibility
  readonly cacheHits?: number; // Make optional for backward compatibility
  readonly retryCount?: number; // Make optional for backward compatibility
  readonly sourceType?: string; // backward compatibility
  readonly strategy?: string; // backward compatibility
  readonly error?: string; // backward compatibility
  readonly performance?: {
    readonly totalTime: number;
    readonly backgroundLoadTime?: number;
    readonly parseTime: number;
  };
  // Allow additional properties for flexibility
  readonly [key: string]: unknown;
}

/**
 * 추출 결과
 */
export interface MediaExtractionResult {
  readonly success: boolean;
  readonly mediaItems: MediaInfo[];
  readonly clickedIndex: number;
  readonly source?: ExtractionSource; // Make optional for backward compatibility
  readonly sourceType?: string; // backward compatibility
  readonly metadata: ExtractionMetadata;
  readonly error?: ExtractionError | string; // Allow string for backward compatibility
  readonly tweetInfo?: unknown; // Allow any tweet info structure for backward compatibility
}

/**
 * 추출 컨텍스트
 */
export interface ExtractionContext {
  readonly clickedElement?: HTMLElement;
  readonly currentUrl: string;
  readonly pageType: PageType;
  readonly options: ExtractionOptions;
  readonly timestamp: number;
}

/**
 * 추출 에러 코드
 */
export enum ExtractionErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  PARSE_ERROR = 'PARSE_ERROR', // 호환성을 위한 별칭
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  NO_MEDIA_FOUND = 'NO_MEDIA_FOUND',
  INVALID_URL_ERROR = 'INVALID_URL_ERROR',
  INVALID_URL = 'INVALID_URL', // 호환성을 위한 별칭
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 추출 에러 타입
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly code: ExtractionErrorCode,
    public readonly context?: ExtractionContext,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}
