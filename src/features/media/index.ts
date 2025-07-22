/**
 * @fileoverview Media Feature Exports
 * @version 2.0.0 - Phase 2B Clean Architecture Optimization
 * @description 미디어 처리 Feature 통합 및 최적화
 */

// 핵심 미디어 추출 기능
export { MediaExtractionService } from '@core/services/media-extraction/MediaExtractionService';

// 추출 전략들
export * from './extraction/strategies';

// 추출 서비스들
export * from './extraction/services';

// 미디어 서비스들
export * from './services';

// 미디어 코디네이터들
export * from './coordinators';

// 미디어 컴포넌트들 (사용 가능한 경우)
export * from './components';

// 타입들
export * from './extraction/types';

// 인터페이스들 (개별 선택적 export - 중복 방지)
export type {
  TweetInfo,
  MediaExtractionResult,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
} from './extraction/interfaces/extraction.interfaces';
