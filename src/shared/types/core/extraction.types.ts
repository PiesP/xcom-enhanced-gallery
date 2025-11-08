/**
 * @fileoverview Extraction-related type definitions (Re-export layer)
 * @description All extraction-related types are re-exported from @shared/types/media.types
 * @version 3.1.0 - Phase 353: ExtractionErrorCode deprecated alias removed
 *
 * This file is maintained for backward compatibility,
 * with actual type definitions located in @shared/types/media.types.
 */

// Re-export from root media.types
export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
  MediaExtractor,
  PageType,
  ExtractionSource,
  TweetUrl,
  ExtractionOptions,
  ExtractionMetadata,
  ExtractionContext,
  ExtractionConfidence,
} from '@shared/types/media.types';

export { ExtractionError } from '@shared/types/media.types';
// ExtractionErrorCode was integrated into ErrorCode in Phase 195 and removed
