/**
 * @fileoverview Media Processing Pipeline Stages
 * @version 1.0.0 - Individual transformation functions for media extraction
 * @phase 379: Media Processing Module Optimization
 *
 * @section System Purpose
 * Implements five-stage functional pipeline for transforming raw HTML elements
 * into normalized MediaDescriptor objects. Each stage has single responsibility
 * and can be used independently.
 *
 * **Pipeline Stages**:
 * 1. **Collection** - collectNodes() - Discover candidate elements via CSS selectors
 * 2. **Extraction** - extractRawData() - Extract raw data from individual elements
 * 3. **Normalization** - normalize() - Clean and standardize extracted data
 * 4. **Deduplication** - dedupe() - Remove duplicate media entries
 * 5. **Validation** - validate() - Verify data contracts and integrity
 *
 * @section Architecture
 * - **Immutability**: No mutations; functional pipelines produce new arrays
 * - **Type Safety**: Full TypeScript coverage with Result pattern
 * - **Error Recovery**: Graceful handling of invalid items (skipped, not thrown)
 * - **Performance**: O(n) complexity, single passes where possible
 *
 * @see MediaProcessor - Orchestrator class
 * @see Types - Type definitions and contracts
 * @see @shared/utils/media - URL utilities and helpers
 *
 * @author X.com Enhanced Gallery | Phase 379
 */

import type { MediaDescriptor, MediaVariant, RawMediaCandidate } from './types';
import type { Result } from '@shared/types/result.types';
import { success, failure, ErrorCode } from '@shared/types/result.types';
import {
  extractOriginalImageUrl,
  getHighQualityMediaUrl,
  isValidMediaUrl as isTwitterMediaUrl,
} from '../utils/media/media-url.util';

/**
 * Stage 1: Collection - Discover media candidate elements
 *
 * Searches DOM tree for potential media elements using CSS selectors.
 * Uses multiple selectors to catch various media container patterns.
 *
 * **Deduplication**: Automatically removes duplicate matches from overlapping selectors
 *
 * @param {HTMLElement} root - Root DOM element to search
 * @returns {Element[]} Array of discovered candidate elements
 * @internal Stage 1 of media extraction pipeline
 */
export function collectNodes(root: HTMLElement): Element[] {
  const mediaSelectors = [
    'img[src]',
    'video[src]',
    'source[src]',
    'picture img',
    '[data-testid*="media"]',
    '[data-src]',
  ];

  const elements: Element[] = [];

  for (const selector of mediaSelectors) {
    try {
      const found = root.querySelectorAll(selector);
      elements.push(...Array.from(found));
    } catch {
      // Ignore selector failures to keep processing resilient.
    }
  }

  // Deduplication: Remove duplicate elements that matched multiple selectors
  return Array.from(new Set(elements));
}

/**
 * Stage 2: Extraction - Extract raw data from individual elements
 *
 * Processes single DOM element and extracts raw attributes that will
 * be normalized in the next stage.
 *
 * @param {Element} element - Individual DOM element to process
 * @returns {RawMediaCandidate | null} Extracted raw data or null if invalid
 * @internal Stage 2 of media extraction pipeline
 */
export function extractRawData(element: Element): RawMediaCandidate | null {
  try {
    const tagName = element.tagName.toLowerCase();
    let url = '';
    let type = 'unknown';

    // URL extraction from standard attributes
    if (element.hasAttribute('src')) {
      url = element.getAttribute('src') || '';
    } else if (element.hasAttribute('data-src')) {
      url = element.getAttribute('data-src') || '';
    }

    // Media type classification
    if (tagName === 'img') {
      type = 'image';
    } else if (tagName === 'video') {
      type = 'video';
    } else if (tagName === 'source') {
      const parent = element.parentElement;
      type = parent?.tagName.toLowerCase() === 'video' ? 'video' : 'image';
    }

    // URL validation: skip elements without URL
    if (!url || url.trim() === '') {
      return null;
    }

    // Attribute collection: gather all element attributes
    const attributes: Record<string, string> = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }

    return {
      element,
      url: url.trim(),
      type,
      attributes,
    };
  } catch {
    return null;
  }
}

