/**
 * @fileoverview Twitter Response Parser - Pure functional implementation
 * @description Parses raw Twitter API responses into standardized media entries.
 * @version 5.0.0 - Added inline media support, improved logging and validation
 */

import type {
  TweetMediaEntry,
  TwitterMedia,
  TwitterTweet,
  TwitterUser,
} from '@shared/services/media/types';
import { extractDimensionsFromUrl, normalizeDimension } from '@shared/utils/media/media-dimensions';
import { tryParseUrl } from '@shared/utils/url';

// ============================================================================
// Types
// ============================================================================

interface TypeIndexCounter {
  [mediaType: string]: number;
}

interface MediaDimensions {
  width?: number;
  height?: number;
}

export type TwitterParserDiagnosticLevel = 'debug' | 'warn' | 'error';

export interface TwitterParserDiagnostic {
  level: TwitterParserDiagnosticLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface TweetMediaExtractionResult {
  items: TweetMediaEntry[];
  diagnostics: TwitterParserDiagnostic[];
}

// ============================================================================
// Internal Pure Functions
// ============================================================================

/**
 * Resolve dimensions from media object and URL
 * @internal
 */
function resolveDimensions(media: TwitterMedia, mediaUrl: string): MediaDimensions {
  const dimensionsFromUrl = extractDimensionsFromUrl(mediaUrl);
  const widthFromOriginal = normalizeDimension(media.original_info?.width);
  const heightFromOriginal = normalizeDimension(media.original_info?.height);
  const widthFromUrl = normalizeDimension(dimensionsFromUrl?.width);
  const heightFromUrl = normalizeDimension(dimensionsFromUrl?.height);

  const width = widthFromOriginal ?? widthFromUrl;
  const height = heightFromOriginal ?? heightFromUrl;

  const result: MediaDimensions = {};
  if (width !== null && width !== undefined) {
    result.width = width;
  }
  if (height !== null && height !== undefined) {
    result.height = height;
  }
  return result;
}

function addDiagnostic(
  diagnostics: TwitterParserDiagnostic[],
  level: TwitterParserDiagnosticLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  diagnostics.push(context ? { level, message, context } : { level, message });
}

function stringifyUnknown(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return String(error);
  } catch {
    return 'Unknown error';
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeUrlTokensFromText(text: string, urls: readonly string[]): string {
  let result = text;

  for (const url of urls) {
    if (!url) continue;

    // Remove URL tokens that are separated by whitespace (including newlines).
    // Handles:
    // - URL at beginning of text
    // - URL after newlines
    // - repeated URLs
    // - multiple spaces
    const token = escapeRegExp(url);
    const re = new RegExp(`(^|\\s+)${token}(?=\\s+|$)`, 'g');
    result = result.replace(re, (_match, leadingWs: string) => leadingWs);
  }

  // Normalize excessive spacing introduced by removals while preserving newlines.
  result = result
    .replace(/[ \t\f\v\u00A0]{2,}/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Resolve aspect ratio from video info or dimensions
 * @internal
 */
function resolveAspectRatio(
  media: TwitterMedia,
  dimensions: MediaDimensions
): [number, number] | undefined {
  const aspectRatioValues = Array.isArray(media.video_info?.aspect_ratio)
    ? media.video_info?.aspect_ratio
    : undefined;
  const aspectRatioWidth = normalizeDimension(aspectRatioValues?.[0]);
  const aspectRatioHeight = normalizeDimension(aspectRatioValues?.[1]);

  if (aspectRatioWidth && aspectRatioHeight) {
    return [aspectRatioWidth, aspectRatioHeight];
  }

  if (dimensions.width && dimensions.height) {
    return [dimensions.width, dimensions.height];
  }

  return undefined;
}

/**
 * Get the highest quality URL for a photo media item
 * @internal
 */
function getPhotoHighQualityUrl(mediaUrlHttps?: string): string | undefined {
  if (!mediaUrlHttps) return mediaUrlHttps;

  // A helper to determine whether the input is absolute (contains a scheme)
  const isAbsolute = /^(https?:)?\/\//i.test(mediaUrlHttps);

  const parsed = tryParseUrl(mediaUrlHttps, 'https://pbs.twimg.com');
  if (!parsed) {
    // Conservative fallback that preserves the path and existing query params (if any)
    // while enforcing `name=orig` for maximum quality.
    const [pathPart = '', existingQuery = ''] = mediaUrlHttps.split('?');
    const pathMatch = pathPart.match(/\.(jpe?g|png)$/i);
    if (!pathMatch) return mediaUrlHttps;

    const ext = (pathMatch[1] ?? '').toLowerCase();
    const params = new URLSearchParams(existingQuery);
    const hasFormat = Array.from(params.keys()).some((k) => k.toLowerCase() === 'format');
    if (!hasFormat) {
      params.set('format', ext);
    }
    // Always enforce original size.
    params.set('name', 'orig');

    const query = params.toString();
    return query ? `${pathPart}?${query}` : pathPart;
  }

  const hasParamCaseInsensitive = (key: string): boolean => {
    return Array.from(parsed.searchParams.keys()).some((k) => k.toLowerCase() === key);
  };

  const setParamCaseInsensitive = (key: string, value: string): void => {
    for (const k of Array.from(parsed.searchParams.keys())) {
      if (k !== key && k.toLowerCase() === key) {
        parsed.searchParams.delete(k);
      }
    }
    parsed.searchParams.set(key, value);
  };

  const pathMatch = parsed.pathname.match(/\.(jpe?g|png)$/i);
  if (!pathMatch) return mediaUrlHttps;
  const ext = (pathMatch[1] ?? '').toLowerCase();

  if (!hasParamCaseInsensitive('format')) {
    setParamCaseInsensitive('format', ext);
  }
  // Always enforce original size, even if `format` is already present.
  setParamCaseInsensitive('name', 'orig');

  // Preserve original absolute/relative form: return full string for absolute
  if (isAbsolute) return parsed.toString();
  // For relative inputs, return pathname + search to avoid embedding the host
  return `${parsed.pathname}${parsed.search}`;
}

/**
 * Get the highest quality URL for a video/gif media item
 * @internal
 */
function getVideoHighQualityUrl(media: TwitterMedia): string | null {
  const variants = media.video_info?.variants ?? [];
  const mp4Variants = variants.filter((v) => v.content_type === 'video/mp4');
  if (mp4Variants.length === 0) return null;

  const bestVariant = mp4Variants.reduce((best, current) => {
    const bestBitrate = best.bitrate ?? 0;
    const currentBitrate = current.bitrate ?? 0;
    return currentBitrate > bestBitrate ? current : best;
  });
  return bestVariant.url;
}

/**
 * Get the highest quality URL for any media type
 * @internal
 */
function getHighQualityMediaUrl(media: TwitterMedia): string | null {
  if (media.type === 'photo') {
    return getPhotoHighQualityUrl(media.media_url_https) ?? null;
  }
  if (media.type === 'video' || media.type === 'animated_gif') {
    return getVideoHighQualityUrl(media);
  }
  return null;
}

/**
 * Create a TweetMediaEntry from raw media data
 * @internal
 */
function createMediaEntry(
  media: TwitterMedia,
  mediaUrl: string,
  screenName: string,
  tweetId: string,
  tweetText: string,
  index: number,
  typeIndex: number,
  typeIndexOriginal: number,
  sourceLocation: 'original' | 'quoted'
): TweetMediaEntry {
  const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
  const dimensions = resolveDimensions(media, mediaUrl);
  const aspectRatio = resolveAspectRatio(media, dimensions);

  const entry: TweetMediaEntry = {
    screen_name: screenName,
    tweet_id: tweetId,
    download_url: mediaUrl,
    type: mediaType as 'photo' | 'video',
    typeOriginal: media.type as 'photo' | 'video' | 'animated_gif',
    index,
    typeIndex,
    typeIndexOriginal,
    preview_url: media.media_url_https,
    media_id: media.id_str,
    media_key: media.media_key ?? '',
    expanded_url: media.expanded_url ?? '',
    short_expanded_url: media.display_url ?? '',
    short_tweet_url: media.url ?? '',
    tweet_text: tweetText,
    sourceLocation,
  };

  if (dimensions.width) {
    entry.original_width = dimensions.width;
  }

  if (dimensions.height) {
    entry.original_height = dimensions.height;
  }

  if (aspectRatio) {
    entry.aspect_ratio = aspectRatio;
  }

  return entry;
}

// ============================================================================
// Public API - Pure Functions
// ============================================================================

/**
 * Extract media items from a tweet object.
 *
 * Parses the extended_entities.media array from a Twitter tweet
 * and returns standardized media entries with proper URLs and metadata.
 * Also processes note_tweet inline_media when available.
 *
 * @param tweetResult - Raw tweet result from Twitter API
 * @param tweetUser - User information for the tweet author
 * @param sourceLocation - Whether this is from the original tweet or quoted tweet
 * @returns Array of TweetMediaEntry objects
 *
 * @example
 * ```typescript
 * const mediaItems = extractMediaFromTweet(tweetResult, user, 'original');
 * ```
 */
export function extractMediaFromTweet(
  tweetResult: TwitterTweet,
  tweetUser: TwitterUser,
  sourceLocation: 'original' | 'quoted' = 'original'
): TweetMediaEntry[] {
  return extractMediaFromTweetWithDiagnostics(tweetResult, tweetUser, sourceLocation).items;
}

/**
 * Extract media items from a tweet object and emit structured diagnostics.
 *
 * This function performs no IO. Callers may choose to log diagnostics.
 */
export function extractMediaFromTweetWithDiagnostics(
  tweetResult: TwitterTweet,
  tweetUser: TwitterUser,
  sourceLocation: 'original' | 'quoted' = 'original'
): TweetMediaExtractionResult {
  const diagnostics: TwitterParserDiagnostic[] = [];

  // Allow parsing quoted tweet content by using quoted_status_result.result
  // when sourceLocation is 'quoted' and a quoted result is present.
  const quotedResult = tweetResult.quoted_status_result?.result;
  const parseTarget: TwitterTweet =
    sourceLocation === 'quoted' && quotedResult ? quotedResult : tweetResult;

  if (!parseTarget.extended_entities?.media) return { items: [], diagnostics };

  const mediaItems: TweetMediaEntry[] = [];
  const typeIndex: TypeIndexCounter = {};

  // Validate and extract screen_name, emitting diagnostics for missing data
  const screenName = tweetUser.screen_name ?? '';
  if (!screenName) {
    addDiagnostic(
      diagnostics,
      'warn',
      'Missing screen_name for tweet extraction, using empty string as fallback',
      {
        userId: tweetUser.rest_id,
        sourceLocation,
      }
    );
  }

  // Validate and extract tweet_id, emitting diagnostics for missing data
  const tweetId = parseTarget.rest_id ?? parseTarget.id_str ?? '';
  if (!tweetId) {
    addDiagnostic(
      diagnostics,
      'warn',
      'Missing tweet_id for tweet extraction, using empty string as fallback',
      {
        screenName,
        sourceLocation,
      }
    );
  }

  // Determine media ordering based on note_tweet inline_media when available.
  // When note_tweet is present, inline_media provides the intended presentation order
  // (by text position index). We keep a stable ordering for items not referenced.
  const inlineMedia = parseTarget.note_tweet?.note_tweet_results?.result?.media?.inline_media;
  const inlineMediaOrder = new Map<string, number>();
  if (Array.isArray(inlineMedia)) {
    for (const item of inlineMedia) {
      if (item.media_id && typeof item.index === 'number') {
        inlineMediaOrder.set(item.media_id, item.index);
      }
    }
    if (inlineMediaOrder.size > 0) {
      addDiagnostic(diagnostics, 'debug', 'Found inline media items in note_tweet', {
        count: inlineMediaOrder.size,
      });
    }
  }

  const orderedMedia = (() => {
    const mediaList = parseTarget.extended_entities?.media ?? [];
    if (inlineMediaOrder.size === 0) return mediaList;

    // Stable sort: referenced inline media first (ascending inline index), then the rest.
    return mediaList
      .map((m, originalIndex) => ({ m, originalIndex }))
      .sort((a, b) => {
        const aInline = inlineMediaOrder.get(a.m.id_str);
        const bInline = inlineMediaOrder.get(b.m.id_str);

        if (aInline !== undefined && bInline !== undefined) return aInline - bInline;
        if (aInline !== undefined) return -1;
        if (bInline !== undefined) return 1;
        return a.originalIndex - b.originalIndex;
      })
      .map((x) => x.m);
  })();

  // Normalize tweet text once per tweet: use the parse target (quoted vs original)
  // and remove any short media URLs present in the text.
  const baseTweetText = (parseTarget.full_text ?? '').trim();
  const mediaShortUrls = orderedMedia
    .map((m) => m.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  const normalizedTweetText = removeUrlTokensFromText(baseTweetText, mediaShortUrls);

  for (let index = 0; index < orderedMedia.length; index++) {
    const media: TwitterMedia | undefined = orderedMedia[index];

    // Validate required fields with detailed logging
    if (!media?.type) {
      addDiagnostic(diagnostics, 'debug', 'Skipping media: missing type field', { index });
      continue;
    }
    if (!media.id_str) {
      addDiagnostic(diagnostics, 'debug', 'Skipping media: missing id_str field', { index });
      continue;
    }
    if (!media.media_url_https) {
      addDiagnostic(diagnostics, 'debug', 'Skipping media: missing media_url_https field', {
        index,
        mediaId: media.id_str,
      });
      continue;
    }

    try {
      const mediaUrl = getHighQualityMediaUrl(media);
      if (!mediaUrl) {
        addDiagnostic(diagnostics, 'debug', 'Skipping media: could not resolve high quality URL', {
          mediaId: media.id_str,
        });
        continue;
      }

      const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
      typeIndex[mediaType] = (typeIndex[mediaType] ?? -1) + 1;
      typeIndex[media.type] = typeIndex[media.type] ?? typeIndex[mediaType];

      const tweetText = normalizedTweetText;

      const entry = createMediaEntry(
        media,
        mediaUrl,
        screenName,
        tweetId,
        tweetText,
        index,
        typeIndex[mediaType] ?? 0,
        typeIndex[media.type] ?? 0,
        sourceLocation
      );

      mediaItems.push(entry);
    } catch (error) {
      addDiagnostic(diagnostics, 'warn', 'Failed to process media', {
        mediaId: media?.id_str,
        error: stringifyUnknown(error),
      });
    }
  }

  return { items: mediaItems, diagnostics };
}

/**
 * Normalize legacy tweet fields.
 *
 * Twitter API responses may have data in different locations depending
 * on the API version. This function normalizes the fields to a consistent
 * location for easier processing.
 *
 * @param tweet - Tweet object to normalize (mutates in place)
 *
 * @example
 * ```typescript
 * normalizeLegacyTweet(tweetResult);
 * // Now tweetResult.extended_entities is guaranteed to be populated if available
 * ```
 */
export function normalizeLegacyTweet(tweet: TwitterTweet): void {
  if (tweet.legacy) {
    if (!tweet.extended_entities && tweet.legacy.extended_entities) {
      tweet.extended_entities = tweet.legacy.extended_entities;
    }
    if (!tweet.full_text && tweet.legacy.full_text) {
      tweet.full_text = tweet.legacy.full_text;
    }
    if (!tweet.id_str && tweet.legacy.id_str) {
      tweet.id_str = tweet.legacy.id_str;
    }
  }

  const noteTweetText = tweet.note_tweet?.note_tweet_results?.result?.text;
  if (noteTweetText) {
    tweet.full_text = noteTweetText;
  }
}

/**
 * Normalize legacy user fields.
 *
 * Emits diagnostics if no screen_name is available after normalization,
 * which may indicate an incomplete API response.
 *
 * @param user - User object to normalize (mutates in place)
 *
 * @example
 * ```typescript
 * normalizeLegacyUser(tweetUser);
 * // Now tweetUser.screen_name is guaranteed to be populated if available
 * ```
 */
export function normalizeLegacyUser(user: TwitterUser): void {
  normalizeLegacyUserWithDiagnostics(user);
}

/**
 * Normalize legacy user fields and emit diagnostics.
 *
 * Notes:
 * - Mutates the input user object (legacy compatibility).
 * - Emits diagnostics instead of performing IO.
 */
export function normalizeLegacyUserWithDiagnostics(user: TwitterUser): TwitterParserDiagnostic[] {
  const diagnostics: TwitterParserDiagnostic[] = [];

  if (user.legacy) {
    if (!user.screen_name && user.legacy.screen_name) {
      user.screen_name = user.legacy.screen_name;
    }
    if (!user.name && user.legacy.name) {
      user.name = user.legacy.name;
    }
  }

  // Emit error if screen_name is still missing after normalization
  if (!user.screen_name) {
    addDiagnostic(
      diagnostics,
      'error',
      'User screen_name missing after normalization - API response may be incomplete',
      {
        userId: user.rest_id,
        hasLegacy: !!user.legacy,
        legacyScreenName: user.legacy?.screen_name,
      }
    );
  }

  return diagnostics;
}

// ============================================================================
// Exported Utilities (for advanced use cases)
// ============================================================================

export { getHighQualityMediaUrl, resolveAspectRatio, resolveDimensions };
