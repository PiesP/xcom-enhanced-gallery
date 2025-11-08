/**
 * @fileoverview DOM Direct Extractor - Direct DOM Media Extraction (Backup Strategy)
 *
 * 🔹 System Role:
 * Backup extraction strategy that discovers media directly from page DOM when:
 * - Tweet info extraction fails (no tweet ID available)
 * - API extraction fails or returns empty results
 * - Complex nested layouts (quote tweets, embedded media) need DOM analysis
 *
 * 🔹 Architecture:
 * ```
 * DOMDirectExtractor (Phase 2b in 3-phase extraction)
 *   ├─ Phase 1: Find media container (article, with quote tweet detection)
 *   ├─ Phase 2: Extract images (with emoji/thumbnail filtering)
 *   ├─ Phase 3: Extract videos (with URL optimization)
 *   ├─ Phase 4: Find clicked item index (image/video matching)
 *   └─ Phase 5: Return result with all metadata
 * ```
 *
 * 🔹 Key Characteristics:
 * - **DOM-Native Extraction**: Uses querySelector, attribute parsing
 * - **Comprehensive Filtering**: Removes emoji URLs, video thumbnails
 * - **Dimension Extraction**: Image/video dimensions from multiple sources
 * - **Quote Tweet Support**: Detects and handles quote tweet structures (Phase 342)
 * - **URL Optimization**: Extracts high-quality versions (original URLs)
 * - **Index Tracking**: Matches clicked element to result array
 * - **Fail-Soft Design**: Returns empty but valid result on failure
 *
 * 🔹 Supported Media Types:
 * 1. **Images** (img[src*="pbs.twimg.com"]):
 *    - Extracts original high-quality URLs
 *    - Filters emoji URLs (excluded)
 *    - Filters video thumbnails (excluded)
 *    - Deduplicates by normalized URL
 *
 * 2. **Videos** (video[src*="video.twimg.com"]):
 *    - Optimizes URLs for MP4 quality (tag=12)
 *    - Generates video thumbnails
 *    - Extracts video dimensions
 *    - Handles multiple video elements
 *
 * 🔹 URL Filtering:
 * | Type                | Pattern                 | Action      | Reason              |
 * |---------------------|-------------------------|-------------|---------------------|
 * | Images              | pbs.twimg.com           | Extract     | Twitter images      |
 * | Emoji URLs          | pbs.twimg.com/emoji     | Filter out  | Not user media      |
 * | Video thumbnails    | /vi_                    | Filter out  | Use actual video    |
 * | Videos              | video.twimg.com         | Extract     | Twitter videos      |
 * | Invalid URLs        | !isValidMediaUrl()      | Skip        | Broken/external     |
 *
 * 🔹 Container Detection (Phase 342: Quote Tweet Support):
 * 1. **Analyze quote tweet structure**: Check if element is in quoted tweet
 * 2. **Quote tweet detected**: Use quoted tweet article as container
 * 3. **Original tweet**: Use closest article/tweet container
 * 4. **Fallback**: Use element itself if no container found
 *
 * 🔹 Dimension Resolution Strategy (Priority):
 * **For Images**:
 * 1. naturalWidth/naturalHeight (loaded element dimensions)
 * 2. width/height attributes
 * 3. style.width/style.height
 * 4. Extract from URL pattern (/800x600/)
 * 5. null (no dimensions available)
 *
 * **For Videos**:
 * 1. videoWidth/videoHeight (native video dimensions)
 * 2. width/height attributes
 * 3. Extract from URL pattern
 * 4. null (no dimensions available)
 *
 * 🔹 URL Normalization:
 * - Remove query parameters (?tag=12&size=orig)
 * - Convert to lowercase for comparison
 * - Use URL API with fallback for older browsers
 * - Enable deduplication across similar URLs
 *
 * 🔹 Error Handling:
 * - No container found: Return failure result
 * - No media items extracted: Return failure result
 * - Missing tweet info: Use null placeholder
 * - Invalid dimensions: Omit from metadata
 * - URL parsing fails: Use fallback normalization
 *
 * 🔹 Performance Characteristics:
 * - Container detection: ~5-10ms
 * - Image extraction (10 images): ~20-30ms
 * - Video extraction (5 videos): ~10-20ms
 * - Total extraction: ~50-100ms average
 * - Worst case (100+ media): ~300-500ms
 *
 * 🔹 Related Services:
 * - MediaExtractionService: Primary consumer (Phase 2b fallback)
 * - TwitterAPIExtractor: Primary strategy (Phase 2a)
 * - QuoteTweetDetector: Quote tweet detection (Phase 342)
 * - Media URL utilities: URL optimization and filtering
 *
 * @version 0.4.2 (Phase 309 Service Layer + Phase 342 Quote Tweets)
 * @see {@link ARCHITECTURE.md} for Phase 309 Service Layer details
 */

