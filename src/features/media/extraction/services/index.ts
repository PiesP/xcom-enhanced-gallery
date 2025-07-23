/**
 * @fileoverview Media Extraction Services
 * @version 2.1.0 - Media Services 통합
 * @description 미디어 추출 서비스들의 통합 export (Core Services로 리다이렉트)
 */

// 핵심 추출 서비스들 (Core에서 가져오기)
export { MediaExtractionService } from '@core/services/media-extraction/MediaExtractionService';
export { DOMDirectExtractor } from '@core/services/media-extraction/extractors/DOMDirectExtractor';
export { TweetInfoExtractor } from '@core/services/media-extraction/extractors/TweetInfoExtractor';
export { TwitterAPIExtractor } from '@core/services/media-extraction/extractors/TwitterAPIExtractor';

// 통합된 미디어 서비스들 (Core로 이동됨)
export {
  FallbackExtractor,
  TwitterAPI,
  isVideoThumbnail,
  isVideoPlayer,
  isVideoElement,
  extractTweetId,
  getTweetIdFromContainer,
  getVideoMediaEntry,
  getVideoUrlFromThumbnail,
  type TweetMediaEntry,
} from '@core/services/media';
