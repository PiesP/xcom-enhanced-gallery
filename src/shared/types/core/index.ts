/**
 * Core Types Export
 *
 * Phase 4: 타입 통합 최종 완료 - 중복 제거 및 단순화
 */

// Primary consolidated core types
export * from './core-types';

// Essential business types
export * from './media.types';

// Extraction types (selective export to avoid conflicts)
export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
} from './extraction.types';

// Re-export MediaExtractionResult from media.types to avoid conflicts
export type { MediaExtractionResult } from './media.types';

// Extraction enums and classes
export { ExtractionErrorCode, ExtractionError } from './extraction.types';

// Infrastructure types
export * from './userscript.d';
