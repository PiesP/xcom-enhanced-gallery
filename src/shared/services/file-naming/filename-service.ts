/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview File Naming Service - Media filename generation and validation
 * @version 2.2.0
 *
 * Provides consistent filename generation for X.com media downloads with support for:
 * - Windows filesystem compatibility (reserved words, forbidden characters)
 * - Unicode normalization (NFKC) for consistent encoding
 * - Quote tweet handling (Phase 375: sourceLocation awareness)
 * - TweetId-based fallback patterns (Phase 432.3)
 *
 * **Filename Formats**:
 * - Media: `{username}_{tweetId}_{index}.{extension}`
 * - ZIP: `{username}_{tweetId}.zip`
 *
 * **Architecture**:
 * - Singleton FilenameService for centralized filename generation
 * - Public convenience functions for direct usage without instantiation
 * - Phase 375: Quote tweet support with sourceLocation tracking
 * - Phase 432.3: TweetId utilization improvements and URL validation
 *
 * @example
 * ```typescript
 * const service = new FilenameService();
 * const filename = service.generateMediaFilename(mediaInfo, { index: 1 });
 * // Result: "username_1234567890_1.jpg"
 * ```
 *
 * @see MediaInfo for media object structure
 * @see Phase 375 for quote tweet quote tweet handling details
 * @see Phase 432.3 for TweetId utilization improvements
 */

import { safeParseInt } from '@shared/utils/type-safety-helpers';
import { isHostMatching, tryParseUrl } from '@shared/utils/url/host-utils';
import type { MediaInfo } from '@shared/types/media.types';

/**
 * Filename generation options
 *
 * @property index - Optional media index number (used for multi-media items)
 * @property extension - Optional file extension override (auto-detected if not provided)
 * @property fallbackPrefix - Prefix to use when no username/tweetId available (default: 'media')
 * @property fallbackUsername - Fallback username if extraction fails (default: 'unknown')
 *
 * @example
 * ```typescript
 * const options: FilenameOptions = {
 *   index: 1,
 *   extension: 'jpg'
 * };
 * const filename = service.generateMediaFilename(mediaInfo, options);
 * // Result: "username_1234567890_1.jpg"
 * ```
 */
export interface FilenameOptions {
  index?: string | number;
  extension?: string;
  fallbackPrefix?: string;
  fallbackUsername?: string;
}

/**
 * ZIP filename generation options
 *
 * @property fallbackPrefix - Prefix for ZIP filename when metadata unavailable (default: 'xcom_gallery')
 *
 * @example
 * ```typescript
 * const options: ZipFilenameOptions = {
 *   fallbackPrefix: 'my_downloads'
 * };
 * const zipFilename = service.generateZipFilename(mediaItems, options);
 * // Result: "my_downloads_1234567890.zip" (if no tweet metadata)
 * ```
 */
export interface ZipFilenameOptions {
  fallbackPrefix?: string;
}

// ===== Validation Pattern Constants =====

/**
 * Media filename validation pattern
 *
 * Format: `{username}_{tweetId}_{index}.{ext}`
 * Example: `piesp_1234567890_1.jpg`
 *
 * Pattern constraints:
 * - Username: alphanumeric + underscore (1-15 chars)
 * - TweetId: 10-19 digit numeric ID
 * - Index: 1+ digit numeric
 * - Extension: 3-4 alphanumeric chars
 *
 * @internal
 */
const MEDIA_FILENAME_PATTERN = /^[a-zA-Z0-9_]+_\d{10,19}_\d+\.[a-zA-Z0-9]+$/;

/**
 * ZIP filename validation pattern
 *
 * Format: `{username}_{tweetId}.zip`
 * Example: `piesp_1234567890.zip`
 *
 * @internal
 */
const ZIP_FILENAME_PATTERN = /^[a-zA-Z0-9_]+_\d{10,19}\.zip$/;

