/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Quality Selector
 *
 * Phase 351.6: Quality Layer - High-quality media URL selection
 */

/**
 * Generate high-quality version of media URL
 *
 * Appends quality level (name parameter) to Twitter media URLs.
 * Falls back to string manipulation if URL constructor is unavailable.
 *
 * @param url - Original media URL
 * @param quality - Quality level ('large' | 'medium' | 'small')
 * @returns High-quality URL with quality parameter
 *
 * @example
 * getHighQualityMediaUrl('https://pbs.twimg.com/media/ABC?format=jpg', 'large')
 * // Returns: 'https://pbs.twimg.com/media/ABC?format=jpg&name=large'
 */
export function getHighQualityMediaUrl(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // Input validation - handle null/undefined
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  try {
    // Safely attempt to use URL constructor
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }

    if (!URLConstructor) {
      return getHighQualityMediaUrlFallback(url, quality);
    }

    const urlObj = new URLConstructor(url);
    urlObj.searchParams.set('name', quality);
    if (!urlObj.searchParams.has('format')) {
      urlObj.searchParams.set('format', 'jpg');
    }
    return urlObj.toString();
  } catch {
    return getHighQualityMediaUrlFallback(url, quality);
  }
}

/**
 * Fallback function for quality conversion without URL constructor
 *
 * Uses string manipulation to construct quality URL when URL API is unavailable.
 * Handles query parameter construction and ensures proper parameter ordering.
 *
 * @internal
 * @param url - Original URL
 * @param quality - Quality level
 * @returns URL with quality parameter
 */
function getHighQualityMediaUrlFallback(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // Input validation
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Basic URL validation - must have protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  // Remove existing name parameter and replace with new quality
  const processedUrl = url.replace(/[?&]name=[^&]*/, '');

  // Basic parsing for query parameters
  const hasQuery = processedUrl.includes('?');
  const baseUrl = hasQuery ? processedUrl.split('?')[0] : processedUrl;
  const existingParams = hasQuery ? processedUrl.split('?')[1] : '';

  // Construct new parameter array
  const params: string[] = [];

  // Add name parameter first (matches test expectations)
  params.push(`name=${quality}`);

  // Add existing parameters except name
  if (existingParams) {
    const existingParamPairs = existingParams
      .split('&')
      .filter(param => param && !param.startsWith('name='));
    params.push(...existingParamPairs);
  }

  // Add format parameter if missing
  if (!params.some(p => p.startsWith('format='))) {
    params.push('format=jpg');
  }

  return `${baseUrl}?${params.join('&')}`;
}
