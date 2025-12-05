/**
 * @fileoverview Twitter Response Parser - Re-export from new modular location
 * @deprecated Import from '@shared/services/media/twitter-parser' instead
 * @version 4.0.0 - Redirects to functional module
 */

// Re-export everything from the new modular location
// This file maintains backward compatibility for existing imports
export {
  // Primary functional API
  extractMediaFromTweet,
  getHighQualityMediaUrl,
  normalizeLegacyTweet,
  normalizeLegacyUser,
  // Legacy class (deprecated)
  TwitterResponseParser,
} from '@shared/services/media/twitter-parser';
