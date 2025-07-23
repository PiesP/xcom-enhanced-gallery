/**
 * @fileoverview Media Feature Exports
 * @version 2.1.0 - Media Services 통합
 * @description 미디어 처리 Feature 통합 및 최적화
 */

// 핵심 미디어 추출 기능
export { MediaExtractionService } from '@core/services/media-extraction/MediaExtractionService';

// 타입들
export * from './extraction/types';

// 인터페이스들 (Core Types로 리다이렉트)
export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
} from '@core/types/extraction.types';

export type { MediaExtractionResult } from '@core/types/media.types';
