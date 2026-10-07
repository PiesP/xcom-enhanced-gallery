// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { MAX_ANCESTOR_HOPS } from '@constants/performance';
import { logger } from '@shared/logging/logger';
import type { ClickedMediaEvidence, MediaInfo } from '@shared/types/media.types';
import {
  extractMediaUrlCandidatesFromElement,
  findMediaElementInDOM,
  selectMediaSourceUrl,
} from '@shared/utils/media/media-element-utils';
import { normalizeMediaUrl } from '@shared/utils/media/media-url-utils';
import { isVideoPreview } from '@shared/utils/media/video-preview';
import { isValidMediaUrl } from '@shared/utils/url/validator';

type ClickedMediaMatch =
  | { status: 'matched'; index: number }
  | { status: 'unknown'; index: number | null }
  | { status: 'contradictory'; index: 0 };

/** Snapshot only immutable selection evidence before asynchronous extraction. */
export function captureClickedMediaEvidence(clickedElement: HTMLElement): ClickedMediaEvidence {
  const mediaElement = findMediaElementInDOM(clickedElement);
  const expectsVideo =
    mediaElement instanceof HTMLVideoElement ||
    isVideoPreview(clickedElement) ||
    (mediaElement !== null && isVideoPreview(mediaElement));
  const urls = resolveClickedElementUrls(clickedElement)
    .map((url) => normalizeMediaUrl(url))
    .filter((url): url is string => !!url);
  const selectedSource = mediaElement ? selectMediaSourceUrl(mediaElement) : null;
  const sourceKey =
    mediaElement && (!expectsVideo || mediaElement instanceof HTMLVideoElement)
      ? getMediaSourceKey(selectedSource)
      : null;
  const sources =
    mediaElement instanceof HTMLVideoElement
      ? Array.from(mediaElement.querySelectorAll<HTMLSourceElement>(':scope > source'))
      : [];
  const directUrls =
    mediaElement instanceof HTMLVideoElement
      ? [
          mediaElement.currentSrc,
          mediaElement.getAttribute('src') ? mediaElement.src : null,
          ...sources.slice(0, 8).map((source) => (source.getAttribute('src') ? source.src : null)),
          mediaElement.getAttribute('poster') ? mediaElement.poster : null,
        ]
      : mediaElement
        ? [selectMediaSourceUrl(mediaElement)]
        : [];
  const identityKeys = isBoundedClickedMedia(clickedElement, mediaElement)
    ? directUrls.flatMap((url) => {
        const key = getMediaIdentityKey(url);
        return key ? [key] : [];
      })
    : [];
  return Object.freeze({
    urls: Object.freeze([...new Set(urls)]),
    mediaType: expectsVideo ? 'video' : mediaElement instanceof HTMLImageElement ? 'image' : null,
    sourceKey,
    identityKeys: Object.freeze([...new Set(identityKeys)]),
    invalidSource:
      sources.length > 8 ||
      directUrls.some((url) => !!url && !url.startsWith('blob:') && !getMediaIdentityKey(url)),
  });
}

function isBoundedClickedMedia(element: HTMLElement, media: HTMLElement | null): boolean {
  if (!media) return false;
  if (element === media) return true;
  const article = element.closest('article');
  for (
    let node: HTMLElement | null = element, hops = 0;
    node && node !== article && hops < 5;
    node = node.parentElement, hops++
  ) {
    if (node.matches('[data-testid="card.wrapper"]')) return false;
    if (!node.contains(media)) continue;
    const candidates = Array.from(node.querySelectorAll('video, img')).filter(
      (candidate) =>
        candidate.closest('article') === article &&
        (media instanceof HTMLVideoElement
          ? candidate instanceof HTMLVideoElement
          : candidate instanceof HTMLImageElement)
    );
    return candidates.length === 1 && candidates[0] === media;
  }
  return false;
}

