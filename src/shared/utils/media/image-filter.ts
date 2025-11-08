/**
 * X.com Gallery - Image Filtering System
 *
 * Integrated advanced image filtering and validation system
 * Validates and filters Twitter/X.com media URLs.
 */

import { removeDuplicateStrings } from '@shared/utils/core-utils';

/**
 * Image filtering result type
 */
export interface ImageFilterResult {
  /** Whether the URL is a valid image */
  isValid: boolean;
  /** Reason for validation failure (when isValid is false) */
  reason?: string;
  /** Detected image format */
  format?: string;
  /** Media domain type */
  domain?: 'pbs' | 'video' | 'abs' | 'abs-0';
  /** Media path type */
  pathType?: 'media' | 'tweet_video_thumb' | 'amplify_video_thumb' | 'ext_tw_video' | 'tweet_video';
  /** Original URL */
  url: string;
}

/**
 * Advanced image filtering options
 */
export interface FilterOptions {
  /** Strict mode (default: true) - false for more lenient validation */
  strict?: boolean;
  /** Whether to allow video thumbnails (default: true) */
  allowVideoThumbnails?: boolean;
  /** Whether to exclude video thumbnails (default: false) */
  excludeVideoThumbnails?: boolean;
  /** Whether to enable logging (default: false) */
  enableLogging?: boolean;
  /** Additional allowed domains */
  additionalDomains?: string[];
  /** Whether to remove duplicates */
  removeDuplicates?: boolean;
  /** File size limit in bytes */
  maxFileSize?: number;
  /** Custom validation function */
  customValidator?: (url: string) => boolean;
}

/**
 * Detailed filtering results type
 */
export interface DetailedFilterResults {
  /** List of valid URLs */
  validUrls: string[];
  /** List of invalid URLs */
  invalidUrls: string[];
  /** Total count */
  totalCount: number;
  /** Valid count */
  validCount: number;
  /** Invalid count */
  invalidCount: number;
  /** Quality groups */
  qualityGroups?: {
    [key: string]: string[];
  };
}

/**
 * Comprehensive image filtering result type
 */
export interface ComprehensiveFilterResult {
  /** List of filtered URLs */
  filtered: string[];
  /** Metadata */
  metadata: {
    totalProcessed: number;
    validCount: number;
    invalidCount: number;
    processingTime: number;
  };
}

/**
 * Base function to validate Twitter/X.com image URLs
 *
 * @param url - URL string to validate
 * @param options - Validation options (optional)
 * @returns Whether the URL is a valid Twitter image URL
 */
export function isValidTweetImage(
  url: string | null | undefined,
  options: FilterOptions = {}
): boolean {
  // Null/undefined check
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  // Normalize to lowercase
  const normalizedUrl = url.toLowerCase().trim();

  // Check for Twitter domains
  const twitterDomains = ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com', 'abs-0.twimg.com'];

  const isTwitterDomain = twitterDomains.some(domain => normalizedUrl.includes(domain));

  if (!isTwitterDomain) {
    return false;
  }

  // Check for video thumbnails
  const isVideoThumbnail =
    normalizedUrl.includes('/ext_tw_video_thumb/') ||
    normalizedUrl.includes('/amplify_video_thumb/') ||
    normalizedUrl.includes('/tweet_video_thumb/') ||
    normalizedUrl.includes('/tweet_video/');

  if (isVideoThumbnail && options.excludeVideoThumbnails) {
    return false;
  }

  // Check for media paths
  const validPaths = [
    '/media/',
    '/ext_tw_video_thumb/',
    '/amplify_video_thumb/',
    '/tweet_video_thumb/',
    '/tweet_video/',
  ];

  const hasValidPath = validPaths.some(path => normalizedUrl.includes(path));

  if (!hasValidPath) {
    return false;
  }

  // Check for image extensions or format parameter
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const hasImageFormat = imageFormats.some(
    format => normalizedUrl.includes(`format=${format}`) || normalizedUrl.includes(`.${format}`)
  );

  // Allow media paths even without format parameter
  return hasImageFormat || normalizedUrl.includes('/media/');
}

/**
 * Filter only valid images from an array of URLs
 *
 * @param urls - URL array to validate
 * @param options - Filtering options (optional)
 * @returns Array of valid image URLs
 */
export function filterValidImages(urls: string[], options: FilterOptions = {}): string[] {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  let filtered = urls.filter(url => isValidTweetImage(url, options));

  // Remove duplicates
  if (options.removeDuplicates) {
    filtered = removeDuplicateStrings(filtered);
  }

  // Custom validation
  if (options.customValidator) {
    filtered = filtered.filter(options.customValidator);
  }

  return filtered;
}

/**
 * Return detailed filtering results
 *
 * @param urls - URL array to validate
 * @param options - Filtering options (optional)
 * @returns Detailed filtering results
 */
export function getDetailedFilterResults(
  urls: string[],
  options: FilterOptions = {}
): DetailedFilterResults {
  if (!Array.isArray(urls)) {
    return {
      validUrls: [],
      invalidUrls: [],
      totalCount: 0,
      validCount: 0,
      invalidCount: 0,
    };
  }

  const validUrls: string[] = [];
  const invalidUrls: string[] = [];

  urls.forEach(url => {
    if (isValidTweetImage(url, options)) {
      validUrls.push(url);
    } else {
      invalidUrls.push(url);
    }
  });

  // Quality grouping (simple example)
  const qualityGroups = {
    orig: validUrls.filter(url => url.includes('name=orig')),
    large: validUrls.filter(url => url.includes('name=large')),
    medium: validUrls.filter(url => url.includes('name=medium')),
    small: validUrls.filter(url => url.includes('name=small')),
  };

  return {
    validUrls,
    invalidUrls,
    totalCount: urls.length,
    validCount: validUrls.length,
    invalidCount: invalidUrls.length,
    qualityGroups,
  };
}

/**
 * Perform comprehensive image filtering
 *
 * @param urls - URL array to validate
 * @param options - Filtering options (optional)
 * @returns Comprehensive filtering results
 */
export function imageFilter(
  urls: string[],
  options: FilterOptions = {}
): ComprehensiveFilterResult {
  const startTime = performance.now();

  const filtered = filterValidImages(urls, options);

  const endTime = performance.now();

  return {
    filtered,
    metadata: {
      totalProcessed: urls.length,
      validCount: filtered.length,
      invalidCount: urls.length - filtered.length,
      processingTime: endTime - startTime,
    },
  };
}
