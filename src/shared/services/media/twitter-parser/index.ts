/**
 * @fileoverview Twitter Response Parser Module Entry Point
 * @description Re-exports functional API
 * @version 4.0.0 - Functional refactor
 */

// Primary exports - Pure functions
export {
  extractMediaFromTweet,
  // Utilities
  getHighQualityMediaUrl,
  normalizeLegacyTweet,
  normalizeLegacyUser,
  resolveAspectRatio,
  resolveDimensions,
} from './twitter-response-parser';
