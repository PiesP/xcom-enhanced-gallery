/**
 * Core Types Export
 *
 * Phase 195: 타입 통합 최종 완료 - media.types.ts를 root로 이동
 *
 * 재구조화:
 * - media.types.ts (core/) → media.types.ts (root /@shared/types) ✓
 * - extraction.types.ts → re-export layer (backward compatibility)
 */

// Primary consolidated core types
export * from './core-types';

// Extraction types (re-export from root via extraction.types)
export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
  MediaExtractionResult,
} from './extraction.types';

// Extraction enums and classes
export { ExtractionError, ExtractionErrorCode } from './extraction.types';

// Infrastructure types
export * from './userscript.d';
