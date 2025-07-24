/**
 * Core Types Export
 *
 * Phase 2.1: 타입 통합 완료 - 적게 사용되는 타입들을 core-types.ts로 통합
 * lifecycle.types.ts와 result.ts가 core-types.ts로 통합되었습니다.
 */

// Primary consolidated core types (Phase 2.1 - lifecycle, result 통합 완료)
export * from './core-types';

// Essential business types
export * from './media.types';

// Extraction types (Phase 2 - Added - selective export to avoid conflicts)
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

// Complex domain types (selective exports to avoid conflicts)
export type { MediaEntity, createMediaEntity, toMediaInfo } from './media-entity.types';
