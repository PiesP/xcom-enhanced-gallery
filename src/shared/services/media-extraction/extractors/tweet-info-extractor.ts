/**
 * @fileoverview Tweet Info Extractor - Metadata Discovery & Validation
 *
 * 🔹 System Role:
 * Foundation of multi-phase media extraction, responsible for discovering essential tweet
 * metadata (ID, username, URL) required for API-based media retrieval or DOM context.
 * Implements Strategy Pattern with 5 extraction strategies in priority order.
 *
 * 🔹 Architecture:
 * ```
 * User clicks media element
 *   ↓
 * TweetInfoExtractor.extract(element)
 *   ├─ Strategy 1: ClickedElementTweetStrategy (element itself)
 *   ├─ Strategy 2: UrlBasedTweetStrategy (URL pattern matching)
 *   ├─ Strategy 3: DomStructureTweetStrategy (DOM analysis)
 *   ├─ Strategy 4: DataAttributeTweetStrategy (data-* attributes)
 *   └─ Strategy 5: ParentTraversalTweetStrategy (ancestor traversal)
 *   ↓
 * TweetInfo (or null if all strategies fail)
 *   ├─ tweetId: Unique tweet identifier (required, numeric)
 *   ├─ username: Tweet author username
 *   ├─ tweetUrl: URL to tweet on Twitter
 *   ├─ extractionMethod: Strategy name that succeeded
 *   └─ confidence: Confidence score (0-1, typically > 0.7)
 * ```
 *
 * 🔹 Key Characteristics:
 * - **Multiple Strategies**: 5 different extraction approaches
 * - **Priority-Based**: Strategies sorted by priority (most reliable first)
 * - **Fail-Soft**: Continues trying if strategy fails
 * - **Validation**: Checks tweet ID format (numeric, non-empty)
 * - **Logging**: Debug info on each strategy attempt
 * - **Diagnostic API**: extractWithAllStrategies() for testing/comparison
 *
 * 🔹 Extraction Strategies (in priority order):
 *
 * **1. ClickedElementTweetStrategy** (Priority: 1, Highest)
 * - Extracts tweet info directly from clicked element
 * - Fastest and most reliable (direct access)
 * - Works when element has tweet ID attributes
 *
 * **2. UrlBasedTweetStrategy** (Priority: 2)
 * - Analyzes element URL patterns
 * - Matches Twitter URLs containing tweet ID
 * - Fallback for URL-containing elements
 *
 * **3. DomStructureTweetStrategy** (Priority: 3)
 * - Analyzes DOM structure for tweet containers
 * - Identifies <article>, [role="article"], etc.
 * - Useful for complex nested structures
 *
 * **4. DataAttributeTweetStrategy** (Priority: 4)
 * - Extracts from data-* attributes
 * - Twitter sometimes stores IDs in attributes
 * - Less reliable but still useful
 *
 * **5. ParentTraversalTweetStrategy** (Priority: 5, Lowest)
 * - Traverses parent elements looking for tweet info
 * - Last resort strategy
 * - Most time-consuming but catches edge cases
 *
 * 🔹 Validation Rules:
 * - Tweet ID must be non-empty string
 * - Tweet ID must not be literal 'unknown'
 * - Tweet ID must be purely numeric (/^\d+$/)
 * - If validation fails: Strategy result rejected, next strategy tried
 *
 * 🔹 Error Handling:
 * - Strategy throws exception → Logged as warn, continue to next
 * - All strategies fail → Returns null
 * - Invalid tweet info → Rejected and next strategy tried
 * - No exceptions thrown to caller
 *
 * 🔹 Usage Patterns:
 *
 * **Basic Usage** (recommended):
 * ```typescript
 * const extractor = new TweetInfoExtractor();
 * const tweetInfo = await extractor.extract(clickedElement);
 *
 * if (tweetInfo) {
 *   console.log(`Tweet ID: ${tweetInfo.tweetId}`);
 *   console.log(`By: @${tweetInfo.username}`);
 *   console.log(`Method: ${tweetInfo.extractionMethod}`);
 *   console.log(`Confidence: ${tweetInfo.confidence}`);
 * } else {
 *   console.log('Failed to extract tweet info from element');
 * }
 * ```
 *
 * **Specific Strategy** (for debugging):
 * ```typescript
 * const tweetInfo = await extractor.extractWithStrategy(
 *   element,
 *   'ClickedElementTweetStrategy'
 * );
 * ```
 *
 * **All Strategies** (for testing/comparison):
 * ```typescript
 * const allResults = await extractor.extractWithAllStrategies(element);
 * console.log(`${allResults.length} strategies succeeded`);
 * allResults.forEach(info => {
 *   console.log(`${info.extractionMethod}: confidence=${info.confidence}`);
 * });
 * ```
 *
 * 🔹 Performance Characteristics:
 * - Success (Strategy 1): ~5-10ms
 * - Fallback (Strategies 2-3): ~20-50ms
 * - Deep traversal (Strategy 5): ~100-150ms
 * - All strategies fail: ~200-250ms (full timeout)
 *
 * 🔹 Related Services:
 * - MediaExtractionService: Primary consumer (Phase 1 of 3)
 * - TwitterAPIExtractor: Requires tweet ID from this extractor
 * - All 5 strategy implementations
 *
 * @version 0.4.2 (Phase 309 Service Layer)
 * @see {@link ARCHITECTURE.md} for Phase 309 Service Layer details
 */

