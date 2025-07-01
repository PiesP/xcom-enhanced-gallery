/**
 * @fileoverview 트윗 추출 관련 통합 진입점
 * @version 2.0.0 - Unified Architecture
 */

// 메인 통합 추출기 (권장)
export { UnifiedTweetIdExtractor, type TweetExtractionResult } from './UnifiedTweetIdExtractor';

// 호환성을 위한 래퍼 함수들
export {
  extractTweetInfoUnified,
  convertToLegacyTweetInfo,
  extractSimpleTweetInfo,
} from './compat';

// 전략 서비스 (내부 사용)
export { TweetExtractionService, getTweetExtractionService } from './TweetExtractionService';

// 타입 정의
export type { TweetInfo, TweetExtractionStrategy } from './types';
export { isValidTweetInfo, generateSyntheticTweetInfo } from './types';

// 전략 클래스들 (내부 사용)
export { ClickedElementStrategy } from './ClickedElementStrategy';
export { DataAttributesStrategy } from './DataAttributesStrategy';
export { StatusLinksStrategy } from './StatusLinksStrategy';