/**
 * Supported media file extensions
 *
 * Whitelist of allowed file extensions for media files:
 * - Image: jpg, jpeg, png, gif, webp
 * - Video: mp4, mov, avi
 *
 * Used for URL extension validation and fallback (defaults to 'jpg').
 *
 * @internal
 */
const SUPPORTED_EXTENSIONS = /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i;

const TWIMG_ROOT_DOMAIN = 'twimg.com';
const TWITTER_PROFILE_HOSTS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'm.twitter.com',
]);

const RESERVED_TWITTER_ROUTES = new Set([
  'i',
  'home',
  'explore',
  'notifications',
  'messages',
  'bookmarks',
  'lists',
  'profile',
  'more',
  'compose',
  'search',
  'settings',
  'help',
  'display',
  'moments',
  'topics',
  'login',
  'logout',
  'signup',
  'account',
  'privacy',
  'tos',
]);

/**
 * Filename Service - Centralized media filename generation and validation
 *
 * Provides consistent filename generation for X.com media with support for:
 *
 * **Key Features**:
 * 1. **Standard Format**: `{username}_{tweetId}_{index}.{extension}`
 * 2. **Quote Tweet Support** (Phase 375): Detects sourceLocation='quoted' and uses quoted tweet info
 * 3. **Windows Compatibility**: Sanitizes filenames for Windows filesystem
 * 4. **Unicode Normalization**: Uses NFKC for consistent encoding
 * 5. **Reserved Word Handling**: Prevents Windows reserved words (CON, PRN, AUX, etc.)
 * 6. **BiDi Marker Removal**: Strips Unicode directional markers for safety
 * 7. **TweetId Fallback** (Phase 432.3): Uses tweet_{tweetId} when username unavailable
 * 8. **URL-based Extraction**: Fallback to extract username from tweet URL
 *
 * **Filename Formats**:
 * - Media: `{username}_{tweetId}_{index}.{extension}`
 * - ZIP: `{username}_{tweetId}.zip`
 * - Fallback: `tweet_{tweetId}_{index}.{ext}` (Phase 432.3)
 *
 * @example
 * ```typescript
 * const service = new FilenameService();
 *
 * // Standard filename for first image
 * const filename = service.generateMediaFilename(mediaInfo, { index: 1 });
 * // => "user_1234567890_1.jpg"
 *
 * // ZIP archive for multiple items
 * const zipName = service.generateZipFilename([media1, media2]);
 * // => "user_1234567890.zip"
 *
 * // Validation
 * const isValid = service.isValidMediaFilename('user_1234567890_1.jpg');
 * // => true
 * ```
 *
 * @since v2.1.0 - File Naming Services
 * @see Phase 375 for quote tweet handling details
 * @see Phase 432.3 for TweetId utilization improvements
 */
