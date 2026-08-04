// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media element utilities: DOM traversal for finding media descendants and ancestors.
 */

import { MAX_ANCESTOR_HOPS, MAX_DESCENDANT_DEPTH } from '@constants/performance';

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

export function extractMediaUrlFromElement(element: MediaElement): string | null {
  return extractMediaUrlCandidatesFromElement(element)[0] ?? null;
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
  return collectUniqueTruthy([current, resolved, attr, posterResolved, posterAttr]);
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
