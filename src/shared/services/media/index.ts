/**
 * @fileoverview Media Services - 미디어 관련 서비스들
 * @version 1.1.0 - Media Services 통합
 */

// Core Media Services
export { VideoControlService } from './video-control-service';
export { UsernameParser, extractUsername, parseUsernameFast } from './username-extraction-service';

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
} from './twitter-video-extractor';

// Re-export types
export type { UsernameExtractionResult } from './username-extraction-service';
