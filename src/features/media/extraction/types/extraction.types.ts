/**
 * @fileoverview 미디어 추출 시스템 핵심 타입 정의
 * @version 2.0.0 - Extraction architecture
 */

import type { MediaInfo } from '@core/types/media.types';

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
  readonly extractionTime: number;
  readonly strategiesUsed: string[];
  readonly sourceCount: number;
  readonly cacheHits: number;
  readonly retryCount: number;
  readonly performance: {
    readonly totalTime: number;
    readonly backgroundLoadTime?: number;
    readonly parseTime: number;
  };
}

/**
 * 추출 결과
 */
export interface ExtractionResult {
  readonly success: boolean;
  readonly mediaItems: MediaInfo[];
  readonly clickedIndex: number;
  readonly source: ExtractionSource;
  readonly metadata: ExtractionMetadata;
  readonly error?: ExtractionError;
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

/**
 * 추출 에러 코드
 */
export enum ExtractionErrorCode {
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  NO_MEDIA_FOUND = 'NO_MEDIA_FOUND',
  BACKGROUND_LOAD_FAILED = 'BACKGROUND_LOAD_FAILED',
  STRATEGY_FAILED = 'STRATEGY_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 결과 타입 (성공/실패 래퍼)
 */
export type Result<T, E = ExtractionError> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: E };

/**
 * 전략 기본 인터페이스
 */
export interface ExtractionStrategy<T> {
  readonly name: string;
  readonly priority: number;
  canHandle(context: ExtractionContext): boolean;
  extract(context: ExtractionContext): Promise<Result<T>>;
}

/**
 * URL 추출 전략 인터페이스
 */
export interface TweetUrlExtractionStrategy extends ExtractionStrategy<TweetUrl> {
  extractTweetUrl(context: ExtractionContext): Promise<Result<TweetUrl>>;
}

/**
 * 백그라운드 로더 인터페이스
 */
export interface BackgroundTweetLoader {
  loadTweetData(url: TweetUrl): Promise<Result<TweetData>>;
  loadMediaFromTweet(tweetData: TweetData): Promise<Result<MediaInfo[]>>;
}

/**
 * 트윗 데이터
 */
export interface TweetData {
  readonly tweetId: string;
  readonly userId: string;
  readonly document: Document;
  readonly mediaElements: HTMLElement[];
  readonly timestamp: number;
}

/**
 * 미디어 추출 오케스트레이터 인터페이스
 */
export interface MediaExtractionOrchestrator {
  extractMedia(context: ExtractionContext): Promise<ExtractionResult>;
}

// Re-export from constants for consistency
export { DEFAULT_EXTRACTION_OPTIONS } from '../../../../constants';
