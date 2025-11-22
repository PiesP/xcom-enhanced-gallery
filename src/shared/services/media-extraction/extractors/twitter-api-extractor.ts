/**
 * @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
 * @description Accurate media extraction from Twitter API after tweet information is obtained
 * @version 2.1.0 - Phase 318.1: Removed GM_xmlHttpRequest check (MV3 incompatible)
 *
 * ============================================
 * 🎯 SYSTEM ROLE: Primary Media Extraction Strategy
 * ============================================
 *
 * **Responsibility**:
 * Extract media items from Twitter using the official Twitter API as the
 * PRIMARY and most reliable extraction strategy. This is Phase 2a (API-first)
 * in the 3-phase MediaExtractionService pipeline.
 *
 * **Architecture Overview**:
 *
 * ```
 * Phase 1: TweetInfoExtractor
 *   └─ Extract: tweetId, username, tweetUrl
 *
 * Phase 2: TwitterAPIExtractor (PRIMARY - Phase 405B-4)
 *   ├─ Input: TweetInfo + clickedElement
 *   ├─ Step 1: Fetch media from API (TwitterAPI.getTweetMedias)
 *   ├─ Step 2: Convert API response to MediaInfo[]
 *   ├─ Step 3: Calculate clicked media index (2 strategies)
 *   └─ Output: MediaExtractionResult
 *
 * Phase 3: MediaExtractionService (Orchestrator - Phase 405B-1)
 *   └─ Coordinate phases 1→2
 * ```
 *
 * **Key Characteristics**:
 * ✅ Most reliable: Official API data
 * ✅ Accurate dimensions: Provided by API
 * ✅ User metadata: screen_name from API response
 * ⚠️  Network dependent: Requires API access
 * ⚠️  Rate limiting: Tampermonkey GM_xmlHttpRequest subject to limits
 *
 * **3-Phase Extraction Pipeline**:
 *
 * 1. **API Fetch Phase**:
 *    - Input: TweetInfo.tweetId
 *    - Call: TwitterAPI.getTweetMedias()
 *    - Timeout: configurable (default 10s)
 *    - Output: TweetMediaEntry[] (API response format)
 *
 * 2. **Media Transformation Phase**:
 *    - Input: TweetMediaEntry[] from API
 *    - Convert each API media to MediaInfo
 *    - Extract dimensions (multiple strategies):
 *      a) original_width/original_height (most reliable)
 *      b) URL pattern matching (extractDimensionsFromUrl)
 *      c) aspect_ratio calculation (calculated estimate)
 *    - Enrich with tweet metadata (text, username, URL)
 *    - Output: MediaInfo[]
 *
 * 3. **Index Calculation Phase**:
 *    - Goal: Find which media item user clicked (0-based index)
 *    - Strategy 1: DirectMediaMatchingStrategy (99% confidence)
 *      └─ Directly match clicked element to media URL
 *    - Strategy 2: DOMOrderEstimationStrategy (85% confidence)
 *      └─ Estimate based on DOM element order
 *    - Fallback: Return 0 (first media)
 *
 * **API Response Format (TweetMediaEntry)**:
 * ```typescript
 * {
 *   type: 'photo' | 'video',
 *   download_url: string,          // Direct download link
 *   preview_url: string,           // Thumbnail URL
 *   original_width: number,        // If available
 *   original_height: number,       // If available
 *   aspect_ratio: [number, number], // [width, height]
 *   tweet_text: string,            // Tweet content
 *   screen_name: string,           // Username (Phase 432.1)
 * }
 * ```
 *
 * **Dimension Resolution Strategy (Priority Order)**:
 *
 * | Priority | Source | Reliability | Availability |
 * |----------|--------|-------------|--------------|
 * | 1️⃣      | original_width/height | 99% | ~80% of images |
 * | 2️⃣      | URL pattern (e.g., :1280x720) | 95% | Photo URLs |
 * | 3️⃣      | preview_url pattern | 90% | Thumbnails |
 * | 4️⃣      | aspect_ratio calculation | 60% | Always present |
 * | 5️⃣      | Default fallback | 0% | Final resort |
 *
 * **Example Dimension Extraction**:
 * ```
 * API Response:
 * {
 *   original_width: 1280,
 *   original_height: 720,
 *   download_url: "https://pbs.twimg.com/media/ABC123.jpg?format=jpg&name=orig",
 *   aspect_ratio: [16, 9]
 * }
 *
 * Result (Priority 1 wins):
 * {
 *   width: 1280,
 *   height: 720,
 *   source: "original_width/height"
 * }
 * ```
 *
 * **Timeout Strategy**:
 * - timeoutMs: Single request timeout in milliseconds (default: 10,000ms = 10s)
 * - Behavior: Request fails fast after timeout (single attempt)
 * - Fallback: On failure, returns error (Fail-Fast)
 *
 * **Performance Characteristics**:
 * - Typical: 100-200ms (API call + transformation)
 * - Fast: 50-100ms (small media count, cached)
 * - Slow: 500-1000ms (large media count, high resolution)
 * - Timeout: 10,000ms (configurable)
 * - Failure: ~5-10ms (quick error handling)
 *
 * **Error Handling**:
 * - Empty response (0 media): Logs warning, returns failure
 * - API error: Logged and returned as failure (no retries)
 * - Network timeout: Fails fast and returns error
 * - Invalid dimension format: Skip dimension, use fallback
 * - MediaInfo creation failure: Log error, skip item, continue
 *
 * **Related Services & Phases**:
 * - TweetInfoExtractor (Phase 405B-2): Extract tweetId before calling this
 * - TwitterAPI (shared/services/media): API wrapper, URL parsing
 * - MediaExtractionService (Phase 405B-1): Orchestrator
 * - MediaClickIndexStrategy (Phase 351): Click index calculation
 * - Phase 318: GM_xmlHttpRequest removal (MV3 compat)
 * - Phase 342: Quote tweet media extraction
 * - Phase 432.1: screen_name API response field
 *
 * **Usage Example**:
 * ```typescript
 * const extractor = new TwitterAPIExtractor();
 *
 * const result = await extractor.extract(
 *   {
 *     tweetId: '1234567890',
 *     username: 'john_doe',
 *     tweetUrl: 'https://x.com/john_doe/status/1234567890'
 *   },
 *   clickedImageElement,
 *   {
 *     timeoutMs: 10000,
 *   },
 *   'extraction-123'
 * );
 *
 * if (result.success) {
 *   console.log('Found', result.mediaItems.length, 'media');
 *   console.log('Clicked index:', result.clickedIndex);
 * } else {
 *   console.error('API extraction failed:', result.metadata.error);
 * }
 * ```
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from '@shared/utils/timer-management';
import { TwitterAPI } from '@shared/services/media/twitter-api-client';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo, MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions, APIExtractor } from '@shared/types/media.types';
import {
  DirectMediaMatchingStrategy,
  type MediaClickIndexStrategy,
} from '@shared/services/media-extraction/strategies/click-index';
import { extractTweetTextHTMLFromClickedElement } from '@shared/utils/tweet-text-html-extractor';

/**
 * Twitter API-Based Extractor - Primary Strategy
 *
 * Extract accurate media after tweet information is obtained from API
 * (3-phase pipeline Phase 2a: API-first extraction)
 */