/** Preserve host and parent path while allowing supported size/format URL variants. */
export function getMediaSourceKey(url: string | null): string | null {
  if (!url || !isValidMediaUrl(url)) return null;
  const parsed = new URL(url, 'https://x.com');
  if (parsed.hostname === 'video.twimg.com') return `${parsed.hostname}${parsed.pathname}`;
  const name = normalizeMediaUrl(url);
  if (!name) return null;
  return `${parsed.hostname}${parsed.pathname.slice(0, parsed.pathname.lastIndexOf('/') + 1)}${name}`;
}

/** Exact thumbnail paths, allowing the explicit extensionless format spelling. */
function getMediaIdentityKey(url: string | null): string | null {
  if (!url || !isValidMediaUrl(url)) return null;
  const parsed = new URL(url, 'https://x.com');
  let path = parsed.pathname;
  if (parsed.hostname === 'pbs.twimg.com' && !/\.[A-Za-z0-9]+$/u.test(path)) {
    const format = parsed.searchParams.get('format');
    if (format && /^(?:jpg|jpeg|png|webp|gif)$/u.test(format)) path += `.${format}`;
  }
  return `${parsed.hostname}${path}`;
}

/** Preserve evidence instead of turning a confirmed mismatch into index zero. */
export function matchClickedMedia(
  clickedElement: HTMLElement | ClickedMediaEvidence,
  mediaItems: MediaInfo[],
  clickedTweetId: string
): ClickedMediaMatch {
  try {
    const evidence =
      clickedElement instanceof HTMLElement
        ? captureClickedMediaEvidence(clickedElement)
        : clickedElement;
    const expectsVideo = evidence.mediaType === 'video';
    const normalizedElementUrls = evidence.urls;
    if (evidence.invalidSource) return { status: 'contradictory', index: 0 };
    if (evidence.ownership?.ownerTweetId === null) {
      // Neither a clickable wrapper nor a single combined video establishes
      // ownership. Require exact direct hints and count every compatible owner.
      const keys = evidence.identityKeys ?? [];
      if (!evidence.mediaType || keys.length === 0) return { status: 'unknown', index: null };
      const matches = mediaItems.flatMap((item, index) => {
        if (expectsVideo ? item.type !== 'video' && item.type !== 'gif' : item.type !== 'image')
          return [];
        const candidates = new Set(
          getMediaCandidates(item).map(getMediaIdentityKey).filter(Boolean)
        );
        return keys.every((key) => candidates.has(key)) ? [index] : [];
      });
      if (matches.length > 1) return { status: 'unknown', index: null };
      const index = matches[0];
      if (index === undefined) return { status: 'contradictory', index: 0 };
      const api = mediaItems[index]?.metadata?.apiData as Record<string, unknown> | undefined;
      const ownership = evidence.ownership;
      const ownRequest =
        ownership.scope === 'clickable' && api?.tweet_id === ownership.requestTweetId;
      const directQuote =
        api?.sourceLocation === 'quoted' &&
        api.quoteParentTweetId === ownership.requestTweetId &&
        api.quotedTweetId === api.tweet_id &&
        typeof api.tweet_id === 'string' &&
        /^[1-9]\d*$/u.test(api.tweet_id) &&
        api.tweet_id !== ownership.requestTweetId;
      return ownRequest || directQuote
        ? { status: 'matched', index }
        : { status: 'contradictory', index: 0 };
    }
    if (normalizedElementUrls.length === 0) {
      // Missing image evidence cannot establish attachment identity or order.
      if (!expectsVideo) return { status: 'unknown', index: null };
      const videos = mediaItems.flatMap((item, index) =>
        item.type === 'video' || item.type === 'gif' ? [index] : []
      );
      if (!videos.length) return { status: 'contradictory', index: 0 };
      // The combined API list includes quote media. Only originating API IDs
      // establish ownership independently of the request/gallery context.
      const compatible = videos.filter((index) => {
        const apiData = mediaItems[index]?.metadata?.apiData;
        if (!apiData || typeof apiData !== 'object' || !('tweet_id' in apiData)) return false;
        return (
          typeof apiData.tweet_id === 'string' &&
          /^\d+$/u.test(apiData.tweet_id) &&
          apiData.tweet_id === clickedTweetId
        );
      });
      return { status: 'unknown', index: compatible.length === 1 ? compatible[0]! : null };
    }

    const clickedCandidates = new Set(normalizedElementUrls);

    const matches = mediaItems.flatMap((item, index) => {
      const matched = (() => {
        if (!item) return false;
        const apiData = item.metadata?.apiData;
        if (
          apiData &&
          typeof apiData === 'object' &&
          (!('tweet_id' in apiData) || apiData.tweet_id !== clickedTweetId)
        )
          return false;
        if (expectsVideo && item.type !== 'video' && item.type !== 'gif') return false;
        if (evidence.mediaType === 'image' && item.type !== 'image') return false;
        const candidates = getMediaCandidates(item);
        if (expectsVideo && evidence.identityKeys?.length) {
          return evidence.identityKeys.every((key) =>
            candidates.some((candidate) => getMediaIdentityKey(candidate) === key)
          );
        }
        return evidence.sourceKey
          ? candidates.some((candidate) => getMediaSourceKey(candidate) === evidence.sourceKey) &&
              (!expectsVideo ||
                !evidence.identityKeys?.length ||
                evidence.identityKeys.every((key) =>
                  candidates.some((candidate) => getMediaSourceKey(candidate) === key)
                ))
          : candidates.some((candidate) => {
              const normalized = normalizeMediaUrl(candidate);
              return !!normalized && clickedCandidates.has(normalized);
            });
      })();
      return matched ? [index] : [];
    });

    if (matches.length > 1) return { status: 'unknown', index: null };
    const index = matches[0];
    return index !== undefined
      ? { status: 'matched', index }
      : { status: 'contradictory', index: 0 };
  } catch (error) {
    if (__DEV__) {
      logger.warn('[determineClickedIndex] failed', error);
    }
    return { status: 'unknown', index: null };
  }
}

