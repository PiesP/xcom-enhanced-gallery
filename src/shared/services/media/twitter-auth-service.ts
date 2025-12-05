/**
 * @fileoverview Twitter Auth Service - Re-export from new modular location
 * @deprecated Import from '@shared/services/media/twitter-auth' instead
 * @version 4.0.0 - Redirects to functional module
 */

// Re-export everything from the new modular location
// This file maintains backward compatibility for existing imports
export {
  // Primary functional API
  getCsrfToken,
  isTokensInitialized,
  resetTokens,
  setCsrfToken,
  // Legacy class (deprecated)
  TwitterAuthService,
} from '@shared/services/media/twitter-auth';
