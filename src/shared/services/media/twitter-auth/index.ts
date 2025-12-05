/**
 * @fileoverview Twitter Auth Module Entry Point
 * @description Re-exports functional API and provides legacy class compatibility
 * @version 4.0.0 - Functional refactor
 */

// Primary exports - Pure functions (recommended)
export {
  getCsrfToken,
  isTokensInitialized,
  resetTokens,
  setCsrfToken,
} from './twitter-auth';

// Legacy class compatibility layer
export { TwitterAuthService } from './twitter-auth-service.legacy';
