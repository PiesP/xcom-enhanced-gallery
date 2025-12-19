/**
 * @fileoverview URL utilities barrel export
 * @description Centralized export for all URL-related utilities
 *
 * Modules:
 * - host.ts: Host validation, URL parsing, username extraction
 * - safety.ts: URL safety policies and validation
 * - validator.ts: Twitter media URL validation
 */

// Host utilities
export {
  type ExtractUsernameOptions,
  extractUsernameFromUrl,
  getHostname,
  type HostMatchOptions,
  isHostMatching,
  tryParseUrl,
} from './host';

// Combined entrypoints
export { isSafeAndValidMediaUrl } from './media-url';

// Safety utilities
export {
  isUrlAllowed,
  MEDIA_URL_POLICY,
  type UrlSafetyPolicy,
} from './safety';

// Validator utilities
export { isTwitterMediaUrl, isValidMediaUrl } from './validator';
