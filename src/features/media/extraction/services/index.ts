/**
 * @fileoverview Media Extraction Services
 * @version 2.0.0 - Phase 2B Optimization
 * @description 미디어 추출 서비스들의 통합 export (Core Services로 리다이렉트)
 */

// 핵심 추출 서비스들 (Core에서 가져오기)
export { MediaExtractionService } from '@core/services/media-extraction/MediaExtractionService';
export { DOMDirectExtractor } from '@core/services/media-extraction/extractors/DOMDirectExtractor';
export { TweetInfoExtractor } from '@core/services/media-extraction/extractors/TweetInfoExtractor';
export { TwitterAPIExtractor } from '@core/services/media-extraction/extractors/TwitterAPIExtractor';

// 로컬 서비스들 (유지)
export { FallbackExtractor } from './FallbackExtractor';

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