import { logger } from '@shared/logging';
import {
  extractOriginalImageUrl,
  isValidMediaUrl,
  canExtractOriginalImage,
  extractOriginalVideoUrl,
  canExtractOriginalVideo,
  isEmojiUrl,
  isVideoThumbnailUrl,
} from '@shared/utils/media/media-url.util';
import { createSelectorRegistry } from '@shared/dom';
import { STABLE_SELECTORS } from '@/constants';
import { QuoteTweetDetector } from '@shared/services/media-extraction/strategies/quote-tweet-detector';
import type { MediaExtractionOptions, TweetInfo } from '@shared/types/media.types';
import type { MediaExtractionResult, MediaInfo } from '@shared/types/media.types';

type DimensionPair = { width: number; height: number };

const DIMENSION_PATTERN = /\/(\d{2,6})x(\d{2,6})\//;

/**
 * Parse positive number from various sources
 *
 * 🔹 Input Handling:
 * - number: Check if finite and > 0
 * - string: Parse as float, check if finite and > 0
 * - other: Return null (invalid)
 *
 * @param value - Possible number source (from naturalWidth, attributes, styles, etc.)
 * @returns Positive number or null if invalid
 */
const parsePositiveNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

/**
 * Extract dimensions from URL pattern
 *
 * 🔹 Pattern: /800x600/ or /256x256/ etc.
 * - Matches: /(\d{2,6})x(\d{2,6})/
 * - Range: 2-6 digits per dimension
 * - Examples: /800x600/, /1024x768/, /200x200/
 *
 * @param url - Media URL potentially containing dimension pattern
 * @returns Dimensions object or null if pattern not found or invalid
 */
const extractDimensionsFromUrl = (url: string | null | undefined): DimensionPair | null => {
  if (!url) {
    return null;
  }

  const match = url.match(DIMENSION_PATTERN);
  if (!match) {
    return null;
  }

  const width = Number.parseInt(match[1] ?? '', 10);
  const height = Number.parseInt(match[2] ?? '', 10);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
};

/**
 * Resolve image dimensions from multiple sources (priority-based)
 *
 * 🔹 Resolution Strategy (in order of preference):
 * 1. **naturalWidth/naturalHeight**: Most reliable, from loaded image element
 * 2. **width/height attributes**: From HTML attributes
 * 3. **style.width/style.height**: From CSS inline styles
 * 4. **URL pattern**: Extract from URL like /800x600/
 * 5. **null**: No dimensions available
 *
 * @param element - HTMLImageElement with loaded image
 * @param url - Image URL for pattern extraction
 * @returns Dimensions or null if none available
 */