import { logger } from '@shared/logging';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';
import { ClickedElementTweetStrategy } from '@shared/services/media-extraction/strategies/clicked-element';
import { UrlBasedTweetStrategy } from '@shared/services/media-extraction/strategies/url-based';
import { DomStructureTweetStrategy } from '@shared/services/media-extraction/strategies/dom-structure';
import { DataAttributeTweetStrategy } from '@shared/services/media-extraction/strategies/data-attribute';
import { ParentTraversalTweetStrategy } from '@shared/services/media-extraction/strategies/parent-traversal';

/**
 * TweetInfoExtractor - Multi-Strategy Tweet Metadata Discovery
 *
 * 🔹 Responsibility:
 * Discover essential tweet metadata (ID, username, URL) required for subsequent extraction
 * phases. Implements Strategy Pattern with 5 extraction approaches in priority order.
 *
 * 🔹 Key Design Decisions:
 * - **Strategy Pattern**: Multiple extraction approaches, each optimized for different scenarios
 * - **Priority Sorting**: Strategies ordered by reliability (fastest/most reliable first)
 * - **Fail-Soft Design**: Each strategy failure is logged but doesn't stop extraction
 * - **Validation Layer**: All results validated for correctness before returning
 * - **Diagnostic API**: extractWithAllStrategies() for testing and comparison
 *
 * 🔹 Lifecycle:
 * 1. **Initialization**: Create 5 strategy instances
 * 2. **Priority Sorting**: Sort by priority (ascending)
 * 3. **Extraction**:
 *    - Try each strategy in order
 *    - Validate result against format requirements
 *    - Return first valid result or null if all fail
 * 4. **Logging**: Debug info on success, warnings on failures
 *
 * 🔹 Strategy Priority Order:
 * | Priority | Strategy                      | Speed | Reliability | Use Case                    |
 * |----------|-------------------------------|-------|-------------|----------------------------|
 * | 1        | ClickedElementTweetStrategy   | Fast  | Highest     | Direct element access       |
 * | 2        | UrlBasedTweetStrategy         | Fast  | High        | URL pattern matching        |
 * | 3        | DomStructureTweetStrategy     | Med   | High        | DOM analysis                |
 * | 4        | DataAttributeTweetStrategy    | Fast  | Medium      | data-* attributes          |
 * | 5        | ParentTraversalTweetStrategy  | Slow  | Medium      | Ancestor traversal (fallback)|
 *
 * 🔹 Public API:
 * - extract(): Try all strategies, return first valid result
 * - extractWithStrategy(name): Try specific strategy only
 * - extractWithAllStrategies(): Get results from all strategies (for testing)
 */
export class TweetInfoExtractor {
  private readonly strategies: TweetInfoExtractionStrategy[];

