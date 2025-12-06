/**
 * @fileoverview Twitter Response Parser Module Entry Point
 * @description Re-exports functional API and provides legacy class compatibility
 * @version 4.0.0 - Functional refactor
 */

// Primary exports - Pure functions (recommended)
export {
  extractMediaFromTweet,
  // Utilities
  getHighQualityMediaUrl,
  normalizeLegacyTweet,
  normalizeLegacyUser,
  resolveAspectRatio,
  resolveDimensions,
} from './twitter-response-parser';

// Legacy class compatibility layer
export { TwitterResponseParser } from './twitter-response-parser.legacy';
