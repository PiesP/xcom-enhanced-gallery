/**
 * @fileoverview Twitter ambient video auto-pause helper.
 * @description Scans the host timeline for actively playing videos and pauses them
 *              before the gallery overlay takes focus.
 */

import { isGalleryInternalElement } from '@shared/dom/utils';
import { logger } from '@shared/logging';

type QueryableRoot = Document | DocumentFragment | HTMLElement;

const ZERO_RESULT = Object.freeze({
  pausedCount: 0,
  totalCandidates: 0,
  skippedCount: 0,
});

export interface PauseAmbientVideosOptions {
  root?: QueryableRoot | null;
}

export interface PauseAmbientVideosResult {
  pausedCount: number;
  totalCandidates: number;
  skippedCount: number;
}

function resolveRoot(root?: QueryableRoot | null): QueryableRoot | null {
  if (root && typeof root.querySelectorAll === 'function') return root;
  return typeof document !== 'undefined' && typeof document.querySelectorAll === 'function'
    ? document
    : null;
}

function isVideoPlaying(video: HTMLVideoElement): boolean {
  try {
    return !video.paused && !video.ended;
  } catch {
    return false;
  }
}

export function pauseActiveTwitterVideos(
  options: PauseAmbientVideosOptions = {},
): PauseAmbientVideosResult {
  const root = resolveRoot(options.root ?? null);
  if (!root) {
    return { ...ZERO_RESULT };
  }

  let pausedCount = 0;
  let totalCandidates = 0;
  let skippedCount = 0;

  const videos = Array.from(root.querySelectorAll('video'));
  if (videos.length === 0) {
    return { ...ZERO_RESULT };
  }

  for (const element of videos) {
    if (!(element instanceof HTMLVideoElement)) {
      skippedCount += 1;
      continue;
    }

    // Skip our own gallery videos
    if (isGalleryInternalElement(element)) {
      skippedCount += 1;
      continue;
    }

    // Skip disconnected videos
    if (!element.isConnected) {
      skippedCount += 1;
      continue;
    }

    if (!isVideoPlaying(element)) {
      skippedCount += 1;
      continue;
    }

    totalCandidates += 1;
    try {
      element.pause?.();
      pausedCount += 1;
    } catch (error) {
      skippedCount += 1;
      logger.debug('[AmbientVideo] Failed to pause Twitter video', { error });
    }
  }

  if (pausedCount > 0) {
    logger.debug('[AmbientVideo] Ambient Twitter videos paused', {
      pausedCount,
      totalCandidates,
      skippedCount,
      inspected: videos.length,
    });
  }

  return {
    pausedCount,
    totalCandidates,
    skippedCount,
  };
}
