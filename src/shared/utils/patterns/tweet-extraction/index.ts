/**
 * @fileoverview Tweet Extraction Module Exports
 * @description 트윗 추출 모듈의 중앙집중식 export
 */

// 새로운 서비스와 타입들
export { TweetExtractionService, getTweetExtractionService } from './TweetExtractionService';
export { generateSyntheticTweetInfo, isValidTweetInfo } from './types';
export type { TweetExtractionStrategy, TweetInfo } from './types';

// 전략 클래스들
export { ClickedElementStrategy } from './ClickedElementStrategy';
export { DataAttributesStrategy } from './DataAttributesStrategy';
export { StatusLinksStrategy } from './StatusLinksStrategy';

// 호환성을 위한 레거시 export
export { extractTweetInfoUnified } from './TweetExtractionService';
