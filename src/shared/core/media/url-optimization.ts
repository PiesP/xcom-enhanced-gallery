/**
 * @fileoverview Media URL optimization (functional core)
 * @description Pure URL transformation helpers.
 */

/**
 * Optimize a Twitter image URL (pbs.twimg.com) to request WebP when possible.
 *
 * This is a pure transformation:
 * - It does not check browser support.
 * - It does not touch DOM APIs.
 * - It returns the original input on parse failure.
 */
export function optimizePbsImageUrlToWebP(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);

    if (url.hostname !== 'pbs.twimg.com') {
      return originalUrl;
    }

    if (url.searchParams.get('format') === 'webp') {
      return originalUrl;
    }

    url.searchParams.set('format', 'webp');
    return url.toString();
  } catch {
    return originalUrl;
  }
}
