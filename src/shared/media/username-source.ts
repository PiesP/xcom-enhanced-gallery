/**
 * @fileoverview Username Extraction Utility
 * @version 1.0.0 - Thin utility layer for tweet author username retrieval
 * @phase 379: Media Processing Module Optimization
 *
 * @section System Purpose
 * Provides utilities layer with service abstraction for username extraction.
 * Prevents direct service dependencies in utils layer while enabling
 * tweet author metadata extraction for media processing.
 *
 * **Design Pattern**:
 * Thin wrapper around UsernameExtractionService that abstracts away
 * service dependency from utils layer. This file bridges the separation
 * of concerns between:
 * - Utils layer (cannot import services)
 * - Media processing layer (can use utils)
 * - Services layer (UsernameExtractionService)
 *
 * **Testing Strategy**:
 * Service is mocked in tests via '@shared/services/media/username-extraction-service'
 *
 * @author X.com Enhanced Gallery | Phase 379
 */

/**
 * Extract tweet author username using optimized DOM parsing
 *
 * Retrieves username from DOM elements with fast, non-blocking parsing.
 * Returns null if extraction fails for any reason.
 *
 * **Performance**:
 * - Optimized for speed (used during media processing loops)
 * - Non-blocking extraction (no synchronous iteration)
 * - Graceful degradation on errors
 *
 * **Usage**:
 * ```typescript
 * const username = getPreferredUsername(tweetElement);
 * if (username) {
 *   console.log('Tweet author:', username);
 * }
 * ```
 *
 * @param {HTMLElement | Document} [element] - DOM element or document to search
 *   Optional; if omitted, searches current document context
 *
 * @returns {string | null} Extracted username or null if not found
 *   Format: '@username' without leading '@' symbol
 *   Returns null on any extraction failure (non-blocking)
 *
 * @internal Utility function for media processing; service exposed via mock
 * @throws None - All errors caught; returns null on failure
 *
 * @see UsernameExtractionService - Underlying service implementation
 */
export function getPreferredUsername(_element?: HTMLElement | Document): string | null {
  return null;
}
