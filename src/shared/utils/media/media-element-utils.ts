// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media element utilities: DOM traversal for finding media descendants and ancestors.
 */

import { MAX_ANCESTOR_HOPS, MAX_DESCENDANT_DEPTH } from '@constants/performance';

const VIDEO_PLAYER_SELECTOR = '[data-testid="videoPlayer"]';
// The authenticated X click target was seven ancestors below its videoPlayer.
// Leave a bounded margin for equivalent overlays without searching the page.
const MAX_VIDEO_PLAYER_ANCESTOR_HOPS = 12;

export type MediaElement = HTMLImageElement | HTMLVideoElement;

export type MediaTraversalOptions = {
  readonly maxDescendantDepth?: number;
  readonly maxAncestorHops?: number;
};

type DescendantSearchConfig = {
  readonly includeRoot: boolean;
  readonly maxDepth: number;
};

type QueueNode = {
  readonly node: HTMLElement;
  readonly depth: number;
};

const DEFAULT_TRAVERSAL_OPTIONS: Required<MediaTraversalOptions> = {
  maxDescendantDepth: MAX_DESCENDANT_DEPTH,
  maxAncestorHops: MAX_ANCESTOR_HOPS,
};

export function isMediaElement(element: HTMLElement | null): element is MediaElement {
  if (!element) return false;
  return element.tagName === 'IMG' || element.tagName === 'VIDEO';
}

export function findMediaElementInDOM(
  target: HTMLElement,
  options: MediaTraversalOptions = {}
): MediaElement | null {
  const { maxDescendantDepth, maxAncestorHops } = {
    ...DEFAULT_TRAVERSAL_OPTIONS,
    ...options,
  };

  if (isMediaElement(target)) return target;

  // X can place a click overlay deeper than the generic ancestor limit. A
  // videoPlayer is an explicit boundary: select only its one owned video, never
  // a video from an adjacent or nested player.
  const playerHopLimit =
    options.maxAncestorHops === undefined
      ? MAX_VIDEO_PLAYER_ANCESTOR_HOPS
      : Math.max(0, Math.min(maxAncestorHops, MAX_VIDEO_PLAYER_ANCESTOR_HOPS));
  const player = findNearestVideoPlayer(target, playerHopLimit);
  if (player) return findUniqueVideoInPlayer(player, maxDescendantDepth);

  const descendant = findMediaDescendant(target, {
    includeRoot: false,
    maxDepth: maxDescendantDepth,
  });
  if (descendant) return descendant;

  let branch: HTMLElement | null = target;
  for (let hops = 0; hops < maxAncestorHops && branch; hops++) {
    branch = branch.parentElement;
    if (!branch) break;
    const ancestorMedia = findMediaDescendant(branch, {
      includeRoot: true,
      maxDepth: maxDescendantDepth,
    });
    if (ancestorMedia) return ancestorMedia;
  }

  return null;
}

function findNearestVideoPlayer(target: HTMLElement, maxHops: number): HTMLElement | null {
  let branch: HTMLElement | null = target;
  for (let hops = 0; hops <= maxHops && branch; hops++) {
    if (branch.matches(VIDEO_PLAYER_SELECTOR)) return branch;
    branch = branch.parentElement;
  }
  return null;
}

function findUniqueVideoInPlayer(player: HTMLElement, maxDepth: number): HTMLVideoElement | null {
  const queue: QueueNode[] = [{ node: player, depth: 0 }];
  let head = 0;
  let found: HTMLVideoElement | null = null;

  while (head < queue.length) {
    const current = queue[head++];
    if (!current) break;
    const { node, depth } = current;
    if (node !== player && node.matches(VIDEO_PLAYER_SELECTOR)) continue;
    if (node instanceof HTMLVideoElement) {
      if (found) return null;
      found = node;
    }
    if (depth >= maxDepth) continue;
    for (const child of Array.from(node.children)) {
      if (child instanceof HTMLElement) queue.push({ node: child, depth: depth + 1 });
    }
  }

  return found;
}

export function extractMediaUrlFromElement(element: MediaElement): string | null {
  return extractMediaUrlCandidatesFromElement(element)[0] ?? null;
}

/** The source used for DOM output; posters and backgrounds cannot supply it. */
export function selectMediaSourceUrl(element: MediaElement): string | null {
  if (element instanceof HTMLImageElement)
    return element.currentSrc || (element.getAttribute('src') ? element.src : null);

  if (element.currentSrc) return element.currentSrc;
  if (element.getAttribute('src')) return element.src;

  const sources = Array.from(element.querySelectorAll<HTMLSourceElement>(':scope > source'))
    .map((source) => (source.getAttribute('src') ? source.src : null))
    .filter((source): source is string => !!source);
  return sources.length === 1 ? sources[0]! : null;
}

export function extractMediaUrlCandidatesFromElement(element: MediaElement): string[] {
  const isImage = element instanceof HTMLImageElement;

  if (isImage) {
    const attr = element.getAttribute('src');
    const current = element.currentSrc || null;
    const resolved = attr ? element.src : null;
    return collectUniqueTruthy([current, resolved, attr]);
  }

  const attr = element.getAttribute('src');
  const posterAttr = element.getAttribute('poster');
  const current = element.currentSrc || null;
  const resolved = attr ? element.src : null;
  const posterResolved = posterAttr ? element.poster : null;
  const selected = selectMediaSourceUrl(element);
  return collectUniqueTruthy([current, resolved, attr, selected, posterResolved, posterAttr]);
}

function findMediaDescendant(
  root: HTMLElement,
  { includeRoot, maxDepth }: DescendantSearchConfig
): MediaElement | null {
  const queue: QueueNode[] = [{ node: root, depth: 0 }];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    if (!current) break;

    const { node, depth } = current;

    if ((includeRoot || node !== root) && isMediaElement(node)) {
      return node;
    }

    if (depth >= maxDepth) continue;

    for (const child of Array.from(node.children)) {
      if (child instanceof HTMLElement) {
        queue.push({ node: child, depth: depth + 1 });
      }
    }
  }

  return null;
}

function collectUniqueTruthy(values: Array<string | null | undefined>): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (value && !result.includes(value)) result.push(value);
  }
  return result;
}