/**
 * Stage 3: Normalization - Clean and standardize extracted data
 *
 * Transforms raw candidate data into normalized MediaDescriptor format.
 * Applies URL sanitization, quality-level variant generation, and metadata extraction.
 *
 * **URL Sanitization** (Phase 8): Filters disallowed schemes
 * **Variant Generation**: Quality variants (small, large, orig) for Twitter images
 * **Metadata Extraction**: Parse width, height, alt text from attributes
 *
 * @param {RawMediaCandidate[]} rawCandidates - Array of extracted raw data
 * @returns {MediaDescriptor[]} Normalized media descriptors
 * @internal Stage 3 of media extraction pipeline
 */
export function normalize(rawCandidates: RawMediaCandidate[]): MediaDescriptor[] {
  const descriptors: MediaDescriptor[] = [];

  for (const candidate of rawCandidates) {
    try {
      // URL Sanitization (Phase 8): Filter disallowed schemes
      if (!isSafeMediaUrl(candidate.url)) {
        continue;
      }

      const originalUrl = candidate.url.trim();

      // GIF Detection: Check for GIF-like URL patterns
      const gifLike = isGifLikeUrl(originalUrl);

      // Type Classification: Normalize media type, prioritize GIF detection
      const mediaType = gifLike
        ? ('gif' as MediaDescriptor['type'])
        : normalizeMediaType(candidate.type);

      if (!mediaType) {
        continue;
      }

      // Metadata Extraction: Parse width, height, alt from attributes
      const width = parseNumber(candidate.attributes.width);
      const height = parseNumber(candidate.attributes.height);
      const alt = candidate.attributes.alt;

      // Image Processing: Generate quality variants for Twitter CDN images
      if (mediaType === 'image') {
        const isTwitter = isTwitterMediaUrl(originalUrl);
        const canonicalUrl = isTwitter ? extractOriginalImageUrl(originalUrl) : originalUrl;
        const id = generateMediaId(canonicalUrl);

        const descriptor: MediaDescriptor = {
          id,
          type: mediaType,
          url: canonicalUrl,
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
          ...(alt && { alt }),
          ...(isTwitter && {
            variants: [
              {
                quality: 'small',
                url: getHighQualityMediaUrl(canonicalUrl, 'small'),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
              },
              {
                quality: 'large',
                url: getHighQualityMediaUrl(canonicalUrl, 'large'),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
              },
              {
                quality: 'orig',
                url: extractOriginalImageUrl(canonicalUrl),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
              },
            ] as ReadonlyArray<MediaVariant>,
          }),
        };
        descriptors.push(descriptor);
        continue;
      }

      // Video/Other Processing: Use original URL without variant generation
      const id = generateMediaId(originalUrl);
      const descriptor: MediaDescriptor = {
        id,
        type: mediaType,
        url: originalUrl,
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(alt && { alt }),
      };

      descriptors.push(descriptor);
    } catch {
      // Skip invalid candidates
    }
  }

  return descriptors;
}

/**
 * Stage 4: Deduplication - Remove duplicate media entries
 *
 * Eliminates duplicate media items based on composite key (id + url).
 * Preserves first occurrence when duplicates found.
 *
 * @param {MediaDescriptor[]} descriptors - Potentially duplicate descriptors
 * @returns {MediaDescriptor[]} Unique media descriptors
 * @internal Stage 4 of media extraction pipeline
 */
