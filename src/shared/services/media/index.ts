/**
 * Media Services Layer
 *
 * @fileoverview Central hub for media processing and video control services.
 *
 * **Responsibilities**:
 * - Twitter API integration for media extraction
 * - Media sorting and visual ordering
 * - Username extraction from DOM and URLs
 * - Type definitions for Twitter API responses
 *
 * **Core Services**:
 * - **TwitterAPI**: Fetches media from Twitter/X.com API with guest token authentication
 * - **UsernameParser**: Extracts Twitter usernames from DOM, URLs, and metadata
 * - **ScrollBehaviorConfigurator**: Normalizes scroll options with accessibility support
 *
 * **Architecture Integration** (Phase 309 Service Layer):
 * - Stateless utilities for media processing (sortMediaByVisualOrder, isVideoThumbnail)
 * - Type-safe API responses with Twitter types
 *
 * **Performance**:
 * - Media sorting: O(n log n) by visual index (1ms for typical tweets)
 * - Username extraction: O(1) cache-first DOM queries, fallback to URL/meta
 * - Twitter API: Request caching (16-entry LRU cache)
 * - Video control: O(1) state tracking, WeakMap for memory safety
 *
 * **Accessibility**:
 * - Respects prefers-reduced-motion for video animations
 * - Semantic HTML selectors for username extraction
 * - ARIA-aware video player detection
 *
 * **Usage**:
 * ```typescript
 * // Video control
 * // Twitter API
 * const medias = await TwitterAPI.getMediaFromTweet('123456789');
 *
 * // Media sorting
 * const sorted = sortMediaByVisualOrder(unsorted);
 *
 * // Username extraction
 * const parser = new UsernameParser();
 * const result = parser.extractUsername();
 * ```
 */

// Core Media Services
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

/**
 * Media Services Exports Summary
 *
 * **TwitterAPI**: Fetches media items from Twitter API
 * - Guest token authentication (no user login required)
 * - Request caching for performance (16-entry LRU)
 * - Support for photo, video, and animated_gif media
 *
 * **UsernameParser**: Extracts Twitter usernames
 * - DOM extraction (profile pages, article elements)
 * - URL extraction (/username patterns)
 * - Meta tag fallback (og:url, twitter:creator)
 * - Confidence scoring for extraction reliability
 *
 * **Media Utilities**:
 * - sortMediaByVisualOrder(): Correct Twitter API media ordering
 * - isVideoThumbnail(), isVideoPlayer(), isVideoElement(): Media type detection
 * - extractTweetId(), getTweetIdFromContainer(): Tweet ID extraction
 *
 * **Types**:
 * - TwitterAPIResponse, TwitterTweet, TwitterUser, TwitterMedia
 * - TweetMediaEntry: Unified media representation
 * - UsernameExtractionResult: Extraction status with confidence
 */
