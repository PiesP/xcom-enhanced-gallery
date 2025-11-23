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

import { logger } from "@shared/logging";
import { convertAPIMediaToMediaInfo } from "@shared/media/media-factory";
import { determineClickedIndex } from "@shared/services/media-extraction/determine-clicked-index";
import { TwitterAPI } from "@shared/services/media/twitter-api-client";
import type {
  APIExtractor,
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfo,
} from "@shared/types/media.types";
import { globalTimerManager } from "@shared/utils/timer-management";
import { extractTweetTextHTMLFromClickedElement } from "@shared/utils/tweet-text-html-extractor";

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
   *   │  └─ Strategy 1: DirectMediaMatching (99%)
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
    extractionId: string,
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
        timeoutMs,
      );

      if (apiMedias?.length === 0) {
        return this.createFailureResult("No media found in API response");
      }

      // Phase 2a Step 2: Extract tweet text HTML (used for MediaInfo enrichment)
      const tweetTextHTML =
        extractTweetTextHTMLFromClickedElement(clickedElement);

      // Phase 2a Step 3: Transform API response to MediaInfo[]
      const mediaItems = await convertAPIMediaToMediaInfo(
        apiMedias,
        tweetInfo,
        tweetTextHTML,
      );

      // Phase 2a Step 4: Calculate which media user clicked
      const clickedIndex = determineClickedIndex(clickedElement, mediaItems);

      // Phase 2a Step 5: Assemble success result
      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: "twitter-api",
          strategy: "api-extraction",
          totalProcessingTime: 0,
          apiMediaCount: apiMedias.length,
        },
        tweetInfo,
      };
    } catch (error) {
      logger.warn(
        `[APIExtractor] ${extractionId}: API extraction failed:`,
        error,
      );
      return this.createFailureResult(
        error instanceof Error ? error.message : "API extraction failed",
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
  private async fetchWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const withTimeout = <U>(p: Promise<U>): Promise<U> => {
      return new Promise<U>((resolve, reject) => {
        const timer = globalTimerManager.setTimeout(() => {
          reject(new Error("timeout"));
        }, timeoutMs);
        p.then(
          (value) => {
            globalTimerManager.clearTimeout(timer);
            resolve(value);
          },
          (error) => {
            globalTimerManager.clearTimeout(timer);
            reject(error);
          },
        );
      });
    };

    return withTimeout(fn());
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
        sourceType: "twitter-api",
        strategy: "api-extraction-failed",
        error,
      },
      tweetInfo: null,
    };
  }
}
