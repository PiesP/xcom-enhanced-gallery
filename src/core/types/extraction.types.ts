/**
 * @fileoverview 미디어 추출 시스템 핵심 타입 정의
 * @version 3.0.0 - Simplified Architecture
 */

import type { MediaInfo } from '@core/types/media.types';

// Re-export from core types to maintain compatibility
export {
  type MediaExtractionResult,
  type ExtractionContext,
  type ExtractionOptions,
  type ExtractionMetadata,
  type TweetUrl,
  PageType,
  ExtractionSource,
  ExtractionError,
  ExtractionErrorCode,
} from '@core/types/media.types';

// Re-export interfaces for backwards compatibility
export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
} from '@core/interfaces/extraction.interfaces';

/**
 * 제네릭 추출 전략 인터페이스
 */
export interface ExtractionStrategy<T> {
  canHandle(context: import('@core/types/media.types').ExtractionContext): boolean;
  extract(context: import('@core/types/media.types').ExtractionContext): Promise<T>;
}

/**
 * URL 추출 전략 인터페이스
 */
export interface TweetUrlExtractionStrategy
  extends ExtractionStrategy<import('@core/types/media.types').TweetUrl> {
  extractTweetUrl(
    context: import('@core/types/media.types').ExtractionContext
  ): Promise<import('@core/types/media.types').TweetUrl>;
}

/**
 * 백그라운드 로더 인터페이스
 */
export interface BackgroundTweetLoader {
  loadTweetData(url: import('@core/types/media.types').TweetUrl): Promise<TweetData>;
  loadMediaFromTweet(tweetData: TweetData): Promise<MediaInfo[]>;
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
  extractMedia(
    context: import('@core/types/media.types').ExtractionContext
  ): Promise<import('@core/types/media.types').MediaExtractionResult>;
}

// Re-export from constants for consistency
export { DEFAULT_EXTRACTION_OPTIONS } from '../../constants';
