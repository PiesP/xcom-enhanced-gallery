import type {
  TweetMediaEntry,
  TwitterMedia,
  TwitterTweet,
  TwitterUser,
} from '@shared/services/media/types';
import { extractDimensionsFromUrl, normalizeDimension } from '@shared/utils/media/media-dimensions';
import { escapeRegExp } from '@shared/utils/text/formatting';
import { tryParseUrl } from '@shared/utils/url/host';

interface TypeIndexCounter {
  [mediaType: string]: number;
}

interface MediaDimensions {
  width?: number;
  height?: number;
}

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

function removeUrlTokensFromText(text: string, urls: readonly string[]): string {
  let result = text;

  for (const url of urls) {
    if (!url) continue;

    const token = escapeRegExp(url);
    const re = new RegExp(`(^|\\s+)${token}(?=\\s+|$)`, 'g');
    result = result.replace(re, (_match, leadingWs: string) => leadingWs);
  }

  result = result
    .replace(/[ \t\f\v\u00A0]{2,}/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

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

function getPhotoHighQualityUrl(mediaUrlHttps?: string): string | undefined {
  if (!mediaUrlHttps) return mediaUrlHttps;

  const isAbsolute = /^(https?:)?\/\//i.test(mediaUrlHttps);

  const parsed = tryParseUrl(mediaUrlHttps, 'https://pbs.twimg.com');
  if (!parsed) {
    const [pathPart = '', existingQuery = ''] = mediaUrlHttps.split('?');
    const pathMatch = pathPart.match(/\.(jpe?g|png)$/i);
    if (!pathMatch) return mediaUrlHttps;

    const ext = (pathMatch[1] ?? '').toLowerCase();
    const params = new URLSearchParams(existingQuery);
    const hasFormat = Array.from(params.keys()).some((k) => k.toLowerCase() === 'format');
    if (!hasFormat) {
      params.set('format', ext);
    }
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
  setParamCaseInsensitive('name', 'orig');

  if (isAbsolute) return parsed.toString();
  return `${parsed.pathname}${parsed.search}`;
}

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

function getHighQualityMediaUrl(media: TwitterMedia): string | null {
  if (media.type === 'photo') {
    return getPhotoHighQualityUrl(media.media_url_https) ?? null;
  }
  if (media.type === 'video' || media.type === 'animated_gif') {
    return getVideoHighQualityUrl(media);
  }
  return null;
}

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

export function extractMediaFromTweet(
  tweetResult: TwitterTweet,
  tweetUser: TwitterUser,
  sourceLocation: 'original' | 'quoted' = 'original'
): TweetMediaEntry[] {
  const quotedResult = tweetResult.quoted_status_result?.result;
  const parseTarget: TwitterTweet =
    sourceLocation === 'quoted' && quotedResult ? quotedResult : tweetResult;

  if (!parseTarget.extended_entities?.media) return [];

  const mediaItems: TweetMediaEntry[] = [];
  const typeIndex: TypeIndexCounter = {};

  const screenName = tweetUser.screen_name ?? '';

  const tweetId = parseTarget.rest_id ?? parseTarget.id_str ?? '';

  const inlineMedia = parseTarget.note_tweet?.note_tweet_results?.result?.media?.inline_media;
  const inlineMediaOrder = new Map<string, number>();
  if (Array.isArray(inlineMedia)) {
    for (const item of inlineMedia) {
      if (item.media_id && typeof item.index === 'number') {
        inlineMediaOrder.set(item.media_id, item.index);
      }
    }
  }

  const orderedMedia = (() => {
    const mediaList = parseTarget.extended_entities?.media ?? [];
    if (inlineMediaOrder.size === 0) return mediaList;

    return mediaList
      .map((media, originalIndex) => ({ media, originalIndex }))
      .sort((left, right) => {
        const leftInline = inlineMediaOrder.get(left.media.id_str);
        const rightInline = inlineMediaOrder.get(right.media.id_str);

        if (leftInline !== undefined && rightInline !== undefined) return leftInline - rightInline;
        if (leftInline !== undefined) return -1;
        if (rightInline !== undefined) return 1;
        return left.originalIndex - right.originalIndex;
      })
      .map((entry) => entry.media);
  })();

  const baseTweetText = (parseTarget.full_text ?? '').trim();
  const mediaShortUrls = orderedMedia
    .map((m) => m.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  const normalizedTweetText = removeUrlTokensFromText(baseTweetText, mediaShortUrls);

  for (let index = 0; index < orderedMedia.length; index++) {
    const media: TwitterMedia | undefined = orderedMedia[index];

    if (!media?.type) {
      continue;
    }
    if (!media.id_str) {
      continue;
    }
    if (!media.media_url_https) {
      continue;
    }

    try {
      const mediaUrl = getHighQualityMediaUrl(media);
      if (!mediaUrl) {
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
      void error;
    }
  }

  return mediaItems;
}

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

export function normalizeLegacyUser(user: TwitterUser): void {
  if (user.legacy) {
    if (!user.screen_name && user.legacy.screen_name) {
      user.screen_name = user.legacy.screen_name;
    }
    if (!user.name && user.legacy.name) {
      user.name = user.legacy.name;
    }
  }
}

export { getHighQualityMediaUrl, resolveAspectRatio, resolveDimensions };
