// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Bounded media proof for an unmarked native video button on X. */

import { isVideoThumbnailUrl } from '@shared/utils/media/video-preview';
import { isValidMediaUrl } from '@shared/utils/url/validator';

const MAX_SCOPE_HOPS = 3;
const MAX_VIDEO_SOURCES = 8;
const FORBIDDEN_CONTROL_CONTEXT = [
  'a',
  'nav',
  '[role="toolbar"]',
  '[role="menu"]',
  'form',
  '[data-testid="videoPlayer"]',
  '[data-testid="card.wrapper"]',
  '[data-testid="reply"]',
  '[data-testid="like"]',
  '[data-testid="retweet"]',
  '[data-testid="share"]',
  '[data-testid="bookmark"]',
].join(', ');
const CANDIDATE_OWNER_BOUNDARY = `${FORBIDDEN_CONTROL_CONTEXT}, button, [role="link"], [data-testid="quoteTweet"]`;

export interface NativeVideoControlMedia {
  readonly video: HTMLVideoElement | null;
  readonly thumbnail: HTMLImageElement | null;
  readonly thumbnailUrl: string | null;
}

function thumbnailIdentity(url: string): string | null {
  if (!isVideoThumbnailUrl(url)) return null;
  const parsed = new URL(url, 'https://x.com');
  let path = parsed.pathname;
  if (!/\.[A-Za-z0-9]+$/u.test(path)) {
    const format = parsed.searchParams.get('format');
    if (format && /^(?:jpg|jpeg|png|webp|gif)$/u.test(format)) path += `.${format}`;
  }
  return `${parsed.hostname}${path}`;
}

type ThumbnailCheck =
  | { readonly kind: 'ordinary' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'trusted'; readonly url: string };

function inspectThumbnail(image: HTMLImageElement): ThumbnailCheck {
  const current = image.currentSrc || null;
  const attribute = image.getAttribute('src') ? image.src : null;
  const currentKey = current ? thumbnailIdentity(current) : null;
  const attributeKey = attribute ? thumbnailIdentity(attribute) : null;
  if (!currentKey && !attributeKey) return { kind: 'ordinary' };
  if ((current && !currentKey) || (attribute && !attributeKey)) return { kind: 'invalid' };
  if (currentKey && attributeKey && currentKey !== attributeKey) return { kind: 'invalid' };
  return { kind: 'trusted', url: current || attribute! };
}

function isTrustedVideoSource(url: string): boolean {
  if (!isValidMediaUrl(url)) return false;
  const parsed = new URL(url);
  return parsed.hostname === 'video.twimg.com' && parsed.pathname.endsWith('.mp4');
}

/** Reject invalid direct inputs while retaining every source for click-time capture. */
function hasTrustedVideoInput(video: HTMLVideoElement): boolean | null {
  const sources = Array.from(video.querySelectorAll<HTMLSourceElement>(':scope > source'));
  if (sources.length > MAX_VIDEO_SOURCES) return null;
  const direct = [
    video.currentSrc,
    video.getAttribute('src') ? video.src : null,
    ...sources.map((source) => (source.getAttribute('src') ? source.src : null)),
  ];
  let trusted = false;
  for (const url of direct) {
    if (!url || url.startsWith('blob:')) continue;
    if (!isTrustedVideoSource(url)) return null;
    trusted = true;
  }
  if (video.getAttribute('poster')) {
    if (!isVideoThumbnailUrl(video.poster)) return null;
    trusted = true;
  }
  return trusted;
}

function sharesControlOwner(candidate: HTMLElement, button: HTMLButtonElement): boolean {
  const boundary = candidate.closest(CANDIDATE_OWNER_BOUNDARY);
  return !boundary || boundary.contains(button);
}

/**
 * Select the nearest small scope with one trusted video thumbnail, or one
 * directly trusted VIDEO. Ordinary images never identify media or owners.
 */
export function findNativeVideoControlMedia(target: HTMLElement): NativeVideoControlMedia | null {
  const button = target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return null;
  if (button.hasAttribute('data-testid') || button.closest(FORBIDDEN_CONTROL_CONTEXT)) return null;
  const article = button.closest('article');
  if (!article) return null;

  let scope: HTMLElement | null = button.parentElement;
  for (let hops = 0; hops < MAX_SCOPE_HOPS && scope && scope !== article; hops++) {
    if (scope.querySelector('article')) return null;
    const videos: NodeListOf<HTMLVideoElement> = scope.querySelectorAll('video');
    if (videos.length > 1) return null;
    const video: HTMLVideoElement | null = videos[0] ?? null;
    if (video && (video.closest('article') !== article || !sharesControlOwner(video, button)))
      return null;

    let thumbnail: HTMLImageElement | null = null;
    let thumbnailUrl: string | null = null;
    let imageCount = 0;
    for (const image of scope.querySelectorAll('img')) {
      imageCount++;
      if (image.closest('article') !== article) return null;
      const check = inspectThumbnail(image);
      if (check.kind === 'invalid') return null;
      if (check.kind !== 'trusted') continue;
      if (!sharesControlOwner(image, button)) return null;
      if (thumbnail) return null;
      thumbnail = image;
      thumbnailUrl = check.url;
    }

    const trustedVideoInput = video ? hasTrustedVideoInput(video) : false;
    if (trustedVideoInput === null) return null;
    if (thumbnail || (video && trustedVideoInput && imageCount === 0)) {
      return { video, thumbnail, thumbnailUrl };
    }
    scope = scope.parentElement;
  }
  return null;
}
