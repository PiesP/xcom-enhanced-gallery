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
  tryParseUrl,
  getHostname,
  isHostMatching,
  extractUsernameFromUrl,
  type HostMatchOptions,
  type ExtractUsernameOptions,
} from './host';

// Safety utilities
export {
  isUrlAllowed,
  MEDIA_URL_POLICY,
  HTML_ATTRIBUTE_URL_POLICY,
  type UrlSafetyPolicy,
} from './safety';

// Validator utilities
export { isValidMediaUrl, isTwitterMediaUrl } from './validator';