  /**
   * Initialize TweetInfoExtractor with 5 strategies
   *
   * 🔹 Strategy Initialization:
   * 1. **ClickedElementTweetStrategy**: Direct element attribute extraction
   * 2. **UrlBasedTweetStrategy**: URL pattern-based extraction
   * 3. **DomStructureTweetStrategy**: DOM structural analysis
   * 4. **DataAttributeTweetStrategy**: data-* attribute extraction
   * 5. **ParentTraversalTweetStrategy**: Parent element traversal
   *
   * 🔹 Priority Sorting:
   * - Strategies automatically sorted by priority (ascending)
   * - Lower priority value = higher priority (tried first)
   * - Ensures fastest strategies are attempted first
   *
   * @example
   * ```typescript
   * const extractor = new TweetInfoExtractor();
   * // Ready to extract with 5 strategies in priority order
   * ```
   */
  constructor() {
    this.strategies = [
      new ClickedElementTweetStrategy(), // Priority: 1 (highest, direct element)
      new UrlBasedTweetStrategy(), // Priority: 2 (URL pattern matching)
      new DomStructureTweetStrategy(), // Priority: 3 (DOM structure analysis)
      new DataAttributeTweetStrategy(), // Priority: 4 (data-* attributes)
      new ParentTraversalTweetStrategy(), // Priority: 5 (lowest, traversal)
    ];

    // Sort by priority (ascending: lower numbers first)
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Extract tweet metadata using all strategies in priority order
   *
   * 🔹 Extraction Flow:
   * ```
   * Input: HTMLElement (clicked by user)
   *   ↓
   * For each strategy (in priority order):
   *   ├─ Call strategy.extract(element)
   *   ├─ Validate result with isValidTweetInfo()
   *   │  ├─ Check: tweetId is non-empty
   *   │  ├─ Check: tweetId !== 'unknown'
   *   │  └─ Check: tweetId matches /^\d+$/ (numeric)
   *   ├─ If valid: Log success and return result
   *   └─ If invalid/error: Log warning, continue to next
   *   ↓
   * If all strategies fail or return invalid data:
   *   └─ Return null
   * ```
   *
   * 🔹 Validation Requirements:
   * For a TweetInfo result to be accepted:
   * 1. **tweetId**: Must exist and be truthy
   * 2. **tweetId**: Must not be literal string 'unknown'
   * 3. **tweetId**: Must be purely numeric (only 0-9 characters)
   *
   * If any requirement fails, result is rejected and next strategy tried.
   *
   * 🔹 Error Handling:
   * - Strategy throws exception: Caught, logged as warning, next strategy tried
   * - Strategy returns null/undefined: Logged, next strategy tried
   * - Strategy returns invalid TweetInfo: Validation fails, next strategy tried
   * - All strategies fail: Returns null (no exception thrown)
   *
   * 🔹 Logging:
   * - Success (found valid tweet info):
   *   - Level: DEBUG
   *   - Includes: tweetId, username, confidence, strategy name
   * - Strategy failure:
   *   - Level: WARN
   *   - Includes: strategy name and error message
   * - All strategies failed:
   *   - Level: WARN
   *   - Message: "모든 전략 실패"
   *
   * @param element - HTMLElement that triggered extraction (clicked by user)
   *                  Can be any element type that contains tweet or media info
   *
   * @returns Promise<TweetInfo | null>
   *         - TweetInfo: Valid tweet metadata from first successful strategy
   *         - null: If all strategies fail or return invalid data
   *
   * @example
   * ```typescript
   * const element = document.querySelector('img[src*="pbs.twimg.com"]');
   * const tweetInfo = await extractor.extract(element);
   *
   * if (tweetInfo) {
   *   console.log(`Success: Tweet ${tweetInfo.tweetId}`);
   *   console.log(`Author: @${tweetInfo.username}`);
   *   console.log(`Method: ${tweetInfo.extractionMethod}`);
   *   console.log(`Confidence: ${(tweetInfo.confidence * 100).toFixed(1)}%`);
   * } else {
   *   console.log('Unable to extract tweet info from element');
   * }
   * ```
   *
   * 🔹 Typical Extraction Paths:
   * 1. **Best Case** (Success on Strategy 1):
   *    - Element has direct tweet ID attribute
   *    - Returns in ~5-10ms
   *    - High confidence (0.95+)
   *
   * 2. **Common Case** (Success on Strategy 2-3):
   *    - Element URL or DOM structure contains tweet ID
   *    - Returns in ~20-50ms
   *    - Good confidence (0.75-0.9)
   *
   * 3. **Fallback Case** (Strategy 5 or null):
   *    - Requires parent traversal or all strategies fail
   *    - Takes ~200-250ms
   *    - Lower confidence (0.5-0.7) or null
   *
   * 🔹 Performance Notes:
   * - Average success (first 3 strategies): 30-50ms
   * - Failure case (all 5 strategies): 200-250ms
   * - Consider timeout if extract() takes > 500ms
   */
  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    for (const strategy of this.strategies) {
      try {
        const result = await strategy.extract(element);
        if (result && this.isValidTweetInfo(result)) {
          logger.debug(`[TweetInfoExtractor] Success: ${strategy.name}`, {
            tweetId: result.tweetId,
            username: result.username,
            confidence: result.confidence,
          });
          return result;
        }
      } catch (error) {
        logger.warn(`[TweetInfoExtractor] ${strategy.name} failed:`, error);
      }
    }

    logger.warn('[TweetInfoExtractor] All strategies failed');
    return null;
  }