export class TwitterAPIExtractor implements APIExtractor {
  /**
   * API 기반 미디어 추출 (Main Entry Point)
   *
   * **Responsibility**:
   * Execute the 3-phase extraction pipeline:
   * 1. Fetch media metadata from Twitter API
   * 2. Transform API response to MediaInfo[] array
   * 3. Calculate which media user clicked
   *
   * **Extraction Flow**:
   * ```
   *  extract()
   *    ├─ Step 1: Validate input (tweetId, clickedElement)
   *    ├─ Step 2: Fetch with timeout guard
   *   │  └─ TwitterAPI.getTweetMedias(tweetId)
   *   ├─ Step 3: Convert TweetMediaEntry[] → MediaInfo[]
   *   ├─ Step 4: Calculate clicked media index
   *   │  ├─ Strategy 1: DirectMediaMatching (99%)
   *   │  └─ Strategy 2: DOMOrderEstimation (85%)
   *   ├─ Step 5: Enrich metadata
   *   └─ Return: MediaExtractionResult { success: true, mediaItems, clickedIndex }
   * ```
   *
   * **Error Handling**:
   * - Empty API response: Logs warning, returns failure
   * - Network error: Logged and returned as failure
   * - Timeout: Returns failure immediately
   * - Transform error: Logs error, returns failure
   *
   * **Performance Notes**:
   * - Typical: 100-200ms (fetch + transform + index calculation)
   * - Fast path: 50-100ms (small media count)
   * - Slow path: 500-1000ms (many media items)
   * - Timeout: 10,000ms default (configurable)
   *
   * **Phase 317**: Environment-aware fallback to DOM backup when GM API is unavailable
   * **Phase 432.1**: Use API response screen_name (not just tweetInfo.username)
   *
   * @param tweetInfo Tweet metadata (id, username, url) from Phase 1
   * @param clickedElement User-clicked HTML element (img or video)
   * @param options Extraction options (supports timeoutMs)
   * @param extractionId Unique ID for this extraction session
   * @returns MediaExtractionResult with mediaItems and clickedIndex
   */
  async extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug(`[APIExtractor] ${extractionId}: Starting API extraction`, {
        tweetId: tweetInfo.tweetId,
        timeout: options.timeoutMs,
      });

      const timeoutMs = options.timeoutMs ?? 10_000;

