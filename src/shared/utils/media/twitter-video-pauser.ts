/**
 * @fileoverview Twitter ambient video auto-pause helper.
 * @description Pauses actively playing videos in the host timeline before gallery opens.
 */

import { isGalleryInternalElement } from '@shared/dom/utils';
import { logger } from '@shared/logging';

type QueryableRoot = Document | DocumentFragment | HTMLElement;

const ZERO_RESULT: PauseAmbientVideosResult = Object.freeze({
  pausedCount: 0,
  totalCandidates: 0,
  skippedCount: 0,
});

export interface PauseAmbientVideosOptions {
  root?: QueryableRoot | null;
  /**
   * Force-pause every connected timeline video regardless of the current playback state.
   */
  force?: boolean;
}

export interface PauseAmbientVideosResult {
  pausedCount: number;
  totalCandidates: number;
  skippedCount: number;
}

/** Resolves the queryable root element, falling back to document. */
function resolveRoot(root?: QueryableRoot | null): QueryableRoot | null {
  if (root && typeof root.querySelectorAll === 'function') return root;
  return typeof document !== 'undefined' && typeof document.querySelectorAll === 'function'
    ? document
    : null;
}

/** Checks if video is actively playing (not paused and not ended). */
function isVideoPlaying(video: HTMLVideoElement): boolean {
  try {
    return !video.paused && !video.ended;
  } catch {
    return false;
  }
}

/** Determines if a video should be paused (external, connected, and playing). */
function shouldPauseVideo(video: Element, force = false): video is HTMLVideoElement {
  return (
    video instanceof HTMLVideoElement &&
    !isGalleryInternalElement(video) &&
    video.isConnected &&
    (force || isVideoPlaying(video))
  );
}

/** Attempts to pause a video and returns success status. */
function tryPauseVideo(video: HTMLVideoElement): boolean {
  try {
    video.pause?.();
    return true;
  } catch (error) {
    logger.debug('[AmbientVideo] Failed to pause Twitter video', { error });
    return false;
  }
}

/**
 * Pauses all actively playing videos in the Twitter timeline.
 * Skips gallery-owned videos to prevent interference with gallery playback.
 */
export function pauseActiveTwitterVideos(
  options: PauseAmbientVideosOptions = {},
): PauseAmbientVideosResult {
  const root = resolveRoot(options.root ?? null);
  if (!root) return { ...ZERO_RESULT };

  const videos = Array.from(root.querySelectorAll('video'));
  if (videos.length === 0) return { ...ZERO_RESULT };

  const candidates = videos.filter(video => shouldPauseVideo(video, options.force));
  const pausedVideos = candidates.filter(tryPauseVideo);

  const result: PauseAmbientVideosResult = {
    pausedCount: pausedVideos.length,
    totalCandidates: candidates.length,
    skippedCount: videos.length - candidates.length + (candidates.length - pausedVideos.length),
  };

  if (result.pausedCount > 0) {
    logger.debug('[AmbientVideo] Ambient Twitter videos paused', {
      ...result,
      inspected: videos.length,
    });
  }

  return result;
}