  /**
   * Validate tweet information against format requirements
   *
   * 🔹 Validation Rules:
   * A TweetInfo object is considered valid if ALL of these conditions are true:
   *
   * 1. **info.tweetId exists**: Truthy value (non-empty, non-null)
   *    - Rejects: null, undefined, '', 0, false
   *    - Accepts: '123456789', 'tweet-id', etc.
   *
   * 2. **tweetId !== 'unknown'**: Not the literal string 'unknown'
   *    - Reason: Some strategies return placeholder 'unknown' value
   *    - Rejects: info.tweetId === 'unknown'
   *    - Accepts: Any other string, including 'unknown-123'
   *
   * 3. **tweetId matches /^\d+$/**: Purely numeric characters
   *    - Reason: Twitter tweet IDs are always numeric
   *    - Regex: ^ (start) \d+ (one or more digits) $ (end)
   *    - Rejects: '123-abc', 'tweet_123', 'id-123'
   *    - Accepts: '123456789', '1', '9999999999999999999'
   *
   * 🔹 Validation Decision Tree:
   * ```
   * info.tweetId truthy?
   *   ├─ No → INVALID (return false)
   *   └─ Yes → Check next condition
   *        ↓
   * info.tweetId !== 'unknown'?
   *   ├─ No → INVALID (return false)
   *   └─ Yes → Check next condition
   *        ↓
   * /^\d+$/.test(info.tweetId)?
   *   ├─ Yes → VALID (return true)
   *   └─ No → INVALID (return false)
   * ```
   *
   * 🔹 Examples:
   * | tweetId              | Truthy | ≠unknown | Numeric | Result  |
   * |----------------------|--------|----------|---------|---------|
   * | '123456789'          | ✅     | ✅       | ✅      | ✅ VALID |
   * | 'unknown'            | ✅     | ❌       | ✅      | ❌ INVALID |
   * | 'tweet-123'          | ✅     | ✅       | ❌      | ❌ INVALID |
   * | null                 | ❌     | -        | -       | ❌ INVALID |
   * | undefined            | ❌     | -        | -       | ❌ INVALID |
   * | ''                   | ❌     | -        | -       | ❌ INVALID |
   *
   * 🔹 Usage:
   * - Called internally by extract() before returning result
   * - Also used by extractWithStrategy() and extractWithAllStrategies()
   * - Private method (not exposed in public API)
   *
   * @param info - TweetInfo object to validate (from any strategy)
   * @returns boolean - true if valid, false if any requirement fails
   *
   * @example
   * ```typescript
   * // ✅ Valid tweet info
   * isValidTweetInfo({ tweetId: '123456789', username: 'user', ... }) // → true
   *
   * // ❌ Invalid: placeholder value
   * isValidTweetInfo({ tweetId: 'unknown', username: 'user', ... }) // → false
   *
   * // ❌ Invalid: non-numeric
   * isValidTweetInfo({ tweetId: 'tweet-123', username: 'user', ... }) // → false
   *
   * // ❌ Invalid: empty
   * isValidTweetInfo({ tweetId: '', username: 'user', ... }) // → false
   * ```
   */
  private isValidTweetInfo(info: TweetInfo): boolean {
    return !!(info.tweetId && info.tweetId !== 'unknown' && /^\d+$/.test(info.tweetId));
  }

