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

interface MediaDimensions {
  readonly width?: number;
  readonly height?: number;
}

function resolveDimensions(media: TwitterMedia, mediaUrl: string): MediaDimensions {
  const fromUrl = extractDimensionsFromUrl(mediaUrl);
  const w = normalizeDimension(media.original_info?.width) ?? fromUrl?.width;
  const h = normalizeDimension(media.original_info?.height) ?? fromUrl?.height;
  const result: { width?: number; height?: number } = {};
  if (w) result.width = w;
  if (h) result.height = h;
  return result;
}

function removeUrlTokensFromText(text: string, urls: readonly string[]): string {
  let result = text;
  for (const url of urls) {
    if (!url) continue;
    const token = escapeRegExp(url);
    result = result.replace(new RegExp(`(^|\\s+)${token}(?=\\s+|$)`, 'g'), (_, ws: string) => ws);
  }
  return result
    .replace(/[ \t\f\v\u00A0]{2,}/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function resolveAspectRatio(
  media: TwitterMedia,
  dims: MediaDimensions
): [number, number] | undefined {
  const ratio = Array.isArray(media.video_info?.aspect_ratio)
    ? media.video_info.aspect_ratio
    : undefined;
  const rw = normalizeDimension(ratio?.[0]);
  const rh = normalizeDimension(ratio?.[1]);
  if (rw && rh) return [rw, rh];
  if (dims.width && dims.height) return [dims.width, dims.height];
  return undefined;
}

function buildHighQualityUrl(path: string, query: string): string {
  const extMatch = path.match(/\.(jpe?g|png)$/i);
  if (!extMatch) return `${path}?${query}`;
  const ext = extMatch[1]!.toLowerCase();
  const params = new URLSearchParams(query);
  if (!Array.from(params.keys()).some((k) => k.toLowerCase() === 'format')) {
    params.set('format', ext);
  }
  params.set('name', 'orig');
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

function getPhotoHighQualityUrl(mediaUrlHttps?: string): string | undefined {
  if (!mediaUrlHttps) return mediaUrlHttps;

  const isAbsolute = /^(https?:)?\/\//i.test(mediaUrlHttps);
  const parsed = tryParseUrl(mediaUrlHttps, 'https://pbs.twimg.com');

  if (!parsed) {
    const [path = '', query = ''] = mediaUrlHttps.split('?');
    return buildHighQualityUrl(path, query);
  }

  const setParamCI = (key: string, value: string): void => {
    for (const k of Array.from(parsed.searchParams.keys())) {
      if (k !== key && k.toLowerCase() === key) parsed.searchParams.delete(k);
    }
    parsed.searchParams.set(key, value);
  };

  const pathMatch = parsed.pathname.match(/\.(jpe?g|png)$/i);
  if (!pathMatch) return mediaUrlHttps;
  const ext = pathMatch[1]!.toLowerCase();

  if (!Array.from(parsed.searchParams.keys()).some((k) => k.toLowerCase() === 'format')) {
    setParamCI('format', ext);
  }
  setParamCI('name', 'orig');

  return isAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}`;
}

function getVideoHighQualityUrl(media: TwitterMedia): string | null {
  const mp4s = (media.video_info?.variants ?? []).filter((v) => v.content_type === 'video/mp4');
  if (mp4s.length === 0) return null;
  return mp4s.reduce((best, cur) => ((cur.bitrate ?? 0) > (best.bitrate ?? 0) ? cur : best)).url;
}

export function getHighQualityMediaUrl(media: TwitterMedia): string | null {
  if (media.type === 'photo') return getPhotoHighQualityUrl(media.media_url_https) ?? null;
  if (media.type === 'video' || media.type === 'animated_gif') return getVideoHighQualityUrl(media);
  return null;
}

function createMediaEntry(
  media: TwitterMedia,
  mediaUrl: string,
  screenName: string,
  tweetId: string,
  tweetText: string,
  index: number,
  sourceLocation: 'original' | 'quoted'
): TweetMediaEntry {
  const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
  const dims = resolveDimensions(media, mediaUrl);
  const aspectRatio = resolveAspectRatio(media, dims);

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
    ...(dims.width && { original_width: dims.width }),
    ...(dims.height && { original_height: dims.height }),
    ...(aspectRatio && { aspect_ratio: aspectRatio }),
  };
}

function sortByInlineOrder(
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
    .map((media, i) => ({ media, originalIndex: i }))
    .sort((a, b) => {
      const li = orderMap.get(a.media.id_str);
      const ri = orderMap.get(b.media.id_str);
      if (li !== undefined && ri !== undefined) return li - ri;
      if (li !== undefined) return -1;
      if (ri !== undefined) return 1;
      return a.originalIndex - b.originalIndex;
    })
    .map((e) => e.media);
}

export function extractMediaFromTweet(
  tweetResult: TwitterTweet,
  tweetUser: TwitterUser,
  sourceLocation: 'original' | 'quoted' = 'original'
): TweetMediaEntry[] {
  const quotedResult = tweetResult.quoted_status_result?.result;
  const target: TwitterTweet =
    sourceLocation === 'quoted' && quotedResult ? quotedResult : tweetResult;

  if (!target.extended_entities?.media) return [];

  const screenName = tweetUser.screen_name ?? '';
  const tweetId = target.rest_id ?? target.id_str ?? '';
  const inlineMedia = target.note_tweet?.note_tweet_results?.result?.media?.inline_media;
  const orderedMedia = sortByInlineOrder(target.extended_entities.media, inlineMedia);

  const baseTweetText = (target.full_text ?? '').trim();
  const mediaShortUrls = orderedMedia
    .map((m) => m.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);
  const normalizedTweetText = removeUrlTokensFromText(baseTweetText, mediaShortUrls);

  const mediaItems: TweetMediaEntry[] = [];

  for (let i = 0; i < orderedMedia.length; i++) {
    const media = orderedMedia[i];
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
          i,
          sourceLocation
        )
      );
    } catch (error) {
      if (__DEV__) logger.debug('[TwitterParser] Skipping media entry', { error });
    }
  }

  return mediaItems;
}

export function normalizeLegacyTweet(tweet: TwitterTweet): void {
  if (tweet.legacy) {
    if (!tweet.extended_entities) {
      Object.assign(tweet, { extended_entities: tweet.legacy.extended_entities });
    }
    if (!tweet.full_text) {
      Object.assign(tweet, { full_text: tweet.legacy.full_text });
    }
    if (!tweet.id_str) {
      Object.assign(tweet, { id_str: tweet.legacy.id_str });
    }
  }
  const noteText = tweet.note_tweet?.note_tweet_results?.result?.text;
  if (noteText) {
    Object.assign(tweet, { full_text: noteText });
  }
}

export function normalizeLegacyUser(user: TwitterUser): void {
  if (user.legacy) {
    if (!user.screen_name) {
      Object.assign(user, { screen_name: user.legacy.screen_name });
    }
    if (!user.name) {
      Object.assign(user, { name: user.legacy.name });
    }
  }
}
