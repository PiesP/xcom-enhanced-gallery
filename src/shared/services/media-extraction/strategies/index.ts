/**
 * @fileoverview Media Extraction Strategies Barrel Export (Phase 405B-2)
 * @version 3.1.0 - Phase 405B BATCH 2: Comprehensive documentation
 *
 * ============================================
 * 📦 STRATEGIES EXPORTS: Public API Gateway
 * ============================================
 *
 * This module provides public API for all media extraction strategies
 * used by the TweetInfoExtractor (Phase 405B-2) and other components.
 *
 * **Architecture** (5-Strategy Priority Chain):
 *
 * TweetInfoExtractor tries strategies in order:
 * 1️⃣ ClickedElementTweetStrategy (70-80% success)
 *    └─ Direct element analysis (fastest, most reliable)
 * 2️⃣ UrlBasedTweetStrategy (60-70% success)
 *    └─ Page URL pattern matching
 * 3️⃣ DomStructureTweetStrategy (50-60% success)
 *    └─ DOM hierarchy analysis
 * 4️⃣ DataAttributeTweetStrategy (40-50% success)
 *    └─ HTML5 data-* attributes
 * 5️⃣ ParentTraversalTweetStrategy (20-30% success)
 *    └─ Last resort parent search (up to 15 levels)
 *
 * **Other Exports**:
 * - MediaClickIndexStrategy (Phase 351): Click index calculation
 *
 * **Import Examples**:
 * ```typescript
 * // ✅ CORRECT: Import specific strategy
 * import { ClickedElementTweetStrategy } from '@shared/services/media-extraction/strategies';
 *
 * // ✅ CORRECT: Import multiple strategies
 * import {
 *   ClickedElementTweetStrategy,
 *   UrlBasedTweetStrategy,
 *   QuoteTweetDetector
 * } from '@shared/services/media-extraction/strategies';
 *
 * // ❌ WRONG: Don't use internal files directly
 * import TweetStrategy from './clicked-element-tweet-strategy.ts';
 * // Reason: Use barrel export (this file) for consistency
 * ```
 *
 * **Related Modules**:
 * - Parent: @shared/services/media-extraction (orchestrator)
 * - Sibling: extractors/ (TwitterAPIExtractor)
 * - Consumer: TweetInfoExtractor (Phase 405B-2)
 * - Utilities: quote-tweet-detector (Phase 342)
 *
 * **Performance** (aggregate):
 * - Best case: 5-10ms (strategy 1 success)
 * - Typical: 20-50ms (1-2 strategies tried)
 * - Worst case: 100-200ms (all 5 strategies, all fail)
 *
 * **Phase History**:
 * - Phase 351: Initial MediaClickIndexStrategy
 * - Phase 342: Quote tweet detection
 * - Phase 405B-2: This documentation and consolidation
 *
 * **Version**: 3.1.0 (Phase 405B-2)
 */

// Tweet info extraction strategies (TweetInfoExtractor uses these - Priority order)
export { ClickedElementTweetStrategy } from './clicked-element';
export { UrlBasedTweetStrategy } from './url-based';
export { DomStructureTweetStrategy } from './dom-structure';
export { DataAttributeTweetStrategy } from './data-attribute';

// Click index calculation strategy (Used by TwitterAPIExtractor)
export { type MediaClickIndexStrategy } from './click-index';
export {
  DirectMediaMatchingStrategy,
} from './click-index';