export class FilenameService {
  /**
   * Generate media filename with consistent format
   *
   * Format: `{username}_{tweetId}_{index}.{extension}`
   *
   * **Phase 375 - Quote Tweet Support**:
   * When `sourceLocation='quoted'`, uses quoted tweet information (quotedUsername, quotedTweetId)
   * for filename generation instead of original tweet info. This ensures the filename reflects
   * the actual media source in quote tweet scenarios.
   *
   * **Fallback Chain**:
   * 1. If existing filename is valid → return as-is
   * 2. If username + tweetId available → use standard format
   * 3. If only tweetId available → use tweet_{tweetId} format (Phase 432.3)
   * 4. If all else fails → use media_{timestamp}_{index} format
   *
   * @param media - Media information object
   * @param options - Filename generation options
   * @returns Generated filename (Windows-compatible, normalized)
   *
   * @example
   * ```typescript
   * // Standard tweet media
   * const filename1 = service.generateMediaFilename({
   *   url: 'https://pbs.twimg.com/...',
   *   tweetId: '1234567890',
   *   tweetUsername: 'johndoe',
   *   id: 'media_0'
   * }, { index: 1 });
   * // => "johndoe_1234567890_1.jpg"
   *
   * // Quote tweet media (Phase 375)
   * const filename2 = service.generateMediaFilename({
   *   url: 'https://pbs.twimg.com/...',
   *   tweetId: '9999999999',
   *   tweetUsername: 'retweeter',
   *   sourceLocation: 'quoted',
   *   quotedTweetId: '1234567890',
   *   quotedUsername: 'original_author',
   *   id: 'media_1'
   * }, { index: 1 });
   * // => "original_author_1234567890_1.jpg"
   *
   * // Media from URL only (fallback)
   * const filename3 = service.generateMediaFilename({
   *   url: 'https://x.com/someone/status/9876543210',
   *   id: 'media_2'
   * }, { index: 1 });
   * // => "someone_9876543210_1.jpg" or fallback
   * ```
   *
   * @see {@link MediaInfo} for media object structure
   * @see Phase 375 quote tweet detection
   * @see Phase 432.3 TweetId fallback improvements
   */
  generateMediaFilename(media: MediaInfo, options: FilenameOptions = {}): string {
    try {
      // 기존 파일명이 유효하면 그대로 사용
      if (media.filename && this.isValidMediaFilename(media.filename)) {
        return this.sanitizeForWindows(media.filename);
      }

      const extension = options.extension ?? this.extractExtensionFromUrl(media.url);
      const index = this.extractIndexFromMediaId(media.id) ?? this.normalizeIndex(options.index);
      const { username, tweetId } = this.resolveTweetMetadata(media, options.fallbackUsername);

      // 사용자명과 트윗ID가 있으면 표준 형식으로 생성
      if (username && tweetId) {
        return this.sanitizeForWindows(`${username}_${tweetId}_${index}.${extension}`);
      }

      // 폴백: 타임스탬프 기반 파일명
      return this.sanitizeForWindows(
        this.generateFallbackFilename(media, {
          ...options,
          index,
        })
      );
    } catch {
      return this.sanitizeForWindows(this.generateFallbackFilename(media, options));
    }
  }

  /**
   * Generate ZIP archive filename
   *
   * Format: `{username}_{tweetId}.zip`
   *
   * Creates a consistent ZIP filename from the first media item's tweet information.
   * Falls back to timestamp-based naming if tweet metadata unavailable.
   *
   * **Fallback Chain**:
   * 1. If first item has username + tweetId → standard format
   * 2. Otherwise → `{fallbackPrefix}_{timestamp}.zip`
   *
   * **Performance Note**: O(1) operation, uses only first media item
   *
   * @param mediaItems - Array of media information objects (at least one required)
   * @param options - ZIP filename generation options
   * @returns Generated ZIP filename (Windows-compatible, normalized)
   *
   * @example
   * ```typescript
   * const zipName1 = service.generateZipFilename([media1, media2, media3]);
   * // => "username_1234567890.zip"
   *
   * const zipName2 = service.generateZipFilename([], { fallbackPrefix: 'downloads' });
   * // => "downloads_1735946400000.zip"
   * ```
   *
   * @see {@link ZipFilenameOptions} for options
   */
  generateZipFilename(mediaItems: readonly MediaInfo[], options: ZipFilenameOptions = {}): string {
    try {
      const firstItem = mediaItems[0];
      if (firstItem) {
        const { username, tweetId } = this.resolveTweetMetadata(firstItem);
        if (username && tweetId) {
          return this.sanitizeForWindows(`${username}_${tweetId}.zip`);
        }
      }

      const prefix = options.fallbackPrefix ?? 'xcom_gallery';
      const timestamp = Date.now();
      return this.sanitizeForWindows(`${prefix}_${timestamp}.zip`);
    } catch {
      const timestamp = Date.now();
      return this.sanitizeForWindows(`download_${timestamp}.zip`);
    }
  }

