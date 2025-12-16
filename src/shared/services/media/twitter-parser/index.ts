/**
 * @fileoverview Twitter Response Parser Module Entry Point
 * @description Re-exports functional API
 * @version 4.0.0 - Functional refactor
 */

// Primary exports - Pure functions
export {
  extractMediaFromTweet,
  extractMediaFromTweetWithDiagnostics,
  // Utilities
  getHighQualityMediaUrl,
  normalizeLegacyTweet,
  normalizeLegacyUser,
  normalizeLegacyUserWithDiagnostics,
  resolveAspectRatio,
  resolveDimensions,
  type TweetMediaExtractionResult,
  type TwitterParserDiagnostic,
  type TwitterParserDiagnosticLevel,
} from './twitter-response-parser';
