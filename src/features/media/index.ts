/**
 * @fileoverview Media Feature Exports - Simplified
 * @version 3.0.0 - Simplified Architecture
 * @description 미디어 처리 Feature - Core에서 재수출
 */

// 핵심 미디어 추출 기능 (Core에서 가져오기)
export { MediaExtractionService } from '@core/services/media-extraction/MediaExtractionService';

// 미디어 서비스들
export * from './services';

// 미디어 코디네이터들
export * from './coordinators';

// 미디어 컴포넌트들 (사용 가능한 경우)
export * from './components';

// 타입들과 인터페이스들은 Core에서 가져오기
export type {
  TweetInfo,
  MediaExtractionResult,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
} from '@core/interfaces/extraction.interfaces';
