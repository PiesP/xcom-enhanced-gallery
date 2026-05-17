import { logger } from '@shared/logging/logger';
import type {
  TweetMediaEntry,
  TwitterMedia,
  TwitterTweet,
  TwitterUser,
} from '@shared/services/media/types';
import { extractDimensionsFromUrl, normalizeDimension } from '@shared/utils/media/media-dimensions';
import { escapeRegExp } from '@shared/utils/text/formatting';
import { tryParseUrl } from '@shared/utils/url/host';

/** Utility type to make properties writable for normalization functions */
type Writable<T> = { -readonly [P in keyof T]: T[P] };

interface MediaDimensions {
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}

function resolveDimensions(media: TwitterMedia, mediaUrl: string): MediaDimensions {
  const dimensionsFromUrl = extractDimensionsFromUrl(mediaUrl);
  const widthFromOriginal = normalizeDimension(media.original_info?.width);
  const heightFromOriginal = normalizeDimension(media.original_info?.height);
  const widthFromUrl = dimensionsFromUrl?.width;
  const heightFromUrl = dimensionsFromUrl?.height;

  return {
    ...((widthFromOriginal ?? widthFromUrl) ? { width: widthFromOriginal ?? widthFromUrl } : {}),
    ...((heightFromOriginal ?? heightFromUrl)
      ? { height: heightFromOriginal ?? heightFromUrl }
      : {}),
  };
}

