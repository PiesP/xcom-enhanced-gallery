/**
 * Core Types Export
 *
 * Phase 1A: 타입 통합 완료 - 중복 제거 및 단순화
 * 모든 core 타입들이 core-types.ts로 통합되었습니다.
 */

// Primary consolidated core types (Phase 1 Step 1 - Complete)
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
export * from './lifecycle.types';
export * from './userscript.d';

// Complex domain types (selective exports to avoid conflicts)
export type { MediaEntity, createMediaEntity, toMediaInfo } from './media-entity.types';
