// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { captureClickedMediaEvidence } from '@shared/services/media-extraction/determine-clicked-index';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import type { ClickedMediaEvidence, ClickedMediaOwnership } from '@shared/types/media.types';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { getMediaClickTarget } from '@shared/utils/media/media-click-target';
import { findMediaElementInDOM } from '@shared/utils/media/media-element-utils';
import { findNativeVideoControlMedia } from '@shared/utils/media/native-video-control';

const MAX_ANCESTRY_DEPTH = 64;
const MAX_SOURCE_ELEMENTS = 8;

interface ClickIdentity {
  readonly ancestry: readonly Element[];
  readonly owner: OwnerIdentity | null;
  readonly evidence: ClickedMediaEvidence;
  readonly media: HTMLImageElement | HTMLVideoElement | null;
  readonly thumbnail: HTMLImageElement | null;
  readonly sourceValues: readonly string[];
}

interface OwnerIdentity {
  readonly tweetId: string;
  readonly tweetUrl: string;
  readonly requestTweetId: string;
  readonly ownerTweetId: string | null;
  readonly scope: ClickedMediaOwnership['scope'];
}

interface PendingClick {
  readonly event: MouseEvent;
  readonly target: HTMLElement;
  readonly identity: ClickIdentity;
}

function ancestryOf(original: Element, documentRef: Document): readonly Element[] | null {
  const ancestry: Element[] = [];
  for (
    let element: Element | null = original;
    element && ancestry.length < MAX_ANCESTRY_DEPTH;
    element = element.parentElement
  ) {
    ancestry.push(element);
    if (element === documentRef.documentElement) return ancestry;
  }
  return null;
}

function sourceValuesOf(
  media: HTMLImageElement | HTMLVideoElement | null
): readonly string[] | null {
  if (!media) return [];
  if (media instanceof HTMLImageElement) {
    return [media.currentSrc, media.getAttribute('src') ?? '', media.getAttribute('srcset') ?? ''];
  }
  const sources = Array.from(media.querySelectorAll<HTMLSourceElement>(':scope > source'));
  if (sources.length > MAX_SOURCE_ELEMENTS) return null;
  return [
    media.currentSrc,
    media.getAttribute('src') ?? '',
    media.getAttribute('poster') ?? '',
    ...sources.map((source) => source.getAttribute('src') ?? ''),
  ];
}

function ownerOf(target: HTMLElement, extractor: TweetInfoExtractor): OwnerIdentity | null {
  const context = extractor.extractContext(target);
  if (!context) return null;
  return {
    tweetId: context.tweetInfo.tweetId,
    tweetUrl: context.tweetInfo.tweetUrl,
    requestTweetId: context.ownership.requestTweetId,
    ownerTweetId: context.ownership.ownerTweetId,
    scope: context.ownership.scope,
  };
}

function captureIdentity(
  event: MouseEvent,
  target: HTMLElement,
  documentRef: Document,
  extractor: TweetInfoExtractor
): ClickIdentity | null {
  const original = event.target;
  if (!(original instanceof Element)) return null;
  const ancestry = ancestryOf(original, documentRef);
  if (!ancestry) return null;
  try {
    const nativeControl = findNativeVideoControlMedia(target);
    const media = nativeControl?.video ?? nativeControl?.thumbnail ?? findMediaElementInDOM(target);
    const sourceValues = sourceValuesOf(media);
    if (!sourceValues) return null;
    return {
      ancestry,
      owner: ownerOf(target, extractor),
      evidence: captureClickedMediaEvidence(target),
      media,
      thumbnail: nativeControl?.thumbnail ?? null,
      sourceValues,
    };
  } catch {
    return null;
  }
}

function sameList<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameOwner(left: OwnerIdentity | null, right: OwnerIdentity | null): boolean {
  if (!left || !right) return left === right;
  return (
    left.tweetId === right.tweetId &&
    left.tweetUrl === right.tweetUrl &&
    left.requestTweetId === right.requestTweetId &&
    left.ownerTweetId === right.ownerTweetId &&
    left.scope === right.scope
  );
}

function sameEvidence(left: ClickedMediaEvidence, right: ClickedMediaEvidence): boolean {
  return (
    left.mediaType === right.mediaType &&
    left.sourceKey === right.sourceKey &&
    left.invalidSource === right.invalidSource &&
    sameList(left.urls, right.urls) &&
    sameList(left.identityKeys ?? [], right.identityKeys ?? [])
  );
}

function sameIdentity(left: ClickIdentity, right: ClickIdentity): boolean {
  return (
    sameList(left.ancestry, right.ancestry) &&
    sameOwner(left.owner, right.owner) &&
    sameEvidence(left.evidence, right.evidence) &&
    left.media === right.media &&
    left.thumbnail === right.thumbnail &&
    sameList(left.sourceValues, right.sourceValues)
  );
}

export interface EarlyMediaClickReplay {
  complete(resume: (event: MouseEvent) => Promise<void>): Promise<void>;
  dispose(): void;
}

/**
 * Capture the latest valid media click while asynchronous extension bootstrap is
 * still installing the gallery listener. Retain the original trusted event for
 * a private application callback; redispatching it would lose its trusted state.
 */
export function installEarlyMediaClickReplay(
  documentRef: Document = document
): EarlyMediaClickReplay {
  let pendingClick: PendingClick | null = null;
  let disposed = false;
  const extractor = new TweetInfoExtractor();

  const handleClick = (event: MouseEvent): void => {
    if (!event.isTrusted) return;
    const target = getMediaClickTarget(event);
    if (!target?.isConnected || !isProcessableMedia(target, event)) return;
    const identity = captureIdentity(event, target, documentRef, extractor);
    if (!identity) return;

    event.stopImmediatePropagation();
    event.preventDefault();
    pendingClick = { event, target, identity };
  };

  documentRef.addEventListener('click', handleClick, { capture: true });

  const removeListener = (): void => {
    documentRef.removeEventListener('click', handleClick, { capture: true });
  };

  return {
    async complete(resume): Promise<void> {
      if (disposed) return;
      disposed = true;
      removeListener();

      const pending = pendingClick;
      pendingClick = null;
      if (
        pending?.event.isTrusted &&
        pending.target.isConnected &&
        getMediaClickTarget(pending.event) === pending.target &&
        // A mode change during bootstrap can revoke this click's routing.
        isProcessableMedia(pending.target, pending.event)
      ) {
        const current = captureIdentity(pending.event, pending.target, documentRef, extractor);
        if (current && sameIdentity(pending.identity, current)) await resume(pending.event);
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      pendingClick = null;
      removeListener();
    },
  };
}
