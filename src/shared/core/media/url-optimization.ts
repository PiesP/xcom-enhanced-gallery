/**
 * URL optimization helpers for media URLs.
 *
 * Provides utilities to optimize media URLs for better performance and bandwidth efficiency.
 */

/**
 * Optimizes Twitter PBS image URLs to use WebP format.
 *
 * Converts Twitter image URLs (pbs.twimg.com) to use WebP format for improved
 * performance and reduced bandwidth usage. Only applies to URLs that already
 * have a format parameter and are not already using WebP.
 *
 * @param input - The image URL to optimize
 * @returns The optimized URL with WebP format, or the original URL if:
 *          - URL is not from pbs.twimg.com
 *          - URL has no format parameter
 *          - URL is already using WebP format
 *          - URL parsing fails
 *
 * @example
 * ```typescript
 * const url = 'https://pbs.twimg.com/media/abc.jpg?format=jpg&name=large';
 * const optimized = optimizePbsImageUrlToWebP(url);
 * // Returns: 'https://pbs.twimg.com/media/abc.jpg?format=webp&name=large'
 * ```
 *
 * @example
 * ```typescript
 * // Already WebP - returns unchanged
 * const webpUrl = 'https://pbs.twimg.com/media/abc.jpg?format=webp&name=large';
 * optimizePbsImageUrlToWebP(webpUrl); // Returns: same URL
 * ```
 *
 * @example
 * ```typescript
 * // Non-Twitter URL - returns unchanged
 * const externalUrl = 'https://example.com/image.jpg';
 * optimizePbsImageUrlToWebP(externalUrl); // Returns: same URL
 * ```
 */
export function optimizePbsImageUrlToWebP(input: string): string {
  try {
    const url = new URL(input);

    // Only optimize Twitter PBS image URLs
    if (url.hostname !== 'pbs.twimg.com') {
      return input;
    }

    const currentFormat = url.searchParams.get('format');

    // Skip URLs without format parameter
    if (currentFormat === null) {
      return input;
    }

    // Skip URLs already using WebP format
    if (currentFormat.toLowerCase() === 'webp') {
      return input;
    }

    // Convert to WebP format
    url.searchParams.set('format', 'webp');
    return url.toString();
  } catch {
    // Return original URL if parsing fails
    return input;
  }
}