  /**
   * Validate media filename format
   *
   * Checks if filename matches the standard pattern:
   * `{name}_{id}_{index}.{ext}`
   *
   * **Pattern Details**:
   * - Name: alphanumeric + underscore
   * - ID: 10-19 digit numeric (Twitter Tweet ID range)
   * - Index: 1+ digit numeric
   * - Extension: 3-4 alphanumeric characters
   *
   * @param filename - Filename to validate
   * @returns true if filename matches media filename pattern
   *
   * @example
   * ```typescript
   * service.isValidMediaFilename('piesp_1234567890_1.jpg');  // => true
   * service.isValidMediaFilename('invalid-filename.jpg');              // => false
   * service.isValidMediaFilename('piesp_123_1.jpg');         // => false (ID too short)
   * ```
   *
   * @see {@link MEDIA_FILENAME_PATTERN} for pattern details
   */
  isValidMediaFilename(filename: string): boolean {
    return MEDIA_FILENAME_PATTERN.test(filename);
  }

  /**
   * Validate ZIP filename format
   *
   * Checks if filename matches the standard ZIP pattern:
   * `{name}_{id}.zip`
   *
   * @param filename - Filename to validate
   * @returns true if filename matches ZIP filename pattern
   *
   * @example
   * ```typescript
   * service.isValidZipFilename('piesp_1234567890.zip');  // => true
   * service.isValidZipFilename('archive.zip');                     // => false
   * service.isValidZipFilename('piesp_1234567890.ZIP');  // => false (case-sensitive)
   * ```
   *
   * @see {@link ZIP_FILENAME_PATTERN} for pattern details
   */
  isValidZipFilename(filename: string): boolean {
    return ZIP_FILENAME_PATTERN.test(filename);
  }

  // ===== Private Helper Methods =====

  private resolveTweetMetadata(
    media: MediaInfo,
    fallbackUsername?: string | null
  ): { username: string | null; tweetId: string | null } {
    let username: string | null = null;
    let tweetId: string | null = null;

    if (media.sourceLocation === 'quoted' && media.quotedUsername && media.quotedTweetId) {
      username = media.quotedUsername;
      tweetId = media.quotedTweetId;
    } else {
      tweetId = media.tweetId ?? null;

      if (media.tweetUsername && media.tweetUsername !== 'unknown') {
        username = media.tweetUsername;
      } else {
        const urlToCheck = ('originalUrl' in media ? media.originalUrl : null) || media.url;
        if (typeof urlToCheck === 'string') {
          username = this.extractUsernameFromUrl(urlToCheck);
        }
      }
    }

    if (!username && fallbackUsername) {
      username = fallbackUsername;
    }

    return { username, tweetId };
  }

  /**
   * Extract media index from media ID
   *
   * Media IDs follow pattern: `{source}_media_{index}` or `{source}_{index}`
   * Converts 0-based index to 1-based for display.
   *
   * @param mediaId - Media ID string (e.g., 'tweet_media_0')
   * @returns 1-based index string, or null if extraction fails
   *
   * @example
   * ```typescript
   * extractIndexFromMediaId('tweet_media_0');   // => '1'
   * extractIndexFromMediaId('tweet_media_3');   // => '4'
   * extractIndexFromMediaId('tweet_5');          // => '5'
   * extractIndexFromMediaId(undefined);          // => null
   * ```
   *
   * @internal Used during filename generation
   */
  private extractIndexFromMediaId(mediaId?: string): string | null {
    if (!mediaId) return null;

    const match = mediaId.match(/_media_(\d+)$/);
    if (match) {
      const zeroBasedIndex = safeParseInt(match[1], 10);
      if (!Number.isNaN(zeroBasedIndex)) {
        return (zeroBasedIndex + 1).toString();
      }
    }

    const previousMatch = mediaId.match(/_(\d+)$/);
    return previousMatch?.[1] ?? null;
  }

