/**
 * @fileoverview Media Extraction Services
 * @version 2.0.0 - Phase 2B Optimization
 * @description 미디어 추출 서비스들의 통합 export
 */

// 핵심 추출 서비스들
export { MediaExtractionService } from './MediaExtractor';
export { FallbackExtractor } from './FallbackExtractor';
export { DOMDirectExtractor } from './DOMDirectExtractor';
export { TweetInfoExtractor } from './TweetInfoExtractor';
export { TwitterAPIExtractor } from './TwitterAPIExtractor';

// Twitter Video Extractor의 유틸리티들
export {
  TwitterAPI,
  isVideoThumbnail,
  isVideoPlayer,
  isVideoElement,
  extractTweetId,
  getTweetIdFromContainer,
  getVideoMediaEntry,
  getVideoUrlFromThumbnail,
  type TweetMediaEntry,
} from './TwitterVideoExtractor';
