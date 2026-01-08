/**
 * @fileoverview URL optimization utilities for media
 * @description Optimizes media URLs for performance and bandwidth efficiency.
 */

/**
 * Optimize Twitter PBS image URLs to use WebP format.
 * Converts format parameter if URL has it and is not already WebP.
 * Returns original URL if not from pbs.twimg.com, missing format param, or parse fails.
 * @param input - Image URL to optimize
 * @returns Optimized URL with WebP format, or original URL
 */
export function optimizePbsImageUrlToWebP(input: string): string {
  try {
    const url = new URL(input);

    if (url.hostname !== 'pbs.twimg.com') {
      return input;
    }

    const currentFormat = url.searchParams.get('format');
    if (currentFormat === null || currentFormat.toLowerCase() === 'webp') {
      return input;
    }

    url.searchParams.set('format', 'webp');
    return url.toString();
  } catch {
    return input;
  }
}
