// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { MAX_ANCESTOR_HOPS } from '@constants/performance';
import { logger } from '@shared/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
} from '@shared/utils/media/media-element-utils';
import { normalizeMediaUrl } from '@shared/utils/media/media-url-utils';

export function determineClickedIndex(
  clickedElement: HTMLElement,
  mediaItems: MediaInfo[]
): number {
  try {
    const elementUrl = resolveClickedElementUrl(clickedElement);
    if (!elementUrl) return 0;

    const normalizedElementUrl = normalizeMediaUrl(elementUrl);
    if (!normalizedElementUrl) return 0;

    const index = mediaItems.findIndex((item) => {
      if (!item) return false;
      return getNormalizedMediaCandidates(item).includes(normalizedElementUrl);
    });

    return index >= 0 ? index : 0;
  } catch (error) {
    if (__DEV__) {
      logger.warn('[determineClickedIndex] failed', error);
    }
    return 0;
  }
}

function resolveClickedElementUrl(clickedElement: HTMLElement): string | null {
  const mediaElement = findMediaElementInDOM(clickedElement);
  const elementUrl = mediaElement ? extractMediaUrlFromElement(mediaElement) : null;
  if (elementUrl) return elementUrl;

  const fallbackTarget = mediaElement ?? clickedElement;
  return extractBackgroundImageUrl(fallbackTarget, MAX_ANCESTOR_HOPS);
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

function getNormalizedMediaCandidates(item: MediaInfo): string[] {
  const candidates: Array<string | null | undefined> = [
    item.url,
    item.originalUrl,
    item.thumbnailUrl,
  ];

  const metadata = item.metadata as Record<string, unknown> | undefined;
  const apiData = metadata?.apiData as Record<string, unknown> | undefined;
  if (apiData) {
    candidates.push(
      typeof apiData.download_url === 'string' && (apiData.download_url as string).trim()
        ? (apiData.download_url as string)
        : null,
      typeof apiData.preview_url === 'string' && (apiData.preview_url as string).trim()
        ? (apiData.preview_url as string)
        : null
    );
  }

  const normalized = candidates
    .map((candidate) => (candidate ? normalizeMediaUrl(candidate) : null))
    .filter((candidate): candidate is string => !!candidate);

  return Array.from(new Set(normalized));
}