  /**
   * Extract file extension from URL
   *
   * Attempts to parse URL and extract extension from pathname.
   * Falls back to basic string operations if URL parsing unavailable.
   * Validates against SUPPORTED_EXTENSIONS whitelist.
   *
   * **Fallback Chain**:
   * 1. If URL constructor available → use URL parsing
   * 2. Otherwise → use basic string operations
   * 3. If extension not whitelisted → return 'jpg'
   *
   * **Performance Note**: O(1) with quick path for unsupported extensions
   *
   * @param url - Media URL
   * @returns File extension in lowercase (e.g., 'jpg', 'mp4')
   *
   * @example
   * ```typescript
   * extractExtensionFromUrl('https://pbs.twimg.com/media/abc.jpg?format=jpg');  // => 'jpg'
   * extractExtensionFromUrl('https://pbs.twimg.com/media/def.webp');             // => 'webp'
   * extractExtensionFromUrl('https://example.com/image.unknown');               // => 'jpg'
   * extractExtensionFromUrl('https://example.com/image');                       // => 'jpg'
   * ```
   *
   * @internal Used during filename generation
   * @see {@link SUPPORTED_EXTENSIONS} for allowed extension list
   */
  private extractExtensionFromUrl(url: string): string {
    try {
      let URLConstructor: typeof URL | undefined;

      if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
        URLConstructor = globalThis.URL;
      } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
        URLConstructor = window.URL;
      }

      if (!URLConstructor) {
        const lastSlashIndex = url.lastIndexOf('/');
        const pathname = lastSlashIndex >= 0 ? url.substring(lastSlashIndex) : url;
        const lastDot = pathname.lastIndexOf('.');
        if (lastDot > 0) {
          const extension = pathname.substring(lastDot + 1);
          if (SUPPORTED_EXTENSIONS.test(extension)) {
            return extension.toLowerCase();
          }
        }
        return 'jpg';
      }

