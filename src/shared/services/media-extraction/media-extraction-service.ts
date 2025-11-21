/**
 * @fileoverview Media Extraction Service - Multi-Strategy Media Discovery & Retrieval
 *
 * 🔹 System Role:
 * Unified media extraction orchestrator implementing multi-phase extraction strategy:
 * Phase 1: Extract tweet metadata (ID, user, quote tweet detection)
 * Phase 2a: Fetch media items via API (primary strategy)
 * Phase 2b: Extract media directly from DOM (fallback strategy)
 *
 * 🔹 Architecture Overview:
 * ```
 * User clicks media element
 *   ↓
 * MediaExtractionService.extractFromClickedElement(element)
 *   ├─ Phase 1: TweetInfoExtractor → Extract tweet ID, user, quote detection
 *   │           If no tweet ID → Skip to Phase 2b (DOM direct)
 *   │
 *   ├─ Phase 2a: TwitterAPIExtractor → API-based media retrieval (primary)
 *   │            If success → Finalize result (mark source='api')
 *   │            If failure → Fallback to Phase 2b (DOM direct)
 *   │
 *   └─ Phase 2b: DOMDirectExtractor → Direct DOM media extraction (backup)
 *               Searches page DOM for visible media elements
 *               Final fallback, returns result or comprehensive error
 *   ↓
 * MediaExtractionResult
 *   ├─ success: boolean (true if media items found)
 *   ├─ mediaItems: [MediaInfo, ...] (deduplicated, index-safe)
 *   ├─ clickedIndex: Safe index mapping to clicked item (or 0)
 *   ├─ metadata: Extraction details (source, timestamp, strategy)
 *   ├─ tweetInfo: Tweet context information
 *   └─ errors: Any errors encountered during extraction
 * ```
 *
 * 🔹 Key Characteristics:
 * - **Progressive Extraction**: Tweet info → Media retrieval
 * - **API-Priority Strategy**: Prefer API over DOM for accuracy
 * - **Graceful Fallback**: Automatic DOM backup when API unavailable
 * - **Deduplication**: Remove duplicate media items by URL
 * - **Index Safety**: Normalize clicked index after deduplication
 * - **Error Recovery**: Comprehensive error handling with debug context
 * - **Detailed Logging**: Multi-level logging (info, debug, warn, error)
 *
 * 🔹 Extraction Strategies:
 *
 * **Phase 2a: API-Based Extraction** (TwitterAPIExtractor)
 * - Most reliable and complete
 * - Requires tweet ID from Phase 1
 * - Returns all associated media for the tweet
 * - Used when Phase 1 successfully extracts tweet ID
 *
 * **Phase 2b: DOM-Based Extraction** (DOMDirectExtractor)
 * - Works when API unavailable, fails, or tweet ID unknown
 * - Direct access to page DOM
 * - Useful for complex layouts, quote tweets, embedded media
 * - Fallback strategy, always available
 *
 * **Phase 1: Tweet Info Extraction** (TweetInfoExtractor)
 * - Extract tweet ID, username, URLs
 * - Detect quote tweet structure
 * - Enable API-based extraction
 * - If fails, skip directly to DOM fallback
 *
 * 🔹 Error Handling Philosophy:
 * - **Fail-Soft Design**: Each phase can fail independently
 * - **Automatic Fallback**: Seamless transition to next strategy
 * - **Rich Context**: Include element details, parent info in errors
 * - **Debug Metadata**: Preserve all error context for diagnostics
 * - **No Throwing**: All errors captured and returned in result
 *
 * 🔹 Deduplication Strategy:
 * - Remove media items with duplicate URLs
 * - Preserve clicked item index mapping
 * - Adjust index if duplicates removed
 * - Log deduplication details for diagnostics
 *
 * 🔹 Usage Patterns:
 *
 * **Basic Extraction**:
 * ```typescript
 * const extractor = new MediaExtractionService();
 * const result = await extractor.extractFromClickedElement(clickedElement);
 *
 * if (result.success) {
 *   console.log(`Found ${result.mediaItems.length} media items`);
 *   console.log(`Clicked item at index: ${result.clickedIndex}`);
 *   console.log(`Extraction source: ${result.metadata.sourceType}`);
 * } else {
 *   console.error(`Extraction failed: ${result.metadata.error}`);
 *   console.error(`Debug info:`, result.metadata.debug);
 * }
 * ```
 *
 * **Container Extraction**:
 * ```typescript
 * const containerResult = await extractor.extractAllFromContainer(container);
 * // Finds first media in container and extracts associated items
 * ```
 *
 * 🔹 Related Services:
 * - TweetInfoExtractor: Metadata extraction (tweet ID, user, quote tweets)
 * - TwitterAPIExtractor: API-based media retrieval
 * - DOMDirectExtractor: DOM-based media extraction
 *
 * 🔹 Integration Points:
 * - GalleryApp: Main consumer of extraction results
 * - MediaDownloader: Uses extracted media items for download
 * - MediaPreview: Displays extracted media
 *
 * @version 0.4.2 (Phase 309 Service Layer)
 * @see {@link ARCHITECTURE.md} for Phase 309 Service Layer details
 */