function resolveClickedElementUrls(clickedElement: HTMLElement): string[] {
  const mediaElement = findMediaElementInDOM(clickedElement);
  const urls = mediaElement ? extractMediaUrlCandidatesFromElement(mediaElement) : [];

  const fallbackTarget = mediaElement ?? clickedElement;
  const backgroundUrl = extractBackgroundImageUrl(fallbackTarget, MAX_ANCESTOR_HOPS);
  return backgroundUrl ? [...urls, backgroundUrl] : urls;
}

function extractBackgroundImageUrl(
  element: HTMLElement | null,
  maxAncestorHops: number
): string | null {
  if (!element) return null;

  let current: HTMLElement | null = element;
  for (let hops = 0; hops <= maxAncestorHops && current; hops++) {
    const style = globalThis.getComputedStyle?.(current);
    const backgroundImage = style?.backgroundImage ?? '';
    const url = extractUrlFromCssValue(backgroundImage);
    if (url) return url;
    current = current.parentElement;
  }

  return null;
}

function extractUrlFromCssValue(value: string): string | null {
  if (!value || value === 'none') return null;
  const match = value.match(/url\((?:'|")?(.*?)(?:'|")?\)/i);
  return match?.[1]?.trim() || null;
}

function getMediaCandidates(item: MediaInfo): string[] {
  const candidates: Array<string | null | undefined> = [
    item.url,
    item.originalUrl,
    item.thumbnailUrl,
  ];

  const metadata = item.metadata as Record<string, unknown> | undefined;
  const apiData = metadata?.apiData as Record<string, unknown> | undefined;
  if (apiData) {
    if (Array.isArray(apiData.videoVariantUrls)) {
      candidates.push(
        ...apiData.videoVariantUrls
          .slice(0, 32)
          .filter((value): value is string => typeof value === 'string' && isValidMediaUrl(value))
      );
    }
    candidates.push(
      typeof apiData.download_url === 'string' && (apiData.download_url as string).trim()
        ? (apiData.download_url as string)
        : null,
      typeof apiData.preview_url === 'string' && (apiData.preview_url as string).trim()
        ? (apiData.preview_url as string)
        : null
    );
  }

  return Array.from(new Set(candidates.filter((candidate): candidate is string => !!candidate)));
}
