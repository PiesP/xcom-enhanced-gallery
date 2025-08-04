/**
 * @fileoverview Media Services - 미디어 관련 서비스들
 * @version 1.1.0 - Media Services 통합
 */

// Core Media Services (VideoControlService는 MediaService로 통합됨)
export { UsernameParser, extractUsername, parseUsernameFast } from './UsernameExtractionService';

// Media Extraction Services
export { FallbackExtractor } from './FallbackExtractor';

// Twitter Video Extractor Utilities
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

// Re-export types
export type { UsernameExtractionResult } from './UsernameExtractionService';