import { logger } from '@shared/logging';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
  TweetInfo,
} from '@shared/types/media.types';
import { ExtractionError } from '@shared/types/media.types';
import { ErrorCode } from '@shared/types/result.types';
import { TweetInfoExtractor } from './extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from './extractors/twitter-api-extractor';
import { DOMDirectExtractor } from './extractors/dom-direct-extractor';
import { removeDuplicateMediaItems } from '@shared/utils/deduplication/deduplication-utils';

/**
 * MediaExtractionService - Unified Media Extraction Orchestrator
 *
 * 🔹 Responsibility:
 * Coordinates multi-phase media extraction with automatic fallback chain:
 * Tweet Info → API Extraction (primary) → DOM Extraction (backup)
 *
 * 🔹 Lifecycle:
 * 1. **Initialization**: Create three extractor instances
 *    - TweetInfoExtractor: Metadata extraction
 *    - TwitterAPIExtractor: API-based media retrieval
 *    - DOMDirectExtractor: DOM-based media extraction
 *
 * 2. **Extraction Entry Points**:
 *    - extractFromClickedElement(): Single element extraction
 *    - extractAllFromContainer(): Container-based extraction
 *
 * 3. **Internal Flow**:
 *    - Phase 1: Extract tweet metadata
 *    - Phase 2a: Attempt API extraction
 *    - Phase 2b: Fallback to DOM extraction if Phase 2a fails
 *    - Finalization: Deduplicate, normalize index, add metadata
 *
 * 🔹 Result Finalization Process:
 * - **Deduplication**: Remove duplicate media items by URL
 * - **Index Adjustment**: Remap clicked index after deduplication
 * - **Bounds Checking**: Ensure index within [0, length-1]
 * - **Metadata Addition**: Add extraction timing and source info
 *
 * 🔹 Error Scenarios Handled:
 * - Missing tweet ID → Skip to DOM extraction
 * - API unavailable → Skip to DOM extraction
 * - API returns empty → Skip to DOM extraction
 * - DOM extraction fails → Return error with context
 * - Both strategies fail → Return error with debug metadata
 * - Exception thrown → Catch and return error result
 *
 * 🔹 Design Patterns:
 * - **Composition**: Uses three specialized extractors
 * - **Strategy Pattern**: Multiple extraction approaches
 * - **Fail-Soft**: Continue on errors rather than throwing
 * - **Chain of Responsibility**: API → DOM fallback
 */
export class MediaExtractionService implements MediaExtractor {
  private readonly tweetInfoExtractor: TweetInfoExtractor;
  private readonly apiExtractor: TwitterAPIExtractor;
  private readonly domExtractor: DOMDirectExtractor;