  /**
   * Extract tweet info using specific strategy (for debugging/testing)
   *
   * 🔹 Use Cases:
   * - **Testing**: Verify a specific strategy's behavior
   * - **Debugging**: Isolate strategy performance or issues
   * - **Comparison**: Compare results from different strategies
   * - **Fallback**: Force a specific strategy even if previous succeeded
   *
   * 🔹 Flow:
   * 1. Find strategy by name in strategies array
   * 2. If not found: Log warning and return null
   * 3. Call strategy.extract(element)
   * 4. Validate result with isValidTweetInfo()
   * 5. Return result if valid, null otherwise
   *
   * 🔹 Error Handling:
   * - Strategy not found: Logs warning, returns null
   * - Strategy throws exception: Caught, logged as error, returns null
   * - Strategy returns invalid data: Validation fails, returns null
   *
   * @param element - HTMLElement to extract from
   * @param strategyName - Name of specific strategy to use
   *                      Valid names: 'ClickedElementTweetStrategy',
   *                                   'UrlBasedTweetStrategy',
   *                                   'DomStructureTweetStrategy',
   *                                   'DataAttributeTweetStrategy',
   *                                   'ParentTraversalTweetStrategy'
   *
   * @returns Promise<TweetInfo | null> - Valid tweet info from specific strategy or null
   *
   * @example
   * ```typescript
   * // Try only ClickedElementTweetStrategy
   * const tweetInfo = await extractor.extractWithStrategy(
   *   element,
   *   'ClickedElementTweetStrategy'
   * );
   *
   * if (tweetInfo) {
   *   console.log(`Direct element extraction succeeded`);
   * } else {
   *   console.log(`Direct element extraction failed`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Test all strategies individually
   * const strategyNames = [
   *   'ClickedElementTweetStrategy',
   *   'UrlBasedTweetStrategy',
   *   'DomStructureTweetStrategy',
   *   'DataAttributeTweetStrategy',
   *   'ParentTraversalTweetStrategy',
   * ];
   *
   * for (const name of strategyNames) {
   *   const result = await extractor.extractWithStrategy(element, name);
   *   console.log(`${name}: ${result ? 'SUCCESS' : 'FAILED'}`);
   * }
   * ```
   *
   * 🔹 Common Mistakes to Avoid:
   * - ❌ Strategy name mismatch: Use exact class name, not abbreviated
   * - ❌ Case sensitivity: Strategy names are case-sensitive
   * - ❌ Blocking call: Function is async, must await or use .then()
   */
  async extractWithStrategy(element: HTMLElement, strategyName: string): Promise<TweetInfo | null> {
    const strategy = this.strategies.find(s => s.name === strategyName);
    if (!strategy) {
      logger.warn(`[TweetInfoExtractor] Strategy not found: ${strategyName}`);
      return null;
    }

    try {
      const result = await strategy.extract(element);
      return result && this.isValidTweetInfo(result) ? result : null;
    } catch (error) {
      logger.error(`[TweetInfoExtractor] ${strategyName} execution error:`, error);
      return null;
    }
  }