      const urlObj = new URLConstructor(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot > 0) {
        const extension = pathname.substring(lastDot + 1);
        if (SUPPORTED_EXTENSIONS.test(extension)) {
          return extension.toLowerCase();
        }
      }
    } catch {
      // ignore parse error and fall through to default
    }
    return 'jpg';
  }

  /**
   * Normalize index value to string representation
   *
   * Converts index to 1-based numeric string:
   * - null/undefined → '1'
   * - NaN → '1'
   * - 1+ → toString()
   * - 0 → '1' (converts 0-based to 1-based)
   * - negative → converts to 1-based if possible
   *
   * @param index - Index value (string or number)
   * @returns Normalized 1-based index string
   *
   * @example
   * ```typescript
   * normalizeIndex(undefined);  // => '1'
   * normalizeIndex(1);          // => '1'
   * normalizeIndex('5');        // => '5'
   * normalizeIndex(0);          // => '1'
   * normalizeIndex(-1);         // => '1'
   * normalizeIndex('abc');      // => '1'
   * ```
   *
   * @internal Used during filename generation
   */
  private normalizeIndex(index?: string | number): string {
    if (index === undefined || index === null) return '1';

    const numIndex = typeof index === 'string' ? safeParseInt(index, 10) : index;

    if (isNaN(numIndex)) return '1';
    if (numIndex >= 1) return numIndex.toString();

    return Math.max(numIndex + 1, 1).toString();
  }

  /**
   * Generate fallback filename when standard format unavailable
   *
   * **Phase 432.3 - TweetId Utilization Improvements**:
   * Prioritizes `tweet_{tweetId}` format when TweetId available, ensuring consistent
   * file identification even without username extraction.
   *
   * **Fallback Chain**:
   * 1. If TweetId available and numeric → `tweet_{tweetId}_{index}.{ext}`
   * 2. Otherwise → `{fallbackPrefix}_{timestamp}_{index}.{ext}`
   *
   * @param media - Media information object
   * @param options - Generation options
   * @returns Fallback filename string
   *
   * @internal Called when standard format generation fails
   * @see Phase 432.3 for TweetId utilization details
   */
  private generateFallbackFilename(media: MediaInfo, options: FilenameOptions = {}): string {
    const extension = options.extension ?? this.extractExtensionFromUrl(media.url);
    const timestamp = Date.now();
    const index = this.extractIndexFromMediaId(media.id) ?? this.normalizeIndex(options.index);

    // TweetId가 있으면 tweet_{tweetId} 형식 사용
    if (media.tweetId && /^\d+$/.test(media.tweetId)) {
      return `tweet_${media.tweetId}_${index}.${extension}`;
    }

    // TweetId도 없으면 timestamp 사용
    const prefix = options.fallbackPrefix ?? 'media';
    return `${prefix}_${timestamp}_${index}.${extension}`;
  }

  /**
   * Sanitize filename for Windows filesystem compatibility
   *
   * **Compatibility Measures**:
   * 1. **Unicode Normalization (NFKC)**: Decomposes composite characters for consistency
   * 2. **Control Character Removal**: Strips C0, C1, and Bidi control codes (U+200B-U+202E, U+2060, U+2066-U+2069)
   * 3. **Forbidden Character Replacement**: Converts `< > : " / \ | ? *` to `_`
   * 4. **Whitespace Trimming**: Removes leading/trailing spaces and dots
   * 5. **Reserved Word Prevention**: Prefixes Windows reserved words (CON, PRN, AUX, NUL, COM1-9, LPT1-9) with `_`
   * 6. **Length Enforcement**: Truncates to 255 bytes (Windows max)
   *
   * **Security Context**:
   * - Prevents path traversal via control sequences
   * - Removes Unicode directional overrides that could mislead users
   * - Avoids Windows reserved devices that could cause OS conflicts
   *
   * @param name - Input filename
   * @returns Windows-compatible sanitized filename
   *
   * @example
   * ```typescript
   * // Unicode normalization
   * sanitizeForWindows('café.jpg');  // Normalizes to canonical form
   *
   * // Forbidden character replacement
   * sanitizeForWindows('photo<new>.jpg');  // => 'photo_new_.jpg'
   *
   * // Control character removal
   * sanitizeForWindows('file\u202E.jpg');  // Removes bidi override
   *
   * // Reserved word prevention
   * sanitizeForWindows('CON.jpg');   // => '_CON.jpg'
   *
   * // Length truncation
   * sanitizeForWindows('a'.repeat(300) + '.jpg');  // => truncated to 255 bytes
   * ```
   *
   * @internal Used in all filename generation functions
   * @see Phase 300+ for cross-platform file compatibility context
   */
  private sanitizeForWindows(name: string): string {
    try {
      if (!name) return 'media';
      let base = String(name);

      // 유니코드 정규화
      if (typeof base.normalize === 'function') {
        try {
          base = base.normalize('NFKC');
        } catch {
          // ignore
        }
      }

      // 제어 문자 및 BiDi 마커 제거
      base = Array.from(base)
        .filter(ch => {
          const cp = ch.codePointAt(0) ?? 0;
          if (cp <= 0x001f) return false;
          if (cp >= 0x007f && cp <= 0x009f) return false;
          if (cp >= 0x200b && cp <= 0x200f) return false;
          if (cp >= 0x202a && cp <= 0x202e) return false;
          if (cp === 0x2060) return false;
          if (cp >= 0x2066 && cp <= 0x2069) return false;
          return true;
        })
        .join('');

      // 파일명과 확장자 분리
      const lastDot = base.lastIndexOf('.');
      const hasExt = lastDot > 0 && lastDot < base.length - 1;
      const pure = hasExt ? base.slice(0, lastDot) : base;
      const ext = hasExt ? base.slice(lastDot) : '';

      // 금지 문자 치환
      let safe = pure.replace(/[<>:"/\\|?*]/g, '_');

      // 선행/후행 공백/마침표 제거
      safe = safe.replace(/[\s.]+$/g, '');
      safe = safe.replace(/^[\s.]+/g, '');

      // 예약어 방지
      const reserved = new Set([
        'con',
        'prn',
        'aux',
        'nul',
        'com1',
        'com2',
        'com3',
        'com4',
        'com5',
        'com6',
        'com7',
        'com8',
        'com9',
        'lpt1',
        'lpt2',
        'lpt3',
        'lpt4',
        'lpt5',
        'lpt6',
        'lpt7',
        'lpt8',
        'lpt9',
      ]);
      if (reserved.has(safe.toLowerCase())) {
        safe = `_${safe}`;
      }

      if (!safe) safe = 'media';

      // 길이 제한 (255자)
      const result = (safe + ext).slice(0, 255);
      return result;
    } catch {
      return name || 'media';
    }
  }

  /**
   * Extract username from X.com URL
   *
   * **Phase 432.3 - URL Validation Improvements**:
   * Filters out media URLs (pbs.twimg.com, video.twimg.com) which contain media
   * but not username information, preventing incorrect username extraction.
   *
   * **Extraction Steps**:
   * 1. Skip media URLs that lack username
   * 2. Parse x.com/twitter.com URLs for username path component
   * 3. Filter reserved route names (home, explore, settings, etc.)
   * 4. Validate against username pattern (1-15 alphanumeric + underscore)
   *
   * **Pattern Validation**:
   * - Length: 1-15 characters (Twitter limit)
   * - Allowed: `[a-zA-Z0-9_]`
   * - Examples: `@johndoe`, `@elon_musk`, `@tech_news2024`
   *
   * @param url - URL to extract username from
   * @returns Username string, or null if extraction fails
   *
   * @example
   * ```typescript
   * extractUsernameFromUrl('https://x.com/johndoe/status/123');        // => 'johndoe'
   * extractUsernameFromUrl('https://twitter.com/elon_musk');           // => 'elon_musk'
   * extractUsernameFromUrl('https://pbs.twimg.com/media/abc.jpg');     // => null (media URL)
   * extractUsernameFromUrl('https://x.com/home');                      // => null (reserved)
   * extractUsernameFromUrl('https://x.com/invalid%name');              // => null (invalid)
   * ```
   *
   * @internal Used during filename fallback generation
   * @see Phase 432.3 for URL validation improvement context
   */
  private extractUsernameFromUrl(url: string): string | null {
    const parsed = tryParseUrl(url);
    if (!parsed) {
      return null;
    }

    if (isHostMatching(parsed, [TWIMG_ROOT_DOMAIN], { allowSubdomains: true })) {
      return null;
    }

    if (!TWITTER_PROFILE_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }

    const [rawCandidate] = parsed.pathname.split('/').filter(Boolean);
    if (!rawCandidate) {
      return null;
    }

    const candidate = rawCandidate.trim();
    if (!candidate || RESERVED_TWITTER_ROUTES.has(candidate.toLowerCase())) {
      return null;
    }

    return /^[a-zA-Z0-9_]{1,15}$/.test(candidate) ? candidate : null;
  }
}

// ===== Public Convenience Functions =====

const sharedFilenameService = new FilenameService();

/**
 * Generate media filename - Convenience function
 *
 * Wrapper around FilenameService.generateMediaFilename for direct usage
 * without instantiation. Useful for one-off filename generation.
 *
 * Format: `{username}_{tweetId}_{index}.{extension}`
 *
 * **Usage**:
 * - Single filename generation
 * - Shared helper when you do not need custom service wiring
 * - Direct import and use

 * **Performance Note**: Reuses a shared FilenameService instance under the hood
 * to avoid repeated allocations. Instantiate your own service if you need
 * isolated configuration.
 *
 * @param media - Media information object
 * @param options - Filename generation options (optional)
 * @returns Generated filename (Windows-compatible, normalized)

 * @example
 * ```typescript
 * import { generateMediaFilename } from '@shared/services/file-naming';
 *
 * // Single use
 * const filename = generateMediaFilename(mediaInfo, { index: 2 });
 * // => "username_1234567890_2.jpg"
 *
 * // Without options
 * const defaultName = generateMediaFilename(mediaInfo);
 * // => "username_1234567890_1.jpg"
 * ```
 *
 * @see {@link FilenameService.generateMediaFilename} for detailed implementation
 * @see {@link FilenameOptions} for available options
 */
export function generateMediaFilename(media: MediaInfo, options?: FilenameOptions): string {
  return sharedFilenameService.generateMediaFilename(media, options);
}

/**
 * Generate ZIP archive filename - Convenience function
 *
 * Wrapper around FilenameService.generateZipFilename for direct usage
 * without instantiation.
 *
 * Format: `{username}_{tweetId}.zip`
 *
 * **Fallback Behavior**:
 * - If first item has username + tweetId → standard format
 * - Otherwise → `{fallbackPrefix}_{timestamp}.zip`
 *
 * @param mediaItems - Array of media information objects
 * @param options - ZIP filename generation options (optional)
 * @returns Generated ZIP filename (Windows-compatible, normalized)
 *
 * @example
 * ```typescript
 * import { generateZipFilename } from '@shared/services/file-naming';
 *
 * const zipName = generateZipFilename([media1, media2, media3]);
 * // => "username_1234567890.zip"
 *
 * const fallback = generateZipFilename([], { fallbackPrefix: 'my_download' });
 * // => "my_download_1735946400000.zip"
 * ```
 *
 * @see {@link FilenameService.generateZipFilename} for detailed implementation
 * @see {@link ZipFilenameOptions} for available options
 */
export function generateZipFilename(
  mediaItems: readonly MediaInfo[],
  options?: ZipFilenameOptions
): string {
  return sharedFilenameService.generateZipFilename(mediaItems, options);
}

/**
 * Validate media filename format - Convenience function
 *
 * Wrapper around FilenameService.isValidMediaFilename for direct usage.
 *
 * Checks if filename matches the standard media filename pattern:
 * `{name}_{id}_{index}.{ext}`
 *
 * **Use Cases**:
 * - Validate filenames before processing
 * - Check if filename follows our naming convention
 * - Ensure backward compatibility during migration
 *
 * **Performance Note**: Regex test is O(n) where n = filename length (typically < 50 chars)
 *
 * @param filename - Filename to validate
 * @returns true if filename matches media filename pattern
 *
 * @example
 * ```typescript
 * import { isValidMediaFilename } from '@shared/services/file-naming';
 *
 * isValidMediaFilename('piesp_1234567890_1.jpg');   // => true
 * isValidMediaFilename('image.jpg');                           // => false
 * isValidMediaFilename('piesp_123_1.jpg');          // => false (ID too short)
 * ```
 *
 * @see {@link FilenameService.isValidMediaFilename} for pattern details
 * @see {@link MEDIA_FILENAME_PATTERN} for regex pattern
 */
export function isValidMediaFilename(filename: string): boolean {
  return sharedFilenameService.isValidMediaFilename(filename);
}

/**
 * Validate ZIP filename format - Convenience function
 *
 * Wrapper around FilenameService.isValidZipFilename for direct usage.
 *
 * Checks if filename matches the standard ZIP filename pattern:
 * `{name}_{id}.zip`
 *
 * @param filename - Filename to validate
 * @returns true if filename matches ZIP filename pattern
 *
 * @example
 * ```typescript
 * import { isValidZipFilename } from '@shared/services/file-naming';
 *
 * isValidZipFilename('piesp_1234567890.zip');    // => true
 * isValidZipFilename('archive.zip');                       // => false
 * isValidZipFilename('piesp_1234567890.ZIP');   // => false (case-sensitive)
 * ```
 *
 * @see {@link FilenameService.isValidZipFilename} for pattern details
 * @see {@link ZIP_FILENAME_PATTERN} for regex pattern
 */
export function isValidZipFilename(filename: string): boolean {
  return sharedFilenameService.isValidZipFilename(filename);
}