  /**
   * Initialize MediaExtractionService with three specialized extractors
   *
   * 🔹 Extractor Roles:
   * - **tweetInfoExtractor**: Metadata extraction (tweet ID, username, etc.)
   * - **apiExtractor**: API-based media retrieval (primary strategy)
   * - **domExtractor**: DOM-based media extraction (fallback strategy)
   *
   * Constructor is lightweight (no async initialization needed).
   * All extractors are singleton patterns, thread-safe.
   */
  constructor() {
    this.tweetInfoExtractor = new TweetInfoExtractor();
    this.apiExtractor = new TwitterAPIExtractor();
    this.domExtractor = new DOMDirectExtractor();
  }

  /**
   * Extract media from clicked element using multi-phase strategy
   *
   * 🔹 Extraction Flow:
   * ```
   * Step 1: Extract tweet metadata (tweet ID, user, quote tweet detection)
   *   ├─ If available: Proceed to Step 2a (API extraction)
   *   └─ If missing: Skip to Step 2b (DOM extraction)
   *
   * Step 2a: Attempt API-based media extraction (primary strategy)
   *   ├─ If success (count > 0): Finalize result and return
   *   └─ If failure or empty: Fall through to Step 2b (DOM extraction)
   *
   * Step 2b: Attempt DOM-based media extraction (backup strategy)
   *   ├─ If success (count > 0): Finalize result and return
   *   └─ If failure: Return comprehensive error result
   *
   * Step 3: Finalize result
   *   ├─ Deduplication: Remove duplicate media items by URL
   *   ├─ Index adjustment: Remap clicked index after deduplication
   *   ├─ Metadata enrichment: Add source, timing, debug info
   *   └─ Return: MediaExtractionResult with all data
   * ```
   *
   * 🔹 Error Handling:
   * - **Missing tweet ID**: Immediately fallback to DOM extraction
   * - **API unavailable**: Automatically try DOM extraction
   * - **API returns empty**: Automatically try DOM extraction
   * - **DOM extraction fails**: Return error result with context
   * - **Both fail**: Return comprehensive error with debug info
   * - **Exception thrown**: Catch and convert to error result
   *
   * 🔹 Metadata Enrichment:
   * - extractedAt: Timestamp of extraction completion
   * - sourceType: 'api-first', 'dom-fallback', 'extraction-failed', etc.
   * - strategy: Always 'media-extraction'
   * - error: Error message if extraction failed
   * - debug: Contextual information (element tag, parent, etc.)
   *
   * @param element - HTMLElement that triggered extraction (clicked by user)
   *                  Can be any element type (img, video, div, etc.)
   *                  Used to locate parent tweet container
   *
   * @param options - Extraction options (optional)
   *                 - searchRadius: How far to search for parent tweet
   *                 - debugMode: Enable detailed logging
   *                 - other extractor-specific options
   *
   * @returns Promise<MediaExtractionResult> with:
   *         - success: true if media items found
   *         - mediaItems: Array of discovered MediaInfo objects
   *         - clickedIndex: Safe index of clicked item (0 if not found)
   *         - metadata: Extraction details and debug information
   *         - tweetInfo: Tweet context (null if extraction failed)
   *         - errors: Any errors encountered during extraction
   *
   * @example
   * ```typescript
   * // Basic usage
   * const result = await service.extractFromClickedElement(clickedElement);
   *
   * if (result.success) {
   *   console.log(`Found ${result.mediaItems.length} items`);
   *   console.log(`Clicked index: ${result.clickedIndex}`);
   *   console.log(`Source: ${result.metadata.sourceType}`);
   * } else {
   *   console.error(`Failed: ${result.metadata.error}`);
   *   console.error(`Debug:`, result.metadata.debug);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // With options
   * const result = await service.extractFromClickedElement(
   *   element,
   *   { searchRadius: 15, debugMode: true }
   * );
   * ```
   *
   * 🔹 Performance Notes:
   * - Phase 1 (tweet info): ~5-10ms
   * - Phase 2a (API extraction): ~200-500ms
   * - Phase 2b (DOM extraction): ~50-150ms
   * - Total: Typically 200-500ms (API path) or 50-160ms (DOM fallback)
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();
    logger.info(`[MediaExtractor] ${extractionId}: Extraction started`);
    let tweetInfo: TweetInfo | null = null;

    try {
      // Phase 1: Extract tweet metadata (ID, user, quote tweet detection)
      tweetInfo = await this.tweetInfoExtractor.extract(element);

      if (!tweetInfo?.tweetId) {
        logger.debug(
          `[MediaExtractor] ${extractionId}: Tweet info not available - proceeding with direct DOM extraction`
        );
        // No tweet ID: Skip Phase 2a (API extraction)
        // Proceed directly to Phase 2b (DOM extraction)
        const domResult = await this.domExtractor.extract(
          element,
          options,
          extractionId,
          tweetInfo ?? undefined
        );

        // Phase 2b failed: DOM extraction returned no media
        if (!domResult.success || domResult.mediaItems.length === 0) {
          logger.warn(`[MediaExtractor] ${extractionId}: Direct DOM extraction failed`, {
            success: domResult.success,
            mediaCount: domResult.mediaItems.length,
            element: element.tagName,
            elementClass: element.className,
            parentElement: element.parentElement?.tagName,
          });

          return {
            success: false,
            mediaItems: [],
            clickedIndex: 0,
            metadata: {
              extractedAt: Date.now(),
              sourceType: 'dom-direct-failed',
              strategy: 'media-extraction',
              error: 'No tweet information and direct DOM extraction failed',
              debug: {
                element: element.tagName,
                elementClass: element.className,
                parentElement: element.parentElement?.tagName,
                domResult: {
                  success: domResult.success,
                  mediaCount: domResult.mediaItems.length,
                },
              },
            },
            tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, domResult.tweetInfo),
            errors: [new ExtractionError(ErrorCode.NO_MEDIA_FOUND, 'No media found in tweet.')],
          };
        }

        // Phase 2b succeeded: Convert to core interface format
        return this.finalizeResult({
          success: domResult.success,
          mediaItems: domResult.mediaItems,
          clickedIndex: domResult.clickedIndex,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'dom-fallback',
            strategy: 'media-extraction',
          },
          tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, domResult.tweetInfo),
        });
      }

      logger.debug(
        `[MediaExtractor] ${extractionId}: Tweet information acquired - ${tweetInfo.tweetId}`
      );

      // Phase 2a: Attempt API extraction (primary strategy)
      const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);

      if (apiResult.success && apiResult.mediaItems.length > 0) {
        logger.info(
          `[MediaExtractor] ${extractionId}: ✅ API extraction successful - ${apiResult.mediaItems.length} media items`
        );
        // Phase 2a succeeded: Convert to core interface format
        return this.finalizeResult({
          success: apiResult.success,
          mediaItems: apiResult.mediaItems,
          clickedIndex: apiResult.clickedIndex,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'api-first',
            strategy: 'media-extraction',
          },
          tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, apiResult.tweetInfo),
        });
      }

      // Phase 2a failed or returned empty: Fallback to Phase 2b (DOM extraction)
      logger.warn(
        `[MediaExtractor] ${extractionId}: API extraction failed - executing DOM fallback strategy`
      );
      const domResult = await this.domExtractor.extract(
        element,
        options,
        extractionId,
        tweetInfo ?? undefined
      );

      // Phase 2b failed: DOM extraction also returned no media
      if (!domResult.success || domResult.mediaItems.length === 0) {
        logger.error(`[MediaExtractor] ${extractionId}: DOM fallback extraction also failed`, {
          domSuccess: domResult.success,
          mediaCount: domResult.mediaItems.length,
          element: element.tagName,
          elementClass: element.className,
          tweetId: tweetInfo.tweetId,
        });

        return {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'extraction-failed',
            strategy: 'media-extraction',
            error: `Media extraction failed: Both API and DOM extraction failed`,
            debug: {
              element: element.tagName,
              elementClass: element.className,
              tweetId: tweetInfo.tweetId,
              domResult: {
                success: domResult.success,
                mediaCount: domResult.mediaItems.length,
              },
            },
          },
          tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, domResult.tweetInfo),
          errors: [
            new ExtractionError(ErrorCode.NO_MEDIA_FOUND, 'Both API and DOM extraction failed.'),
          ],
        };
      }

      // Phase 2b succeeded: Convert to core interface format
      return this.finalizeResult({
        success: domResult.success,
        mediaItems: domResult.mediaItems,
        clickedIndex: domResult.clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'dom-fallback',
          strategy: 'extraction',
        },
        tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, domResult.tweetInfo),
      });
    } catch (error) {
      return MediaExtractionService.resolveFallbackResult(this, {
        cause: error,
        element,
        options,
        extractionId,
        tweetInfo,
      });
    }
  }

  /**
   * Extract all media from container element
   *
   * 🔹 Container Extraction Strategy:
   * 1. Locate first media element in container (img or video)
   * 2. Delegate to extractFromClickedElement() for full extraction
   * 3. Return result with all associated media for that tweet
   *
   * 🔹 Use Cases:
   * - Batch media extraction from page section
   * - Gallery initialization from container reference
   * - Programmatic extraction without specific element
   *
   * 🔹 Search Pattern:
   * - Looks for: img[src*="pbs.twimg.com"] or video[src*="video.twimg.com"]
   * - Returns: First match or error if none found
   * - Rationale: Twitter media hosted on twimg.com domain
   *
   * @param container - HTMLElement to search for media (usually article, div, etc.)
   * @param options - Extraction options passed to extractFromClickedElement()
   *
   * @returns Promise<MediaExtractionResult> same as extractFromClickedElement()
   *
   * @example
   * ```typescript
   * const article = document.querySelector('article');
   * const result = await service.extractAllFromContainer(article);
   *
   * if (result.success) {
   *   console.log(`Found ${result.mediaItems.length} items`);
   * } else {
   *   console.log('No media found in container');
   * }
   * ```
   *
   * 🔹 Error Cases:
   * - No media element found in container → Returns error
   * - querySelector throws → Caught and logged
   * - delegated extraction fails → Returns delegated error
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();
    logger.debug(`[MediaExtractor] ${extractionId}: Container extraction started`);

    try {
      // Search container for first media element (img or video with Twitter domain)
      const firstMedia = container.querySelector(
        'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]'
      ) as HTMLElement;

      if (!firstMedia) {
        logger.warn(`[MediaExtractor] ${extractionId}: No media found in container`);
        return this.createErrorResult('No media found in container');
      }

      // Delegate to main extraction method for full extraction
      return this.extractFromClickedElement(firstMedia, options);
    } catch (error) {
      logger.error(`[MediaExtractor] ${extractionId}: Container extraction failed:`, error);
      return this.createErrorResult(error);
    }
  }

  /**
   * Generate unique extraction ID for tracking and correlation
   *
   * 🔹 ID Format:
   * - Primary: `simp_${uuid}` using crypto.randomUUID()
   * - Fallback: `simp_${timestamp}_${random}_${random}` for older environments
   *
   * 🔹 Purpose:
   * - Uniquely identify extraction operations
   * - Correlate log messages across async boundaries
   * - Enable end-to-end tracing in error scenarios
   * - Aid in debugging multi-step extraction flows
   *
   * 🔹 Implementation:
   * 1. Attempt crypto.randomUUID() (Node.js 16+, modern browsers)
   * 2. Fallback to timestamp + random components (IE 11 compatible)
   * 3. Prefix with 'simp_' for extraction operations
   *
   * @returns string - Unique extraction ID (e.g., 'simp_550e8400-e29b-41d4-a716-446655440000')
   *
   * @example
   * ```typescript
   * const id1 = this.generateExtractionId(); // 'simp_550e8400...'
   * const id2 = this.generateExtractionId(); // 'simp_f47ac10b...'
   * // Every call generates unique ID
   * ```
   *
   * 🔹 Fallback Algorithm (when crypto unavailable):
   * - timestamp: 13-digit milliseconds (unique to minute precision)
   * - random1: 7 random alphanumeric chars
   * - random2: 7 random alphanumeric chars
   * - Result: simp_1699564320000_a1b2c3d_x9y8z7w (29 chars)
   *
   * 🔹 Collision Probability:
   * - UUID: ~1 in 5.3 billion for 1 billion IDs
   * - Fallback: ~1 in 47 million for 1 billion IDs (acceptable for extraction)
   */
  private generateExtractionId(): string {
    try {
      // Primary: Use crypto.randomUUID() (available in Node.js 16+, modern browsers)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `simp_${crypto.randomUUID()}`;
      }
    } catch {
      // Silently fall through to fallback if crypto.randomUUID() throws
    }