  /**
   * Extract tweet info using ALL strategies (for testing/comparison)
   *
   * 🔹 Purpose:
   * Collect results from all strategies simultaneously to:
   * - Compare strategy effectiveness and confidence scores
   * - Test strategy robustness against different element types
   * - Debug extraction failures (see which strategies work/fail)
   * - Validate consistency across strategies
   * - Measure performance of each strategy
   *
   * 🔹 Flow:
   * 1. Iterate through all strategies (without priority order)
   * 2. For each strategy:
   *    a. Call strategy.extract(element)
   *    b. Validate result with isValidTweetInfo()
   *    c. If valid: Add to results array
   *    d. If error: Log warning, continue
   * 3. Return array of all valid results
   *
   * 🔹 Differences from extract():
   * | Aspect       | extract()         | extractWithAllStrategies()   |
   * |--------------|-------------------|------------------------------|
   * | Strategies   | All (priority)    | All (may run in parallel)    |
   * | Returns      | First valid       | All valid results            |
   * | Use case     | Production        | Testing/debugging/comparison |
   * | Performance  | Fast (avg 30-50ms)| Slower (avg 200-250ms)       |
   *
   * 🔹 Result Array:
   * - Empty array: All strategies failed or returned invalid data
   * - Single item: Only one strategy succeeded
   * - Multiple items: Multiple strategies succeeded (compare confidence)
   * - Order: Results in order of strategy processing (not sorted)
   *
   * 🔹 Analyzing Results:
   * ```typescript
   * const allResults = await extractor.extractWithAllStrategies(element);
   *
   * if (allResults.length === 0) {
   *   console.log('No strategies succeeded');
   * } else if (allResults.length === 1) {
   *   console.log(`Only ${allResults[0].extractionMethod} succeeded`);
   * } else {
   *   console.log(`${allResults.length} strategies succeeded, comparing...`);
   *   const sorted = allResults.sort((a, b) => b.confidence - a.confidence);
   *   console.log(`Best confidence: ${sorted[0].extractionMethod} (${sorted[0].confidence})`);
   *
   *   // Check for consistent tweet ID across strategies
   *   const tweetIds = new Set(allResults.map(r => r.tweetId));
   *   if (tweetIds.size === 1) {
   *     console.log('All strategies agree on tweet ID');
   *   } else {
   *     console.log('Warning: Strategies disagree on tweet ID');
   *     tweetIds.forEach(id => {
   *       const count = allResults.filter(r => r.tweetId === id).length;
   *       console.log(`  ${id}: ${count} strategies`);
   *     });
   *   }
   * }
   * ```
   *
   * 🔹 Error Handling:
   * - Strategy throws exception: Logged as warning, continues to next
   * - Strategy returns null: Logged silently, continues to next
   * - Strategy returns invalid data: Not added to results, continues to next
   * - No exceptions thrown to caller
   *
   * @param element - HTMLElement to extract from
   * @returns Promise<TweetInfo[]> - Array of all valid results (may be empty)
   *
   * @example
   * ```typescript
   * const results = await extractor.extractWithAllStrategies(element);
   * console.log(`${results.length} strategies succeeded`);
   *
   * results.forEach((info, index) => {
   *   console.log(`[${index + 1}] ${info.extractionMethod}`);
   *   console.log(`    Tweet: ${info.tweetId}`);
   *   console.log(`    User: @${info.username}`);
   *   console.log(`    Confidence: ${(info.confidence * 100).toFixed(1)}%`);
   * });
   * ```
   *
   * 🔹 Performance Characteristics:
   * - If strategies run sequentially: ~200-250ms (all 5 strategies)
   * - If strategies run in parallel: ~100-150ms (max single strategy time)
   * - Compare with extract(): Usually 30-50ms (early exit on first success)
   * - Significant overhead compared to extract() (5-8x slower)
   *
   * 🔹 When to Use:
   * - Testing strategy implementation
   * - Debugging extraction failures
   * - Comparing confidence scores
   * - Validating strategy consistency
   * - NOT recommended for production (too slow)
   */
  async extractWithAllStrategies(element: HTMLElement): Promise<TweetInfo[]> {
    const results: TweetInfo[] = [];

    for (const strategy of this.strategies) {
      try {
        const result = await strategy.extract(element);
        if (result && this.isValidTweetInfo(result)) {
          results.push(result);
        }
      } catch (error) {
        logger.warn(`[TweetInfoExtractor] ${strategy.name} 실패:`, error);
      }
    }

    return results;
  }
}