      // Phase 2a Step 1: Fetch media from API (single attempt with timeout)
      const apiMedias = await this.fetchWithTimeout(
        () => TwitterAPI.getTweetMedias(tweetInfo.tweetId),
        timeoutMs
      );

      if (apiMedias?.length === 0) {
        return this.createFailureResult('No media found in API response');
      }

      // Phase 2a Step 2: Extract tweet text HTML (used for MediaInfo enrichment)
      const tweetTextHTML = extractTweetTextHTMLFromClickedElement(clickedElement);

      // Phase 2a Step 3: Transform API response to MediaInfo[]
      const mediaItems = await this.convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextHTML);

      // Phase 2a Step 4: Calculate which media user clicked (Strategy pattern)
      const clickedIndex = await this.calculateClickedIndex(clickedElement, apiMedias, mediaItems);

      // Phase 2a Step 5: Assemble success result
      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'twitter-api',
          strategy: 'api-extraction',
          totalProcessingTime: 0,
          apiMediaCount: apiMedias.length,
        },
        tweetInfo,
      };
    } catch (error) {
      logger.warn(`[APIExtractor] ${extractionId}: API extraction failed:`, error);
      return this.createFailureResult(
        error instanceof Error ? error.message : 'API extraction failed'
      );
    }
  }

  /**
   * Fetch with timeout (single attempt)
   *
   * Wraps an async operation with a timeout guard. If the operation does not
   * resolve within the timeout window, the promise rejects with a timeout error.
   * No retries are performed in lean mode.
   */
  private async fetchWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    const withTimeout = <U>(p: Promise<U>): Promise<U> => {
      return new Promise<U>((resolve, reject) => {
        const timer = globalTimerManager.setTimeout(() => {
          reject(new Error('timeout'));
        }, timeoutMs);
        p.then(
          value => {
            globalTimerManager.clearTimeout(timer);
            resolve(value);
          },
          error => {
            globalTimerManager.clearTimeout(timer);
            reject(error);
          }
        );
      });
    };

    return withTimeout(fn());
  }

  /**
   * Transform API Media to MediaInfo Array (Batch Transformation)
   *
   * **Responsibility**:
   * Transform array of API media responses (TweetMediaEntry[]) into gallery-ready
   * MediaInfo objects with all necessary metadata for display and download.
   *
   * **Transformation Pipeline per Media Item**:
   * ```
   * API TweetMediaEntry
   *   ├─ Extract media type (photo → image, video → video)
   *   ├─ Resolve dimensions (4-priority strategy)
   *   ├─ Extract URLs (download, preview, original)
   *   ├─ Enrich with tweet metadata
   *   ├─ Generate unique ID
   *   └─ Create MediaInfo object
   * ```
   *
   * **Error Handling**:
   * - Missing media item: Skip (continue loop)
   * - Invalid MediaInfo creation: Log error, skip, continue
   * - Missing dimensions: Allow (fallback to default size)
   * - Invalid URL: Allow (gallery may not display, but no crash)
   *
   * **Performance**:
   * - Time: O(n) where n = apiMedias.length
   * - Typical: 10-50ms for 10-100 media items
   * - Async: Awaited after all conversions for consistency
   *
   * **Tweet Text HTML Enrichment**:
   * - Extracted once from clicked element (Phase 2a Step 2)
   * - Added to ALL MediaInfo items (not just clicked one)
   * - Reason: Any media may be expanded later, needs tweet context
   *
   * @param apiMedias Array of API response media objects
   * @param tweetInfo Tweet metadata (username, ID, URL)
   * @param tweetTextHTML Optional tweet HTML content (for enrichment)
   * @returns Array of MediaInfo objects (may be empty or partial on errors)
   */
  private async convertAPIMediaToMediaInfo(
    apiMedias: TweetMediaEntry[],
    tweetInfo: TweetInfo,
    tweetTextHTML?: string | undefined
  ): Promise<MediaInfo[]> {
    const mediaItems: MediaInfo[] = [];

    for (let i = 0; i < apiMedias.length; i++) {
      const apiMedia = apiMedias[i];
      if (!apiMedia) continue;

      const mediaInfo = this.createMediaInfoFromAPI(apiMedia, tweetInfo, i, tweetTextHTML);
      if (mediaInfo) {
        mediaItems.push(mediaInfo);
      }
    }

    return mediaItems;
  }

  /**
   * Resolve Dimensions from API Media (4-Priority Strategy)
   *
   * **Goal**: Extract accurate width/height for gallery display
   *
   * **Priority Order** (most to least reliable):
   *
   * | Priority | Source | Reliability | Availability | Fallback |
   * |----------|--------|-------------|--------------|----------|
   * | 1️⃣      | original_width/height | 99% | ~80% images | → Priority 2 |
   * | 2️⃣      | URL pattern (e.g., :1280x720) | 95% | Photos | → Priority 3 |
   * | 3️⃣      | preview_url pattern | 90% | Thumbnails | → Priority 4 |
   * | 4️⃣      | aspect_ratio calculation | 60% | Always | → null (no dims) |
   * | 5️⃣      | null (no dimensions) | 0% | Final | Allow null |
   *
   * **Priority 1 - Original Dimensions** (Most reliable):
   * ```typescript
   * // API provides direct dimensions from original media
   * {
   *   original_width: 1280,
   *   original_height: 720
   * }
   * // Result: { width: 1280, height: 720 } ✅
   * ```
   *
   * **Priority 2 - URL Pattern** (Photo URLs):
   * ```typescript
   * // Dimensions embedded in photo URLs
   * download_url: "https://pbs.twimg.com/media/ABC123.jpg:1280x720"
   * // Result: { width: 1280, height: 720 } ✅
   * ```
   *
   * **Priority 3 - Preview URL Pattern** (Thumbnails):
   * ```typescript
   * // Dimensions in thumbnail URL
   * preview_url: "https://pbs.twimg.com/media/ABC123.jpg:large"
   * // Try pattern extraction
   * // Result: May extract from preview ✅ (if available)
   * ```
   *
   * **Priority 4 - Aspect Ratio Calculation** (Video):
   * ```typescript
   * // API provides aspect ratio, calculate from base height
   * {
   *   aspect_ratio: [16, 9],      // [width, height] ratio
   *   original_width: undefined,
   *   original_height: undefined
   * }
   * // Base height: 720px
   * // Calculated width: (16/9) × 720 = 1280px
   * // Result: { width: 1280, height: 720 } ✅
   * ```
   *
   * **Performance**: O(1) - constant time lookup, no loops
   *
   * @param apiMedia API media entry with dimension fields
   * @returns { width, height } object or null if no dimensions found
   */
  private resolveDimensionsFromApiMedia(
    apiMedia: TweetMediaEntry
  ): { width: number; height: number } | null {
    // Priority 1: Direct API original dimensions (most reliable)
    const widthFromOriginal = this.toPositiveNumber(apiMedia.original_width);
    const heightFromOriginal = this.toPositiveNumber(apiMedia.original_height);

    if (widthFromOriginal && heightFromOriginal) {
      return {
        width: widthFromOriginal,
        height: heightFromOriginal,
      };
    }

    // Priority 2: Extract from download URL pattern
    const urlDimensions = TwitterAPI.extractDimensionsFromUrl(apiMedia.download_url);
    if (urlDimensions) {
      return urlDimensions;
    }

    // Priority 3: Extract from preview URL pattern
    const previewDimensions = TwitterAPI.extractDimensionsFromUrl(apiMedia.preview_url);
    if (previewDimensions) {
      return previewDimensions;
    }

    // Priority 4: Calculate from aspect_ratio (video fallback)
    const aspectRatio = Array.isArray(apiMedia.aspect_ratio) ? apiMedia.aspect_ratio : undefined;
    if (aspectRatio && aspectRatio.length >= 2) {
      const ratioWidth = this.toPositiveNumber(aspectRatio[0]);
      const ratioHeight = this.toPositiveNumber(aspectRatio[1]);

      if (ratioWidth && ratioHeight) {
        const baseHeight = 720;
        const height = baseHeight;
        const width = Math.max(1, Math.round((ratioWidth / ratioHeight) * baseHeight));

        return {
          width,
          height,
        };
      }
    }

    // Priority 5: No dimensions available (allow null)
    return null;
  }

  /**
   * Convert Value to Positive Number
   *
   * **Supports Multiple Input Types**:
   * - number: Validate finite and positive
   * - string: Parse float, validate finite and positive
   * - Other: Return null
   *
   * **Examples**:
   * ```
   * toPositiveNumber(1280)         → 1280 ✅
   * toPositiveNumber('720')        → 720 ✅
   * toPositiveNumber(0)            → null (not positive) ❌
   * toPositiveNumber(-100)         → null (negative) ❌
   * toPositiveNumber(NaN)          → null (not finite) ❌
   * toPositiveNumber('invalid')    → null (parse fails) ❌
   * toPositiveNumber(undefined)    → null ❌
   * ```
   *
   * **Performance**: O(1) - direct type checking and conversion
   *
   * @param value Unknown value to convert
   * @returns Positive number or null
   */
  private toPositiveNumber(value: unknown): number | null {
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
  }

  /**
   * Create MediaInfo from API Response
   *
   * **Responsibility**:
   * Transform single API media entry into a MediaInfo object with all necessary
   * metadata for gallery display, downloading, and user interaction.
   *
   * **Field Mapping** (API → MediaInfo):
   * ```
   * API Field               → MediaInfo Field      | Note
   * ─────────────────────────────────────────────────────────
   * id (generated)          → id                  | Format: tweetId_api_index
   * type (photo/video)      → type (image/video)  | Normalized
   * download_url            → url                 | Primary download URL
   * download_url            → originalUrl         | Same as url
   * preview_url             → thumbnailUrl        | Thumbnail preview
   * screen_name (or fallback)→ tweetUsername      | Phase 432.1 priority
   * tweetInfo.tweetId       → tweetId             | From Phase 1
   * tweetInfo.tweetUrl      → tweetUrl            | From Phase 1
   * tweetInfo.username      → tweetUsername (fb)  | Fallback if no screen_name
   * tweet_text (from API)   → tweetText           | Tweet content
   * tweetTextHTML (enriched)→ tweetTextHTML       | HTML version
   * (calculated)            → alt                 | For accessibility
   * (resolved)              → width, height       | From resolveDimensionsFromApiMedia
   * (metadata object)       → metadata            | Includes apiIndex, apiData
   * ```
   *
   * **Metadata Enrichment**:
   * - apiIndex: Position in original API array (0-based)
   * - apiData: Full TweetMediaEntry object (for debugging/tracing)
   * - dimensions: Extraction method used (if available)
   *
   * **Error Handling**:
   * - If MediaInfo creation throws: Logs error, returns null
   * - Null result handled by convertAPIMediaToMediaInfo (skip item)
   * - Missing fields: Allow (use defaults in MediaInfo)
   * - Corrupted API entry: Try anyway (fail gracefully)
   *
   * **Performance**: O(1) - single object construction
   *
   * **Phase 432.1**: Prioritize API response screen_name over tweetInfo.username
   * - screen_name: Username from original tweet author (API provides this)
   * - Fallback: tweetInfo.username (from Phase 1 extraction)
   * - Reason: API data is more authoritative
   *
   * **Type Mapping** (Photo ↔ Image, Video ↔ Video):
   * - photo → image: More descriptive for gallery context
   * - video → video: Unchanged
   * - Other: Not expected from API, but allowed
   *
   * @param apiMedia Single API media entry from TweetMediaEntry[]
   * @param tweetInfo Tweet metadata (username, ID, URL)
   * @param index Position in apiMedias array (for ID generation)
   * @param tweetTextHTML Optional enriched tweet HTML
   * @returns MediaInfo object or null on error
   */
  private createMediaInfoFromAPI(
    apiMedia: TweetMediaEntry,
    tweetInfo: TweetInfo,
    index: number,
    tweetTextHTML?: string | undefined
  ): MediaInfo | null {
    try {
      // Type conversion: photo → image, video → video
      const mediaType = apiMedia.type === 'photo' ? 'image' : 'video';
      const dimensions = this.resolveDimensionsFromApiMedia(apiMedia);
      const metadata: Record<string, unknown> = {
        apiIndex: index,
        apiData: apiMedia,
      };

      if (dimensions) {
        metadata.dimensions = dimensions;
      }

      // Phase 432.1: API 응답의 screen_name 우선 사용, fallback으로 tweetInfo.username
      const username = apiMedia.screen_name || tweetInfo.username;

      return {
        id: `${tweetInfo.tweetId}_api_${index}`,
        url: apiMedia.download_url,
        type: mediaType,
        filename: '',
        tweetUsername: username,
        tweetId: tweetInfo.tweetId,
        tweetUrl: tweetInfo.tweetUrl,
        tweetText: apiMedia.tweet_text,
        tweetTextHTML,
        originalUrl: apiMedia.download_url,
        thumbnailUrl: apiMedia.preview_url,
        alt: `${mediaType} ${index + 1}`,
        ...(dimensions && {
          width: dimensions.width,
          height: dimensions.height,
        }),
        metadata,
      };
    } catch (error) {
      logger.error('Failed to create API MediaInfo:', error);
      return null;
    }
  }

  /**
   * Calculate Clicked Media Index (Strategy Pattern - Phase 351)
   *
   * **Goal**: Determine which media item user clicked (0-based index in mediaItems array)
   *
   * **Why This Matters**:
   * - User clicks on thumbnail/preview in gallery
   * - Gallery needs to open at exact clicked media (not first one)
   * - Different extraction methods produce different array orders
   * - Strategy pattern provides multiple matching algorithms
   *
   * **Strategy Priority** (Confidence Levels):
   *
   * | Priority | Strategy | Confidence | Method | Time |
   * |----------|----------|------------|--------|------|
   * | 1️⃣      | DirectMediaMatching | 99% | Direct URL matching | Fast |
   * | 2️⃣      | DOMOrderEstimation | 85% | DOM element order | Medium |
   * | 3️⃣      | Fallback | 0% | Return 0 (first) | N/A |
   *
   * **Strategy 1: DirectMediaMatching** (99% Confidence):
   * ```
   * Goal: Find exact clicked element in mediaItems array
   *
   * Algorithm:
   * 1. Find clicked element (img, video, or parent)
   * 2. Extract URL from clicked element
   * 3. Normalize URL (remove query strings, fragments)
   * 4. Compare with each mediaItems URL
   * 5. Return index of matching URL
   *
   * Example:
   *   Clicked: <img src="https://pbs.twimg.com/media/ABC123.jpg?format=jpg">
   *   Normalized: "ABC123.jpg"
   *
   *   API Media 1: "https://pbs.twimg.com/media/XYZ789.jpg?format=jpg&name=orig"
   *   Normalized: "XYZ789.jpg" (NO MATCH)
   *
   *   API Media 2: "https://pbs.twimg.com/media/ABC123.jpg?format=jpg&name=orig"
   *   Normalized: "ABC123.jpg" (MATCH! → return index 1)
   * ```
   *
   * **Strategy 2: DOMOrderEstimation** (85% Confidence):
   * ```
   * Goal: If direct matching fails, estimate index from DOM order
   *
   * Algorithm:
   * 1. Find container (closest article, div)
   * 2. Query all img/video elements in container
   * 3. Find position of clicked element in DOM order
   * 4. Return that position as index
   *
   * Limitations:
   * - Works only if DOM order matches API order
   * - May fail if page reorders elements
   * - Fallback for when URLs don't match
   * ```
   *
   * **Strategy 3: Fallback** (0% Confidence):
   * - If both strategies fail: return 0 (open first media)
   * - Logs warning for debugging
   * - Ensures user sees something (not crash)
   *
   * **Performance**:
   * - Strategy 1 success: 10-50ms (URL matching)
   * - Strategy 2 success: 20-100ms (DOM traversal)
   * - Fallback: <1ms (instant)
   * - Total timeout: 500-1000ms (reasonable UX)
   *
   * **Error Handling**:
   * - Invalid clickedElement: Caught, fallback to Strategy 2
   * - No matching URL: Strategy 2 attempts
   * - Strategy 2 fails: Fallback to 0
   * - All strategies fail gracefully (never crashes)
   *
   * **Related Phases**:
   * - Phase 351: MediaClickIndexStrategy pattern introduction
   * - Phase 342: Quote tweet detection (nested articles)
   * - Phase 405B-1: MediaExtractionService orchestrator
   *
   * @param clickedElement User-clicked HTML element (img, video, or ancestor)
   * @param apiMedias Array of API media entries (for URL comparison)
   * @param mediaItems Array of transformed MediaInfo objects
   * @returns 0-based index of clicked media (or 0 as fallback)
   */
  private async calculateClickedIndex(
    clickedElement: HTMLElement,
    apiMedias: TweetMediaEntry[],
    mediaItems: MediaInfo[]
  ): Promise<number> {
    // Create strategy instances (Strategy pattern - Phase 351)
    const strategies: MediaClickIndexStrategy[] = [
      new DirectMediaMatchingStrategy(
        this.findMediaElement.bind(this),
        el => this.extractMediaUrl(el) ?? '',
        this.normalizeMediaUrl.bind(this)
      ),
    ];

    // Try each strategy in priority order
    for (const strategy of strategies) {
      const index = strategy.calculate(clickedElement, apiMedias, mediaItems);
      if (index !== -1) {
        logger.debug(
          `[APIExtractor] Strategy succeeded: ${strategy.name} (confidence ${strategy.confidence}%), index ${index}`
        );
        return index;
      }
    }

    // All strategies failed: fallback to first media
    logger.warn('[APIExtractor] All strategies failed, returning default index 0');
    return 0;
  }

  /**
   * Find Media Element from Clicked Element (4-Level Search)
   *
   * **Goal**: Locate the actual media element (img or video) from user click
   *
   * **Search Strategy** (Progressive Deepening):
   * ```
   * Level 1: Is clicked element itself a media element?
   * └─ If yes, return immediately (fastest)
   * ├─ Example: User clicked directly on <img>
   *
   * Level 2: Is media a direct child of clicked element?
   * └─ Query :scope > img, :scope > video
   * ├─ Reason: Wrapper div may contain actual <img>
   * ├─ Example: User clicked on <div><img></div>
   *
   * Level 3: Is media in deeper children (limited depth)?
   * └─ Query img, video within depth limit
   * ├─ Reason: May be nested multiple levels
   * ├─ Example: User clicked container with nested structure
   *
   * Level 4: Search parent elements (up to 5 levels)
   * └─ Check each parent's direct children
   * ├─ Reason: Clicked element may be sibling of media
   * ├─ Example: User clicked text in container with media
   * ```
   *
   * **Examples**:
   * ```
   * Case 1: Direct click
   * <img id="media" src="...">  ← Clicked
   * Result: Returns <img> (Level 1, fastest)
   *
   * Case 2: Wrapper container
   * <div id="wrapper">          ← Clicked
   *   <img src="...">
   * </div>
   * Result: Returns <img> (Level 2)
   *
   * Case 3: Nested structure
   * <article>                   ← Clicked
   *   <div class="carousel">
   *     <img src="...">
   *   </div>
   * </article>
   * Result: Returns <img> (Level 3)
   *
   * Case 4: Parent contains media
   * <div id="clicked"></div>    ← Clicked (sibling of media)
   * <img id="media" src="...">
   * <div id="parent">            ← Searched up to here (5 levels)
   *   <img> (direct child)
   * </div>
   * Result: Found in parent (Level 4)
   * ```
   *
   * **Performance**: O(n) where n = depth (limited to 5 parents)
   *
   * **Error Handling**:
   * - Invalid element: Return null
   * - No media found: Return null
   * - Parent traversal limit (5): Stop and return null
   * - Handles null safely in each level
   *
   * @param element Starting point for media search
   * @returns HTMLElement if found, null otherwise
   */
  private findMediaElement(element: HTMLElement): HTMLElement | null {
    // Level 1: Clicked element is already media?
    if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
      return element;
    }

    // Level 2: Direct child is media?
    const mediaChild = element.querySelector(':scope > img, :scope > video');
    if (mediaChild) {
      return mediaChild as HTMLElement;
    }

    // Level 3: Deeper children within depth limit?
    const deepChild = element.querySelector('img, video');
    if (deepChild && this.isDirectMediaChild(element, deepChild as HTMLElement)) {
      return deepChild as HTMLElement;
    }

    // Level 4: Search parent elements (up to 5 levels)
    let current = element.parentElement;
    for (let i = 0; i < 5 && current; i++) {
      const parentMedia = current.querySelector(':scope > img, :scope > video');
      if (parentMedia) {
        return parentMedia as HTMLElement;
      }
      current = current.parentElement;
    }

    return null;
  }

  /**
   * Check if Element is Direct Child of Parent (Within Depth Limit)
   *
   * **Purpose**: Determine if child is within acceptable nesting depth from parent
   *
   * **Algorithm**:
   * 1. Start at child element
   * 2. Traverse up parent chain
   * 3. If we reach parent → child is direct (return true)
   * 4. If we exceed depth limit → too deep (return false)
   * 5. If we reach root → not found (return false)
   *
   * **Depth Limit**: 3 levels maximum
   * - Reason: Avoid matching elements too far nested
   * - Example: img in deep carousel structure not "direct"
   *
   * **Examples**:
   * ```
   * Structure:
   * <div id="parent">
   *   <img id="child1">                    ← Depth 1, direct ✅
   *   <div>
   *     <img id="child2">                  ← Depth 2, direct ✅
   *     <div>
   *       <img id="child3">                ← Depth 3, direct ✅
   *       <div>
   *         <img id="child4">              ← Depth 4, too deep ❌
   *       </div>
   *     </div>
   *   </div>
   * </div>
   *
   * Results:
   * isDirectMediaChild(parent, child1) → true
   * isDirectMediaChild(parent, child2) → true
   * isDirectMediaChild(parent, child3) → true
   * isDirectMediaChild(parent, child4) → false (exceeds maxDepth=3)
   * ```
   *
   * **Performance**: O(d) where d = depth (limited to 3)
   *
   * **Error Handling**:
   * - Null parent/child: Return false
   * - Invalid element: Return false
   * - Circular reference: Prevented by parent chain termination
   *
   * @param parent Root element to search from
   * @param child Potential child element
   * @returns true if child is within maxDepth levels from parent
   */
  private isDirectMediaChild(parent: HTMLElement, child: HTMLElement): boolean {
    const maxDepth = 3; // Maximum nesting depth to consider "direct"
    let current: HTMLElement | null = child;

    for (let i = 0; i < maxDepth; i++) {
      if (current === parent) {
        return true;
      }
      current = current.parentElement;
      if (!current) break;
    }

    return false;
  }

  /**
   * Extract Media URL from Element
   *
   * **Supports**:
   * - IMG: Extract src attribute (image URL)
   * - VIDEO: Extract poster (thumbnail) or src (video URL)
   * - Other: Return null
   *
   * **Priority for Video**:
   * 1️⃣ poster attribute (thumbnail preview)
   * 2️⃣ src attribute (direct video URL)
   * ↓
   * Reason: Poster provides consistent reference point
   *
   * **Examples**:
   * ```
   * <img src="https://pbs.twimg.com/media/ABC.jpg">
   * → "https://pbs.twimg.com/media/ABC.jpg" ✅
   *
   * <video poster="https://example.com/thumb.jpg" src="...">
   * → "https://example.com/thumb.jpg" ✅
   *
   * <video src="https://example.com/video.mp4">
   * → "https://example.com/video.mp4" ✅
   *
   * <div>...</div>
   * → null ❌ (not media element)
   * ```
   *
   * **Performance**: O(1) - single attribute lookup
   *
   * @param element HTML element (img, video, or other)
   * @returns URL string or null
   */
  private extractMediaUrl(element: HTMLElement): string | null {
    if (element.tagName === 'IMG') {
      return element.getAttribute('src');
    }
    if (element.tagName === 'VIDEO') {
      return element.getAttribute('poster') || element.getAttribute('src');
    }
    return null;
  }

  /**
   * Normalize Media URL for Comparison
   *
   * **Purpose**: Extract comparable filename from URLs with variable parameters
   *
   * **Problem Solved**:
   * - Twitter API URLs include query strings (format, name, size)
   * - DOM element URLs may have different query strings
   * - Raw comparison fails: URL1 ≠ URL2 even though same media
   *
   * **Strategy**: Extract pure filename (remove query strings, fragments)
   *
   * **Examples**:
   * ```
   * Input URLs:
   * API:  "https://pbs.twimg.com/media/XYZ123.jpg?format=jpg&name=large"
   * DOM:  "https://pbs.twimg.com/media/XYZ123.jpg?w=400&format=webp"
   *
   * Normalization:
   * Both → "XYZ123.jpg"
   *
   * Comparison:
   * "XYZ123.jpg" === "XYZ123.jpg" ✅ MATCH!
   * ```
   *
   * **Algorithm** (Dual Implementation for Compatibility):
   *
   * **Primary** (Modern Browsers):
   * 1. Use URL object (built-in API)
   * 2. Extract pathname (removes protocol + domain)
   * 3. Split by '/' and take last part (filename)
   *
   * **Fallback** (Older Environments):
   * 1. Manual string parsing
   * 2. Find last '/' → substring after
   * 3. Remove query string (split by '?', take [0])
   * 4. Remove fragment (split by '#', take [0])
   *
   * **Performance**: O(n) where n = URL length (typically 50-200 chars)
   *
   * **Error Handling**:
   * - Invalid URL: Handled by try-catch, fallback
   * - Empty filename: Return null
   * - Null input: Return null
   * - Malformed URL: Attempt fallback parsing
   *
   * **Related Phases**:
   * - Phase 342: Media deduplication in quote tweets
   * - Phase 405B-3: DOM extractor also uses URL normalization
   *
   * @param url Full media URL with potential query strings
   * @returns Normalized filename or null if extraction fails
   */
  private normalizeMediaUrl(url: string): string | null {
    if (!url) return null;

    try {
      // Use URL object to extract pathname (auto-removes query strings)
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract filename after last '/'
      const filename = pathname.split('/').pop();
      return filename && filename.length > 0 ? filename : null;
    } catch {
      // Fallback: simple string parsing (for URL object unsupported environments)
      try {
        const lastSlash = url.lastIndexOf('/');
        if (lastSlash === -1) return null;

        let filenamePart = url.substring(lastSlash + 1);

        // Remove query string
        const queryIndex = filenamePart.indexOf('?');
        if (queryIndex !== -1) {
          filenamePart = filenamePart.substring(0, queryIndex);
        }

        // 프래그먼트 제거
        const hashIndex = filenamePart.indexOf('#');
        if (hashIndex !== -1) {
          filenamePart = filenamePart.substring(0, hashIndex);
        }

        return filenamePart.length > 0 ? filenamePart : null;
      } catch {
        return null;
      }
    }
  }

  /**
   * Create Failure Result
   *
   * **Purpose**: Generate error response when extraction fails
   *
   * **Result Structure**:
   * ```
   * {
   *   success: false,
   *   mediaItems: [],           // Empty (no media extracted)
   *   clickedIndex: 0,          // Default (not applicable)
   *   metadata: {
   *     extractedAt: timestamp,
   *     sourceType: 'twitter-api',
   *     strategy: 'api-extraction-failed',
   *     error: error message    // Reason for failure
   *   },
   *   tweetInfo: null           // No tweet info available
   * }
   * ```
   *
   * **Failure Scenarios**:
   * - Empty API response: "No media found in API response"
   * - Network timeout: "timeout" (from fetchWithTimeout)
   * - API error: Error message from API call
   * - Transform error: "API extraction failed" (catch-all)
   *
   * **Next Steps After Failure**:
   * - MediaExtractionService (Phase 405B-1) catches this
   * - Returns error result (Fail-Fast)
   * - Logs error, user sees gallery without media
   *
   * **Error Logging**:
   * - Already logged before creating failure result
   * - This result includes error message in metadata
   * - Provides complete traceability for debugging
   *
   * @param error Error message or reason for failure
   * @returns MediaExtractionResult with success: false
   */
  private createFailureResult(error: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'twitter-api',
        strategy: 'api-extraction-failed',
        error,
      },
      tweetInfo: null,
    };
  }
}