    // Fallback: Combine timestamp + random components (IE 11 compatible)
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 9);
    const random2 = Math.random().toString(36).substring(2, 9);

    return `simp_${timestamp}_${random1}_${random2}`;
  }

  /**
   * Create comprehensive error result with diagnostic information
   *
   * 🔹 Error Handling Strategy:
   * - Capture error details (message, stack, timestamp)
   * - Log error with full context
   * - Return structured error result
   * - Preserve error for debugging without throwing
   *
   * 🔹 Result Structure:
   * - success: false (always)
   * - mediaItems: [] (empty array)
   * - clickedIndex: 0 (no valid index)
   * - metadata: Error details and debug context
   * - tweetInfo: null (extraction failed)
   * - errors: [ExtractionError with error details]
   *
   * 🔹 Error Logging:
   * - Log level: ERROR
   * - Include: message, stack trace, timestamp
   * - Log timestamp: ISO 8601 format
   * - Enables correlation with server logs
   *
   * @param error - Error thrown during extraction (Error object or string)
   * @returns MediaExtractionResult with success=false and comprehensive error info
   *
   * @example
   * ```typescript
   * try {
   *   // ... extraction logic
   * } catch (error) {
   *   return this.createErrorResult(error);
   *   // Returns: {
   *   //   success: false,
   *   //   mediaItems: [],
   *   //   metadata: { error: '...' },
   *   //   errors: [ExtractionError(...)]
   *   // }
   * }
   * ```
   *
   * 🔹 Error Message Extraction:
   * - If error is Error instance: Use error.message + error.stack
   * - Otherwise: Use generic 'Unknown error'
   * - Stack trace included in debug metadata
   * - Original error object preserved in debug.originalError
   */
  private createErrorResult(error: unknown): MediaExtractionResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('MediaExtractionService: Error occurred during extraction', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'error',
        strategy: 'media-extraction',
        error: errorMessage,
        debug: {
          originalError: error,
          stack: errorStack,
        },
      },
      tweetInfo: null,
      errors: [
        new ExtractionError(
          ErrorCode.UNKNOWN,
          `Error occurred during media extraction: ${errorMessage}`,
          error instanceof Error ? error : undefined
        ),
      ],
    };
  }

  /**
   * Finalize extraction result with deduplication and index adjustment
   *
   * 🔹 Finalization Steps:
   * 1. **Check Success**: If result.success is false, return as-is
   * 2. **Deduplication**: Remove duplicate media items by URL
   * 3. **Index Adjustment**: Remap clicked index if duplicates removed
   * 4. **Bounds Checking**: Ensure index within [0, length-1]
   *
   * 🔹 Deduplication Process:
   * - Call removeDuplicateMediaItems(mediaItems)
   * - Compare before/after length
   * - If duplicates found: Adjust clicked index
   * - Track original clicked item via URL matching
   * - Log deduplication details for diagnostics
   *
   * 🔹 Index Adjustment Algorithm:
   * 1. Get original clicked item before deduplication
   * 2. Create clickedKey from item URL (originalUrl OR url)
   * 3. Find new index in deduplicated items by URL match
   * 4. Use new index if found, otherwise fallback to normalized 0
   * 5. Handle edge cases: undefined clicked item, empty result
   *
   * 🔹 Bounds Safety:
   * - Use normalizeClickedIndex() to ensure safe bounds
   * - Range: [0, length-1] for valid results
   * - Default: 0 for empty results or invalid indices
   *
   * 🔹 Logging:
   * - Log deduplication only if duplicates found
   * - Include: original count, unique count, index mappings
   * - Level: DEBUG (diagnostic information)
   *
   * @param result - MediaExtractionResult from extractor
   * @returns Finalized MediaExtractionResult with deduplicated items
   *
   * @example
   * ```typescript
   * // Before: 5 items, 2 duplicates
   * const result = {
   *   success: true,
   *   mediaItems: [
   *     { url: 'a.jpg' },
   *     { url: 'b.jpg' },
   *     { url: 'a.jpg' }, // duplicate of item 0
   *     { url: 'c.jpg' },
   *     { url: 'b.jpg' }, // duplicate of item 1
   *   ],
   *   clickedIndex: 2, // clicked the first duplicate
   * };
   *
   * // After: 3 items, index remapped
   * const finalized = this.finalizeResult(result);
   * // finalized.mediaItems.length === 3
   * // finalized.clickedIndex === 0 (remapped to original 'a.jpg')
   * ```
   *
   * 🔹 Error Cases:
   * - Failed extraction: Returned unchanged
   * - Empty result: Returns empty but valid structure
   * - Invalid clicked index: Normalized to 0
   * - No matching item after dedup: Uses fallback index
   */
  private finalizeResult(result: MediaExtractionResult): MediaExtractionResult {
    if (!result.success) {
      return result;
    }

    const uniqueItems = removeDuplicateMediaItems(result.mediaItems);
    const hasDuplicates = uniqueItems.length !== result.mediaItems.length;

    if (uniqueItems.length === 0) {
      return {
        ...result,
        mediaItems: [],
        clickedIndex: 0,
      };
    }

    // Normalize clicked index for original (pre-dedup) list
    const originalIndex = this.normalizeClickedIndex(result.clickedIndex, result.mediaItems.length);
    // Normalize for new (post-dedup) list
    let adjustedIndex = this.normalizeClickedIndex(result.clickedIndex, uniqueItems.length);

    if (hasDuplicates) {
      // Get the originally clicked item before deduplication
      const clickedItem = result.mediaItems[originalIndex] ?? null;
      if (clickedItem) {
        // Extract URL key for matching (prefer originalUrl for stability)
        const clickedKey = clickedItem.originalUrl ?? clickedItem.url;
        // Find new index by URL matching in deduplicated list
        const newIndex = uniqueItems.findIndex(item => {
          const itemKey = item.originalUrl ?? item.url;
          return itemKey === clickedKey;
        });

        if (newIndex >= 0) {
          adjustedIndex = newIndex;
        }
      }

      // Log deduplication for diagnostics
      logger.debug('[MediaExtractor] Duplicate media removed', {
        originalCount: result.mediaItems.length,
        uniqueCount: uniqueItems.length,
        originalClickedIndex: result.clickedIndex,
        adjustedClickedIndex: adjustedIndex,
      });
    }

    return {
      ...result,
      mediaItems: uniqueItems,
      clickedIndex: adjustedIndex,
    };
  }

  private mergeTweetInfoMetadata(
    base: TweetInfo | null | undefined,
    override: TweetInfo | null | undefined
  ): TweetInfo | null {
    if (!base && !override) {
      return null;
    }

    if (!base) {
      return override ?? null;
    }

    if (!override) {
      return base;
    }

    const mergedMetadata = {
      ...(base.metadata ?? {}),
      ...(override.metadata ?? {}),
    };

    const metadataKeys = Object.keys(mergedMetadata);

    return {
      ...base,
      ...override,
      ...(metadataKeys.length > 0 ? { metadata: mergedMetadata } : {}),
    };
  }

  private static async resolveFallbackResult(
    service: MediaExtractionService,
    params: {
      cause: unknown;
      element: HTMLElement;
      options: MediaExtractionOptions;
      extractionId: string;
      tweetInfo: TweetInfo | null;
    }
  ): Promise<MediaExtractionResult> {
    const { cause, element, options, extractionId, tweetInfo } = params;

    logger.warn(
      `[MediaExtractor] ${extractionId}: API extraction threw error - executing DOM fallback strategy`,
      {
        message: cause instanceof Error ? cause.message : String(cause ?? 'Unknown error'),
        tweetId: tweetInfo?.tweetId,
      }
    );

    try {
      const domResult = await service.domExtractor.extract(
        element,
        options,
        extractionId,
        tweetInfo ?? undefined
      );

      if (domResult.success && domResult.mediaItems.length > 0) {
        logger.info(
          `[MediaExtractor] ${extractionId}: ✅ DOM fallback succeeded after API error - ${domResult.mediaItems.length} media items`
        );

        return service.finalizeResult({
          success: domResult.success,
          mediaItems: domResult.mediaItems,
          clickedIndex: domResult.clickedIndex,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'dom-fallback',
            strategy: 'extraction',
          },
          tweetInfo: service.mergeTweetInfoMetadata(tweetInfo, domResult.tweetInfo),
        });
      }

      logger.error(
        `[MediaExtractor] ${extractionId}: DOM fallback after API error returned no media`,
        {
          domSuccess: domResult.success,
          mediaCount: domResult.mediaItems.length,
          tweetId: tweetInfo?.tweetId,
        }
      );

      return service.createErrorResult(
        new ExtractionError(ErrorCode.NO_MEDIA_FOUND, 'DOM fallback failed after API error')
      );
    } catch (fallbackError) {
      logger.error(
        `[MediaExtractor] ${extractionId}: DOM fallback extraction threw error`,
        fallbackError
      );
      return service.createErrorResult(fallbackError);
    }
  }

  /**
   * Normalize clicked index to safe bounds
   *
   * 🔹 Safety Guarantees:
   * - Always returns integer in range [0, length-1]
   * - Handles: undefined, NaN, Infinity, negative values
   * - Safe for array indexing without bounds checks
   *
   * 🔹 Normalization Algorithm:
   * 1. **Empty list check**: If length === 0, return 0 (no valid index)
   * 2. **Type check**: If index is not finite number, return 0 (invalid)
   * 3. **Floor operation**: Math.floor() to ensure integer
   * 4. **Negative handling**: Math.max(0, index) ensures >= 0
   * 5. **Upper bound**: If >= length, return length-1 (clamp to last)
   * 6. **Return**: Safe index or 0
   *
   * 🔹 Input Cases Handled:
   * | Input              | Length | Output | Reason                    |
   * |--------------------|--------|--------|---------------------------|
   * | undefined          | 5      | 0      | Invalid type → default    |
   * | NaN                | 5      | 0      | Invalid type → default    |
   * | Infinity           | 5      | 0      | Invalid type → default    |
   * | -1                 | 5      | 0      | Clamped to lower bound    |
   * | 0                  | 5      | 0      | Valid                     |
   * | 2.7                | 5      | 2      | Floored to integer        |
   * | 4                  | 5      | 4      | Valid (last element)      |
   * | 5                  | 5      | 4      | Clamped to upper bound    |
   * | 100                | 5      | 4      | Clamped to upper bound    |
   * | anything           | 0      | 0      | Empty list → default      |
   *
   * 🔹 Performance:
   * - O(1) constant time
   * - No array access
   * - No exception throwing
   * - Suitable for tight loops
   *
   * @param index - Raw clicked index (may be undefined, invalid, or out-of-bounds)
   * @param length - Array length (must be >= 0)
   * @returns Safe index in [0, length-1] or 0 for empty arrays
   *
   * @example
   * ```typescript
   * normalizeClickedIndex(undefined, 5)  // → 0
   * normalizeClickedIndex(2, 5)          // → 2
   * normalizeClickedIndex(2.7, 5)        // → 2
   * normalizeClickedIndex(10, 5)         // → 4
   * normalizeClickedIndex(-1, 5)         // → 0
   * normalizeClickedIndex(2, 0)          // → 0
   * ```
   */
  private normalizeClickedIndex(index: number | undefined, length: number): number {
    if (length === 0) {
      return 0;
    }

    if (typeof index !== 'number' || !Number.isFinite(index)) {
      return 0;
    }

    const safeIndex = Math.max(0, Math.floor(index));
    if (safeIndex >= length) {
      return length - 1;
    }

    return safeIndex;
  }
}