export function dedupe(descriptors: MediaDescriptor[]): MediaDescriptor[] {
  const seen = new Set<string>();
  const unique: MediaDescriptor[] = [];

  for (const desc of descriptors) {
    const key = `${desc.id}-${desc.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(desc);
    }
  }

  return unique;
}

/**
 * Stage 5: Validation - Verify data contracts and integrity
 *
 * Final stage validation ensuring all MediaDescriptor objects meet
 * requirements and are ready for consumption by gallery system.
 *
 * @param {MediaDescriptor[]} descriptors - Descriptors to validate
 * @returns {Result<MediaDescriptor[]>} Validation result
 * @internal Stage 5 of media extraction pipeline
 */
export function validate(descriptors: MediaDescriptor[]): Result<MediaDescriptor[]> {
  try {
    // URL Validation: Check that all URLs are valid format
    const invalidUrls: string[] = [];
    for (const desc of descriptors) {
      if (!isValidUrl(desc.url)) {
        invalidUrls.push(desc.url);
      }
    }

    return success(descriptors, {
      validatedCount: descriptors.length,
      invalidUrlCount: invalidUrls.length,
    });
  } catch (error) {
    return failure(error instanceof Error ? error.message : String(error), ErrorCode.UNKNOWN, {
      cause: error instanceof Error ? error : undefined,
      meta: { descriptorCount: descriptors.length },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @internal Helper Functions - Used by Pipeline Stages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @internal Generate unique identifier from media URL
 * Uses simple hash function for URL-based ID generation
 */
function generateMediaId(url: string): string {
  // Generate simple hash from URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `media-${Math.abs(hash).toString(36)}`;
}

/**
 * @internal Normalize media type classification
 * Standardizes various type strings to canonical types
 */
function normalizeMediaType(type: string): MediaDescriptor['type'] | null {
  const lower = type.toLowerCase();
  if (lower === 'image' || lower === 'img') return 'image';
  if (lower === 'video') return 'video';
  if (lower.includes('gif')) return 'gif';
  return null;
}

/**
 * @internal Parse numeric attribute value
 * Safely converts string attribute to number
 */
function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * @internal Validate URL format
 * Accepts absolute, relative, data:image, and blob URLs
 */
function isValidUrl(url: string): boolean {
  try {
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('data:')) {
      return true;
    }
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * @internal Detect GIF-like URL patterns
 * Identifies Twitter GIF-like thumbnails from URL patterns
 */
function isGifLikeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname;
    return (
      path.includes('/tweet_video_thumb/') ||
      path.includes('/ext_tw_video_thumb/') ||
      path.includes('/video_thumb/')
    );
  } catch {
    // Fallback string matching
    return (
      url.includes('/tweet_video_thumb/') ||
      url.includes('/ext_tw_video_thumb/') ||
      url.includes('/video_thumb/')
    );
  }
}

/**
 * @internal URL Sanitization Helper (Phase 8)
 *
 * Filters out disallowed schemes (javascript:, vbscript:, file:, etc.)
 * Allows safe schemes: http://, https://, data:image/*, blob:, /relative
 */
function isSafeMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Allow root-relative and relative paths
  if (lower.startsWith('/') || lower.startsWith('./') || lower.startsWith('../')) {
    return true;
  }

  // Allow protocol-relative URLs
  if (lower.startsWith('//')) {
    return true;
  }

  // Block explicitly dangerous schemes
  const blockedSchemes = [
    'javascript:',
    'vbscript:',
    'file:',
    'ftp:',
    'chrome-extension:',
    'about:',
    'mailto:',
    'tel:',
  ];
  for (const scheme of blockedSchemes) {
    if (lower.startsWith(scheme)) return false;
  }

  // data: URLs - allow only image MIME types
  if (lower.startsWith('data:')) {
    // Allow: data:image/png;base64,...
    if (/^data:image\//i.test(lower)) return true;
    // Block: data:text/html, data:application/javascript, etc.
    return false;
  }

  // Allow blob: URLs (dynamic content)
  if (lower.startsWith('blob:')) return true;

  // Allow http and https
  if (lower.startsWith('http://') || lower.startsWith('https://')) return true;

  // No explicit scheme - assume relative path, allow it
  if (!/^[a-z0-9+.-]+:/.test(lower)) return true;

  // Unknown schemes - block by default
  return false;
}
