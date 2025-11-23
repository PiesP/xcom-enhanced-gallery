/**
 * @fileoverview Twitter ambient video auto-pause helper.
 * @description Scans the host timeline for actively playing videos and pauses them
 *              before the gallery overlay takes focus.
 */

import { STABLE_SELECTORS } from "@/constants";
import { logger } from "@shared/logging";
import { isGalleryInternalElement } from "@shared/utils/dom";

type QueryableRoot = Document | DocumentFragment | HTMLElement;

const ZERO_RESULT = Object.freeze({
  pausedCount: 0,
  totalCandidates: 0,
  skippedCount: 0,
});

const TWITTER_VIDEO_SCOPE_SELECTORS = Array.from(
  new Set(
    [
      ...STABLE_SELECTORS.TWEET_CONTAINERS,
      ...STABLE_SELECTORS.MEDIA_CONTAINERS,
      ...STABLE_SELECTORS.MEDIA_PLAYERS.filter(
        (selector) => selector !== "video",
      ),
    ].filter(Boolean),
  ),
);

export interface PauseAmbientVideosOptions {
  root?: QueryableRoot | null;
}

export interface PauseAmbientVideosResult {
  pausedCount: number;
  totalCandidates: number;
  skippedCount: number;
}

function resolveRoot(root?: QueryableRoot | null): QueryableRoot | null {
  if (root && typeof root.querySelectorAll === "function") {
    return root;
  }

  try {
    if (
      typeof document !== "undefined" &&
      document &&
      typeof document.querySelectorAll === "function"
    ) {
      return document;
    }
  } catch {
    return null;
  }

  return null;
}

function isTwitterTimelineVideo(video: HTMLVideoElement): boolean {
  if (!video || typeof video.closest !== "function") {
    return false;
  }

  if (isGalleryInternalElement(video)) {
    return false;
  }

  if (typeof video.isConnected === "boolean") {
    if (!video.isConnected) {
      return false;
    }
  } else if (
    typeof document !== "undefined" &&
    typeof document.contains === "function"
  ) {
    try {
      if (!document.contains(video)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return TWITTER_VIDEO_SCOPE_SELECTORS.some((selector) => {
    try {
      return video.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

function isVideoPlaying(video: HTMLVideoElement): boolean {
  try {
    const pausedState = typeof video.paused === "boolean" ? video.paused : true;
    const endedState = typeof video.ended === "boolean" ? video.ended : false;
    return pausedState === false && endedState === false;
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

  const videos = Array.from(root.querySelectorAll("video"));
  if (videos.length === 0) {
    return { ...ZERO_RESULT };
  }

  for (const element of videos) {
    if (!(element instanceof HTMLVideoElement)) {
      skippedCount += 1;
      continue;
    }

    if (!isTwitterTimelineVideo(element)) {
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
      logger.debug("[AmbientVideo] Failed to pause Twitter video", { error });
    }
  }

  if (pausedCount > 0 || totalCandidates > 0) {
    logger.debug("[AmbientVideo] Ambient Twitter videos paused", {
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
