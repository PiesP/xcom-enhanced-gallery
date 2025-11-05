/**
 * @fileoverview 추출 관련 타입 정의 (Re-export layer)
 * @description 모든 추출 관련 타입을 @shared/types/media.types에서 re-export
 * @version 3.1.0 - Phase 353: ExtractionErrorCode deprecated alias 제거
 *
 * 이 파일은 backward compatibility를 위해 유지되며,
 * 실제 타입 정의는 @shared/types/media.types에 위치합니다.
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
// ExtractionErrorCode는 Phase 195에서 ErrorCode로 통합되어 제거됨
