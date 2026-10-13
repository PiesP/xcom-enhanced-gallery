// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { logger } from '@shared/logging/logger';
import type {
  TweetMediaEntry,
  TwitterMedia,
  TwitterTweet,
  TwitterUser,
} from '@shared/services/media/types';
import type { VideoSourceVariant } from '@shared/types/media.types';
import { extractDimensionsFromUrl, normalizeDimension } from '@shared/utils/media/media-dimensions';
import { normalizeOriginalImageUrl } from '@shared/utils/media/media-source';
import { escapeRegExp } from '@shared/utils/text/formatting';
import { isValidMediaUrl } from '@shared/utils/url/validator';

const MAX_VIDEO_VARIANT_URLS = 32;

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

function getVideoVariants(media: TwitterMedia): readonly VideoSourceVariant[] {
  const variants = Array.isArray(media.video_info?.variants) ? media.video_info.variants : [];
  const seen = new Set<string>();
  const accepted: VideoSourceVariant[] = [];
  for (const variant of variants) {
    if (
      variant?.content_type !== 'video/mp4' ||
      typeof variant.url !== 'string' ||
      !isValidMediaUrl(variant.url)
    )
      continue;
    const parsed = new URL(variant.url);
    if (
      parsed.hostname !== 'video.twimg.com' ||
      !parsed.pathname.toLowerCase().endsWith('.mp4') ||
      seen.has(variant.url)
    )
      continue;
    seen.add(variant.url);
    const bitrate =
      typeof variant.bitrate === 'number' &&
      Number.isSafeInteger(variant.bitrate) &&
      variant.bitrate >= 0
        ? variant.bitrate
        : undefined;
    const dimensions = extractDimensionsFromUrl(variant.url);
    accepted.push(
      Object.freeze({
        url: variant.url,
        contentType: 'video/mp4',
        ...(bitrate !== undefined ? { bitrate } : {}),
        ...(dimensions ?? {}),
      })
    );
  }
  accepted.sort((left, right) => (right.bitrate ?? 0) - (left.bitrate ?? 0));
  return Object.freeze(accepted.slice(0, MAX_VIDEO_VARIANT_URLS));
}

function getVideoHighQualityUrl(media: TwitterMedia): string | null {
  return getVideoVariants(media)[0]?.url ?? null;
}

function getUnsupportedHlsUrls(media: TwitterMedia): readonly string[] {
  const accepted = new Set<string>();
  if (Array.isArray(media.video_info?.variants)) {
    for (const variant of media.video_info.variants) {
      if (
        !variant ||
        !['application/x-mpegurl', 'application/vnd.apple.mpegurl'].includes(
          variant.content_type?.toLowerCase()
        ) ||
        typeof variant.url !== 'string' ||
        !isValidMediaUrl(variant.url)
      )
        continue;
      const parsed = new URL(variant.url);
      if (parsed.hostname === 'video.twimg.com' && parsed.pathname.toLowerCase().endsWith('.m3u8'))
        accepted.add(variant.url);
      if (accepted.size === MAX_VIDEO_VARIANT_URLS) break;
    }
  }
  return Object.freeze([...accepted]);
}

export function getHighQualityMediaUrl(media: TwitterMedia): string | null {
  if (media.type === 'photo')
    return media.media_url_https
      ? (normalizeOriginalImageUrl(media.media_url_https) ?? media.media_url_https)
      : (media.media_url_https ?? null);
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
  const videoVariants = mediaType === 'video' ? getVideoVariants(media) : undefined;

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
    ...(videoVariants && {
      videoVariants,
      videoVariantUrls: Object.freeze(videoVariants.map(({ url }) => url)),
    }),
    ...(media.ext_alt_text?.trim() ? { alt_text: media.ext_alt_text.trim() } : {}),
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
  // The client selects and normalizes the intended tweet exactly once.
  // Provenance labels never authorize traversing another quote descendant.
  const target = tweetResult;

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
    if (
      !media?.type ||
      !media.id_str ||
      !media.media_url_https ||
      !isValidMediaUrl(media.media_url_https)
    )
      continue;

    try {
      const mediaUrl = getHighQualityMediaUrl(media);
      if (!mediaUrl || !isValidMediaUrl(mediaUrl)) {
        const unsupportedVariantUrls = getUnsupportedHlsUrls(media);
        if (
          (media.type === 'video' || media.type === 'animated_gif') &&
          unsupportedVariantUrls.length > 0
        ) {
          mediaItems.push({
            ...createMediaEntry(
              media,
              '',
              screenName,
              tweetId,
              normalizedTweetText,
              i,
              sourceLocation
            ),
            availability: 'unsupported-hls',
            download_url: '',
            unsupportedVariantUrls,
          });
        }
        continue;
      }
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
    } catch {
      __DEV__ && logger.debug('[TwitterParser] Skipping invalid media entry');
    }
  }

  return mediaItems;
}

export function normalizeLegacyTweet(tweet: TwitterTweet): TwitterTweet {
  if (!tweet.legacy && !tweet.note_tweet?.note_tweet_results?.result?.text) {
    return tweet;
  }

  // Create a mutable copy to avoid violating readonly interfaces.
  // ponytail: cast through Record<string, unknown> to strip readonly modifiers.
  const result = { ...(tweet as unknown as Record<string, unknown>) };
  if (tweet.legacy) {
    if (!result.extended_entities && tweet.legacy.extended_entities) {
      result.extended_entities = tweet.legacy.extended_entities;
    }
    if (!result.full_text && tweet.legacy.full_text) {
      result.full_text = tweet.legacy.full_text;
    }
    if (!result.id_str && tweet.legacy.id_str) {
      result.id_str = tweet.legacy.id_str;
    }
  }
  const noteText = tweet.note_tweet?.note_tweet_results?.result?.text;
  if (noteText) {
    result.full_text = noteText;
  }

  return result as unknown as TwitterTweet;
}

export function normalizeLegacyUser(user: TwitterUser): TwitterUser {
  if (!user.legacy) return user;

  const result = { ...(user as unknown as Record<string, unknown>) };
  if (!result.screen_name && user.legacy.screen_name) {
    result.screen_name = user.legacy.screen_name;
  }
  if (!result.name && user.legacy.name) {
    result.name = user.legacy.name;
  }

  return result as unknown as TwitterUser;
}
