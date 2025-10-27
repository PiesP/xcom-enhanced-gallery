/**
 * @fileoverview Core Types - Infrastructure layer 타입 export
 * @version 3.0.0 - Phase 197: 구조 명확화
 *
 * **역할**:
 * - 핵심 도메인 타입 (Result, BaseService 등)
 * - 미디어 추출 타입 (backward compatibility)
 * - UserScript API 타입 정의
 *
 * **다른 import 경로**:
 * - `@shared/types`: 전체 타입 (권장)
 * - `@shared/types/media.types`: 미디어 타입만
 * - `@shared/types/result.types`: Result 패턴만
 */

// 핵심 도메인 타입들
export * from './core-types';

// UserScript API 타입들
export * from './userscript.d';

// Backward compatibility: extraction types (실제는 media.types에 정의됨)
export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
  MediaExtractionResult,
} from './extraction.types';

export { ExtractionError, ExtractionErrorCode } from './extraction.types';
