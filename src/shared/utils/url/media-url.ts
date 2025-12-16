/**
 * @fileoverview Twitter media URL entrypoints
 * @description Single-purpose helpers that combine safety policy checks with media-domain validation
 */

import { isUrlAllowed, MEDIA_URL_POLICY } from '@shared/utils/url/safety';
import { isValidMediaUrl } from '@shared/utils/url/validator';

/**
 * Validate that a string is both:
 * 1) allowed by our URL safety policy, and
 * 2) a valid Twitter media URL (pbs.twimg.com / video.twimg.com)
 */
export function isSafeAndValidMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  if (!isUrlAllowed(url, MEDIA_URL_POLICY)) {
    return false;
  }

  // `MEDIA_URL_POLICY` permits protocol-relative URLs. `new URL("//...")` needs a base,
  // so we coerce to https for validation.
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) {
    return isValidMediaUrl(`https:${trimmed}`);
  }

  return isValidMediaUrl(url);
}