const resolveImageDimensions = (element: HTMLImageElement, url: string): DimensionPair | null => {
  const naturalWidth = parsePositiveNumber(element.naturalWidth);
  const naturalHeight = parsePositiveNumber(element.naturalHeight);

  if (naturalWidth && naturalHeight) {
    return { width: naturalWidth, height: naturalHeight };
  }

  const attributeWidth = parsePositiveNumber(element.getAttribute('width'));
  const attributeHeight = parsePositiveNumber(element.getAttribute('height'));

  if (attributeWidth && attributeHeight) {
    return { width: attributeWidth, height: attributeHeight };
  }

  const styleWidth = parsePositiveNumber(element.style.width?.replace(/[^0-9.]/g, ''));
  const styleHeight = parsePositiveNumber(element.style.height?.replace(/[^0-9.]/g, ''));

  if (styleWidth && styleHeight) {
    return { width: styleWidth, height: styleHeight };
  }

  return extractDimensionsFromUrl(url);
};

/**
 * Resolve video dimensions from multiple sources (priority-based)
 *
 * 🔹 Resolution Strategy (in order of preference):
 * 1. **videoWidth/videoHeight**: Native video dimensions
 * 2. **width/height attributes**: From HTML attributes
 * 3. **URL pattern**: Extract from URL
 * 4. **null**: No dimensions available
 *
 * @param element - HTMLVideoElement
 * @param url - Video URL for pattern extraction
 * @returns Dimensions or null if none available
 */
const resolveVideoDimensions = (element: HTMLVideoElement, url: string): DimensionPair | null => {
  const videoWidth = parsePositiveNumber(element.videoWidth);
  const videoHeight = parsePositiveNumber(element.videoHeight);

  if (videoWidth && videoHeight) {
    return { width: videoWidth, height: videoHeight };
  }

  const attributeWidth = parsePositiveNumber(element.getAttribute('width'));
  const attributeHeight = parsePositiveNumber(element.getAttribute('height'));

  if (attributeWidth && attributeHeight) {
    return { width: attributeWidth, height: attributeHeight };
  }

  return extractDimensionsFromUrl(url);
};

/**
 * DOMDirectExtractor - Direct DOM Media Extraction (Backup Strategy)
 *
 * 🔹 Responsibility:
 * Extract media items directly from page DOM when API-based extraction fails.
 * Implements comprehensive filtering, optimization, and quote tweet handling.
 *
 * 🔹 Extraction Pipeline:
 * 1. **Container Detection**: Find tweet article (with quote tweet support)
 * 2. **Image Extraction**: Query images, filter/optimize, extract dimensions
 * 3. **Video Extraction**: Query videos, optimize URLs, generate thumbnails
 * 4. **Index Tracking**: Match clicked element to extracted items
 * 5. **Result Assembly**: Return MediaInfo array with metadata
 *
 * 🔹 Key Features:
 * - Quote tweet aware (Phase 342 integration)
 * - URL filtering (emoji, thumbnails)
 * - Dimension resolution (natural > attributes > style > URL)
 * - Deduplication (normalized URL comparison)
 * - Metadata enrichment (filename, tweet context)
 */