const removeUrlTokensFromText = (text: string, urls: readonly string[]): string => {
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
  return result
    .replace(/[ \t\f\v\u00A0]{2,}/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const resolveAspectRatio = (
  media: TwitterMedia,
  dimensions: MediaDimensions
): [number, number] | undefined => {
  // Runtime validation: Twitter API types are not guaranteed at runtime.
  // Defensive check ensures aspect_ratio is actually an array before use.
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
};

function buildHighQualityUrl(pathPart: string, existingQuery: string): string {
  const pathMatch = pathPart.match(/\.(jpe?g|png)$/i);
  if (!pathMatch) return `${pathPart}?${existingQuery}`;

  const ext = (pathMatch[1] ?? '').toLowerCase();
  const params = new URLSearchParams(existingQuery);
  if (!Array.from(params.keys()).some((k) => k.toLowerCase() === 'format')) {
    params.set('format', ext);
  }
  params.set('name', 'orig');

  const query = params.toString();
  return query ? `${pathPart}?${query}` : pathPart;
}

const getPhotoHighQualityUrl = (mediaUrlHttps?: string): string | undefined => {
  if (!mediaUrlHttps) return mediaUrlHttps;

  const isAbsolute = /^(https?:)?\/\//i.test(mediaUrlHttps);
  const parsed = tryParseUrl(mediaUrlHttps, 'https://pbs.twimg.com');

  if (!parsed) {
    const [pathPart = '', existingQuery = ''] = mediaUrlHttps.split('?');
    return buildHighQualityUrl(pathPart, existingQuery);
  }

  const hasParamCaseInsensitive = (key: string): boolean =>
    Array.from(parsed.searchParams.keys()).some((k) => k.toLowerCase() === key);

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
  setParamCaseInsensitive('name', 'orig');

  return isAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}`;
};

const getVideoHighQualityUrl = (media: TwitterMedia): string | null => {
  const variants = media.video_info?.variants ?? [];
  const mp4Variants = variants.filter((v) => v.content_type === 'video/mp4');
  if (mp4Variants.length === 0) return null;

  return mp4Variants.reduce((best, current) => {
    const bestBitrate = best.bitrate ?? 0;
    const currentBitrate = current.bitrate ?? 0;
    return currentBitrate > bestBitrate ? current : best;
  }).url;
};

export function getHighQualityMediaUrl(media: TwitterMedia): string | null {
  if (media.type === 'photo') {
    return getPhotoHighQualityUrl(media.media_url_https) ?? null;
  }
  if (media.type === 'video' || media.type === 'animated_gif') {
    return getVideoHighQualityUrl(media);
  }
  return null;
}

const createMediaEntry = (
  media: TwitterMedia,
  mediaUrl: string,
  screenName: string,
  tweetId: string,
  tweetText: string,
  index: number,
  sourceLocation: 'original' | 'quoted'
): TweetMediaEntry => {
  const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
  const dimensions = resolveDimensions(media, mediaUrl);
  const aspectRatio = resolveAspectRatio(media, dimensions);

  return {
    screen_name: screenName,
    tweet_id: tweetId,
    download_url: mediaUrl,
    type: mediaType as 'photo' | 'video',
    typeOriginal: media.type as 'photo' | 'video' | 'animated_gif',
    index,
    preview_url: media.media_url_https,
    media_id: media.id_str,
    media_key: media.media_key ?? '',
    expanded_url: media.expanded_url ?? '',
    short_expanded_url: media.display_url ?? '',
    short_tweet_url: media.url ?? '',
    tweet_text: tweetText,
    sourceLocation,
    ...(dimensions.width && { original_width: dimensions.width }),
    ...(dimensions.height && { original_height: dimensions.height }),
    ...(aspectRatio && { aspect_ratio: aspectRatio }),
  };
};

function sortMediaByInlineOrder(
  mediaList: TwitterMedia[],
  inlineMedia: readonly { media_id: string; index: number }[] | undefined
): TwitterMedia[] {
  const orderMap = new Map<string, number>();
  if (Array.isArray(inlineMedia)) {
    for (const item of inlineMedia) {
      if (item.media_id && typeof item.index === 'number') {
        orderMap.set(item.media_id, item.index);
      }
    }
  }
  if (orderMap.size === 0) return mediaList;

  return mediaList
    .map((media, originalIndex) => ({ media, originalIndex }))
    .sort((left, right) => {
      const leftIdx = orderMap.get(left.media.id_str);
      const rightIdx = orderMap.get(right.media.id_str);
      if (leftIdx !== undefined && rightIdx !== undefined) return leftIdx - rightIdx;
      if (leftIdx !== undefined) return -1;
      if (rightIdx !== undefined) return 1;
      return left.originalIndex - right.originalIndex;
    })
    .map((entry) => entry.media);
}

export function extractMediaFromTweet(
  tweetResult: TwitterTweet,
  tweetUser: TwitterUser,
  sourceLocation: 'original' | 'quoted' = 'original'
): TweetMediaEntry[] {
  // Allow parsing quoted tweet content by using quoted_status_result.result
  // when sourceLocation is 'quoted' and a quoted result is present.
  const quotedResult = tweetResult.quoted_status_result?.result;
  const parseTarget: TwitterTweet =
    sourceLocation === 'quoted' && quotedResult ? quotedResult : tweetResult;

  if (!parseTarget.extended_entities?.media) return [];

  const mediaItems: TweetMediaEntry[] = [];

  // Extract screen_name and tweet_id with safe fallbacks.
  const screenName = tweetUser.screen_name ?? '';

  const tweetId = parseTarget.rest_id ?? parseTarget.id_str ?? '';

  // Determine media ordering based on note_tweet inline_media when available.
  // When note_tweet is present, inline_media provides the intended presentation order
  // (by text position index). We keep a stable ordering for items not referenced.
  const inlineMedia = parseTarget.note_tweet?.note_tweet_results?.result?.media?.inline_media;
  const orderedMedia = sortMediaByInlineOrder(
    parseTarget.extended_entities?.media ?? [],
    inlineMedia
  );

  const baseTweetText = (parseTarget.full_text ?? '').trim();
  const mediaShortUrls = orderedMedia
    .map((m) => m.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  const normalizedTweetText = removeUrlTokensFromText(baseTweetText, mediaShortUrls);

  for (let index = 0; index < orderedMedia.length; index++) {
    const media = orderedMedia[index];
    if (!media?.type || !media.id_str || !media.media_url_https) continue;

    try {
      const mediaUrl = getHighQualityMediaUrl(media);
      if (!mediaUrl) continue;

      mediaItems.push(
        createMediaEntry(
          media,
          mediaUrl,
          screenName,
          tweetId,
          normalizedTweetText,
          index,
          sourceLocation
        )
      );
    } catch (error) {
      if (__DEV__) {
        logger.debug('[TwitterParser] Skipping media entry due to error', { error });
      }
    }
  }

  return mediaItems;
}

export function normalizeLegacyTweet(tweet: TwitterTweet): void {
  const mutableTweet = tweet as Writable<TwitterTweet>;
  if (mutableTweet.legacy) {
    if (!mutableTweet.extended_entities && mutableTweet.legacy.extended_entities) {
      mutableTweet.extended_entities = mutableTweet.legacy.extended_entities;
    }
    if (!mutableTweet.full_text && mutableTweet.legacy.full_text) {
      mutableTweet.full_text = mutableTweet.legacy.full_text;
    }
    if (!mutableTweet.id_str && mutableTweet.legacy.id_str) {
      mutableTweet.id_str = mutableTweet.legacy.id_str;
    }
  }

  const noteTweetText = mutableTweet.note_tweet?.note_tweet_results?.result?.text;
  if (noteTweetText) {
    mutableTweet.full_text = noteTweetText;
  }
}

export function normalizeLegacyUser(user: TwitterUser): void {
  const mutableUser = user as Writable<TwitterUser>;
  if (mutableUser.legacy) {
    if (!mutableUser.screen_name && mutableUser.legacy.screen_name) {
      mutableUser.screen_name = mutableUser.legacy.screen_name;
    }
    if (!mutableUser.name && mutableUser.legacy.name) {
      mutableUser.name = mutableUser.legacy.name;
    }
  }
}