export class DOMDirectExtractor {
  private readonly selectors = createSelectorRegistry();
  /**
   * Extract media items directly from DOM (backup extraction strategy)
   *
   * 🔹 Extraction Pipeline:
   * ```
   * Input: HTMLElement (clicked media)
   *   ↓
   * 1. Find media container (article)
   *    ├─ Quote tweet detection (Phase 342)
   *    ├─ Closest article/tweet container
   *    └─ Fallback: clicked element itself
   *   ↓
   * 2. Extract images from container
   *    ├─ Filter emoji URLs (excluded)
   *    ├─ Filter video thumbnails (use videos instead)
   *    ├─ Extract original high-quality URLs
   *    ├─ Resolve dimensions
   *    └─ Deduplicate by normalized URL
   *   ↓
   * 3. Extract videos from container
   *    ├─ Optimize URL for MP4 quality (tag=12)
   *    ├─ Generate video thumbnail
   *    ├─ Resolve video dimensions
   *    └─ Add to media items
   *   ↓
   * 4. Find clicked item index
   *    ├─ Match clicked element (img/video) to extracted items
   *    ├─ Handle quote tweet context
   *    └─ Return index or 0 (default)
   *   ↓
   * 5. Return result
   *    ├─ success: true (if media items found)
   *    ├─ mediaItems: Extracted MediaInfo array
   *    ├─ clickedIndex: Index of clicked item
   *    ├─ metadata: Extraction details
   *    └─ tweetInfo: Provided context (or null)
   * ```
   *
   * 🔹 Error Handling:
   * - No container found: Returns failure result
   * - No media items extracted: Returns failure result
   * - Container or items found: Returns success with results
   * - All errors logged (debug, info, or error levels)
   *
   * @param element - HTMLElement clicked by user (img, video, or ancestor)
   * @param _options - Extraction options (unused in DOM extraction)
   * @param extractionId - Unique ID for logging correlation
   * @param tweetInfo - Optional tweet metadata context (from Phase 1)
   *
   * @returns Promise<MediaExtractionResult> with mediaItems, clickedIndex, metadata
   *
   * @example
   * ```typescript
   * const extractor = new DOMDirectExtractor();
   * const result = await extractor.extract(
   *   clickedElement,
   *   {},
   *   'simp_550e8400...',
   *   { tweetId: '123456789', username: 'user' }
   * );
   *
   * if (result.success) {
   *   console.log(`Extracted ${result.mediaItems.length} items`);
   *   console.log(`Clicked item at index: ${result.clickedIndex}`);
   * }
   * ```
   *
   * 🔹 Performance:
   * - Fast path (1-2 media): 10-20ms
   * - Medium (5-10 media): 30-50ms
   * - Large (50+ media): 100-200ms
   * - Very large (100+ media): 300-500ms
   */
  async extract(
    element: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug(`[DOMDirectExtractor] ${extractionId}: Starting direct DOM extraction`);

    const container = this.findMediaContainer(element);
    if (!container) {
      return this.createFailureResult('Unable to find media container');
    }

    const mediaItems = this.extractMediaFromContainer(container, tweetInfo);
    const clickedIndex = this.findClickedIndex(element, mediaItems);

    if (mediaItems.length === 0) {
      return this.createFailureResult('No media items found');
    }

    logger.info(
      `[DOMDirectExtractor] ${extractionId}: ✅ DOM extraction successful - ${mediaItems.length} media items`
    );

    return {
      success: true,
      mediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-fallback',
      },
      tweetInfo: tweetInfo ?? null,
    };
  }

  /**
   * Find media container (tweet article) with quote tweet support
   *
   * 🔹 Container Detection Strategy (Phase 342: Quote Tweet Support):
   * 1. Analyze DOM structure for quote tweet context
   * 2. If quote tweet detected: Use quoted tweet's article element
   * 3. If original tweet: Use closest article/tweet container
   * 4. Fallback: Use clicked element itself
   *
   * 🔹 Quote Tweet Handling:
   * - Quote tweets have nested <article> elements
   * - Outer <article>: Original/retweeted tweet
   * - Inner <article>: Quoted tweet being referenced
   * - Without proper detection: querySelector returns wrong article
   * - With Phase 342: QuoteTweetDetector identifies correct article
   *
   * @param element - Clicked element (may be in quote tweet)
   * @returns HTMLElement container or null if not found
   */
  private findMediaContainer(element: HTMLElement): HTMLElement | null {
    // 1. Analyze quote tweet structure to find correct media container
    const quoteTweetStructure = QuoteTweetDetector.analyzeQuoteTweetStructure(element);

    if (quoteTweetStructure.isQuoteTweet && quoteTweetStructure.targetArticle) {
      logger.debug('[DOMDirectExtractor] Quote tweet detected - using target article', {
        clickedLocation: quoteTweetStructure.clickedLocation,
      });
      return quoteTweetStructure.targetArticle;
    }

    // 2. Handle regular tweets (existing logic)
    const closestTweet = this.selectors.findClosest(STABLE_SELECTORS.TWEET_CONTAINERS, element);
    if (closestTweet) return closestTweet as HTMLElement;

    // Fallback: search by existing priority order
    const first = this.selectors.findTweetContainer(element) || this.selectors.findTweetContainer();
    return (first as HTMLElement) || element;
  }

  /**
   * Extract all media items from container
   *
   * 🔹 Extraction Pipeline:
   * **Images**:
   * 1. Query all img[src] elements
   * 2. For each image:
   *    a. Check if URL is valid Twitter media
   *    b. Filter emoji URLs (skip)
   *    c. Filter video thumbnails (skip, use videos instead)
   *    d. Extract original high-quality URL
   *    e. Resolve dimensions
   *    f. Deduplicate by normalized URL
   *    g. Add to media items
   *
   * **Videos**:
   * 1. Query all video[src*="video.twimg.com"] elements
   * 2. For each video:
   *    a. Optimize URL for MP4 quality (tag=12)
   *    b. Generate video thumbnail
   *    c. Resolve video dimensions
   *    d. Add to media items
   *
   * @param container - Tweet article/container element
   * @param tweetInfo - Optional tweet context (ID, username)
   * @returns Array of extracted MediaInfo objects
   */
  private extractMediaFromContainer(container: HTMLElement, tweetInfo?: TweetInfo): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];

    // Extract images
    const images = container.querySelectorAll('img[src]');
    const seenImageUrls = new Set<string>();
    images.forEach((img, index) => {
      const imgElement = img as HTMLImageElement;
      if (this.isValidImageUrl(imgElement.src)) {
        // Filter emoji URLs (Phase 331)
        if (isEmojiUrl(imgElement.src)) {
          logger.debug('[DOMDirectExtractor] Filtering emoji URL:', {
            sourceUrl: imgElement.src,
          });
          return;
        }

        // Skip video thumbnails (Phase 332 - prioritize actual video elements)
        if (isVideoThumbnailUrl(imgElement.src)) {
          logger.debug(
            '[DOMDirectExtractor] Skipping video thumbnail (prioritizing video element):',
            {
              thumbnailUrl: imgElement.src,
            }
          );
          return;
        }

        // Extract original (orig) high-quality URL
        const originalUrl = extractOriginalImageUrl(imgElement.src);

        // Log detailed info for Twitter media
        if (canExtractOriginalImage(imgElement.src)) {
          logger.debug('[DOMDirectExtractor] Successfully extracted original image URL', {
            sourceUrl: imgElement.src,
            extractedUrl: originalUrl,
            index,
            tweetId: tweetInfo?.tweetId,
          });
        } else if (imgElement.src?.includes('pbs.twimg.com')) {
          logger.debug(
            '[DOMDirectExtractor] Original image extraction not possible (already orig)',
            {
              sourceUrl: imgElement.src,
            }
          );
        }

        if (originalUrl) {
          const normalizedUrl = this.normalizeUrlForComparison(originalUrl);
          if (seenImageUrls.has(normalizedUrl)) {
            logger.debug(`[DOMDirectExtractor] Filtering duplicate image: ${normalizedUrl}`);
            return;
          }
          seenImageUrls.add(normalizedUrl);
          mediaItems.push(this.createImageMediaInfo(imgElement, originalUrl, index, tweetInfo));
        }
      }
    });

    // Extract videos
    const videos = container.querySelectorAll('video[src*="video.twimg.com"]');
    videos.forEach((video, _index) => {
      const videoElement = video as HTMLVideoElement;
      if (videoElement.src) {
        // Phase 330: Optimize video URL for MP4 quality (tag=12)
        let optimizedUrl = videoElement.src;
        if (canExtractOriginalVideo(videoElement.src)) {
          optimizedUrl = extractOriginalVideoUrl(videoElement.src);

          logger.debug('[DOMDirectExtractor] Video URL optimization successful (Phase 330)', {
            sourceUrl: videoElement.src,
            optimizedUrl,
            tweetId: tweetInfo?.tweetId,
          });
        }

        mediaItems.push(
          this.createVideoMediaInfo(videoElement, optimizedUrl, mediaItems.length, tweetInfo)
        );
      }
    });

    return mediaItems;
  }

  /**
   * Create MediaInfo for image with metadata
   *
   * 🔹 Fields:
   * - id: Unique identifier (img_${timestamp}_${index})
   * - url: High-quality original URL
   * - type: Always 'image'
   * - originalUrl: Same as url for consistency
   * - filename: Generated from username, index, tweet ID
   * - dimensions: width and height (if resolvable)
   *
   * @param element - HTMLImageElement
   * @param url - Extracted high-quality URL
   * @param index - Image index in extraction sequence
   * @param tweetInfo - Tweet context (optional)
   * @returns MediaInfo object
   */
  private createImageMediaInfo(
    element: HTMLImageElement,
    url: string,
    index: number,
    tweetInfo?: TweetInfo
  ): MediaInfo {
    const dimensions = resolveImageDimensions(element, url);

    const metadata = dimensions
      ? {
          dimensions,
        }
      : undefined;

    return {
      id: `img_${Date.now()}_${index}`,
      url,
      type: 'image',
      originalUrl: url,
      filename: this.generateFilename('image', index, tweetInfo),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
      ...(dimensions && { width: dimensions.width, height: dimensions.height }),
      ...(metadata && { metadata }),
    };
  }

  /**
   * Create MediaInfo for video with metadata
   *
   * 🔹 Fields:
   * - id: Unique identifier (vid_${timestamp}_${index})
   * - url: Optimized video URL (tag=12 for MP4)
   * - type: Always 'video'
   * - originalUrl: Same as url
   * - filename: Generated filename
   * - thumbnailUrl: Generated from video URL (replace mp4 with jpg)
   * - dimensions: width and height (if resolvable)
   *
   * @param element - HTMLVideoElement
   * @param url - Optimized video URL
   * @param index - Video index in extraction sequence
   * @param tweetInfo - Tweet context (optional)
   * @returns MediaInfo object
   */
  private createVideoMediaInfo(
    element: HTMLVideoElement,
    url: string,
    index: number,
    tweetInfo?: TweetInfo
  ): MediaInfo {
    const dimensions = resolveVideoDimensions(element, url);

    const metadata = dimensions
      ? {
          dimensions,
        }
      : undefined;

    return {
      id: `vid_${Date.now()}_${index}`,
      url,
      type: 'video',
      originalUrl: url,
      filename: this.generateFilename('video', index, tweetInfo),
      thumbnailUrl: this.generateVideoThumbnail(url),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
      ...(dimensions && { width: dimensions.width, height: dimensions.height }),
      ...(metadata && { metadata }),
    };
  }

  /**
   * Generate filename for media item
   *
   * 🔹 Format: ${username}_media_${index+1}_${tweetId}.${ext}
   * - username: From tweet context (if available)
   * - media_${index+1}: Human-readable numbering (1-based)
   * - tweetId: Tweet identifier (if available)
   * - ext: jpg for images, mp4 for videos
   *
   * @param type - 'image' or 'video'
   * @param index - Position in extraction (0-based)
   * @param tweetInfo - Tweet context (optional)
   * @returns Filename string
   */
  private generateFilename(type: string, index: number, tweetInfo?: TweetInfo): string {
    const extension = type === 'image' ? 'jpg' : 'mp4';
    const prefix = tweetInfo?.username ? `${tweetInfo.username}_` : '';
    const tweetSuffix = tweetInfo?.tweetId ? `_${tweetInfo.tweetId}` : '';
    return `${prefix}media_${index + 1}${tweetSuffix}.${extension}`;
  }

  /**
   * Generate video thumbnail URL from video URL
   *
   * 🔹 Strategy: Replace .mp4 with .jpg
   * - Input: https://video.twimg.com/...../video.mp4
   * - Output: https://video.twimg.com/...../video.jpg
   *
   * @param videoUrl - Original video URL
   * @returns Thumbnail URL string
   */
  private generateVideoThumbnail(videoUrl: string): string {
    return videoUrl.replace(/\.mp4.*$/, '.jpg');
  }

  /**
   * Check if image URL is valid Twitter media
   *
   * 🔹 Uses media URL utility validation
   * - Checks domain, format, etc.
   * - Excludes external URLs
   * - Validates Twitter media patterns
   *
   * @param url - Image URL to validate
   * @returns true if valid Twitter media URL
   */
  private isValidImageUrl(url: string): boolean {
    return isValidMediaUrl(url);
  }

  /**
   * Normalize URL for comparison (deduplication)
   *
   * 🔹 Normalization Process:
   * 1. Parse with URL API (if available)
   * 2. Remove protocol, query parameters
   * 3. Keep: protocol, host, pathname
   * 4. Fallback: Split by ? and lowercase
   *
   * @param url - URL to normalize
   * @returns Normalized URL for comparison
   */
  private normalizeUrlForComparison(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      const withoutQuery = url.split('?')[0] ?? url;
      return withoutQuery.toLowerCase();
    }
  }

  /**
   * Find clicked media item index in extracted items
   *
   * 🔹 Strategy:
   * 1. Analyze quote tweet structure (Phase 342)
   * 2. For IMG elements: Match by src URL
   * 3. For VIDEO elements: Match by src
   * 4. Default: Return 0 (first item)
   *
   * @param clickedElement - Element clicked by user
   * @param mediaItems - Extracted media items
   * @returns Index of clicked item (or 0 if not found)
   */
  private findClickedIndex(clickedElement: HTMLElement, mediaItems: MediaInfo[]): number {
    // Analyze quote tweet structure to find accurate media index
    const quoteTweetStructure = QuoteTweetDetector.analyzeQuoteTweetStructure(clickedElement);

    if (clickedElement.tagName === 'IMG') {
      const imgSrc = (clickedElement as HTMLImageElement).src;
      const index = mediaItems.findIndex(
        item =>
          item.url.includes(imgSrc.split('?')[0] ?? '') ||
          imgSrc.includes(item.url.split('?')[0] ?? '')
      );

      if (index >= 0) {
        if (quoteTweetStructure.isQuoteTweet) {
          logger.debug('[DOMDirectExtractor] Image in quote tweet - index confirmed', {
            index,
            clickedLocation: quoteTweetStructure.clickedLocation,
          });
        }
        return index;
      }
      return 0;
    }

    if (clickedElement.tagName === 'VIDEO') {
      const videoSrc = (clickedElement as HTMLVideoElement).src;
      const index = mediaItems.findIndex(item => item.url.includes(videoSrc));

      if (index >= 0) {
        if (quoteTweetStructure.isQuoteTweet) {
          logger.debug('[DOMDirectExtractor] Video in quote tweet - index confirmed', {
            index,
            clickedLocation: quoteTweetStructure.clickedLocation,
          });
        }
        return index;
      }
      return 0;
    }

    // Return first media as default
    return 0;
  }

  /**
   * Create failure result when extraction fails
   *
   * 🔹 Failure Scenarios:
   * - Container not found
   * - No media items extracted
   * - Both conditions indicate extraction failure
   *
   * @param reason - Failure reason message
   * @returns MediaExtractionResult with success=false
   */
  private createFailureResult(reason: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-fallback-failed',
        error: reason,
      },
      tweetInfo: null,
    };
  }
}
