/**
 * @fileoverview Ambient video pauser: silences background videos when gallery opens.
 */

import {
  IMAGE_CONTAINER_SELECTORS,
  TWEET_CONTAINER_SELECTORS,
  VIDEO_CONTAINER_SELECTORS,
} from '@constants/selectors';
import { logger } from '@shared/logging/logger';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';
import type {
  PauseAmbientVideosOptions,
  PauseAmbientVideosResult,
} from '@shared/utils/media/twitter-video-pauser';
import { pauseActiveTwitterVideos } from '@shared/utils/media/twitter-video-pauser';

type QueryableRoot = Document | DocumentFragment | HTMLElement;

type PauseScope = 'document' | 'tweet' | 'custom';
type Trigger = 'video-click' | 'image-click' | 'programmatic' | 'guard' | 'unknown';

export interface AmbientVideoPauseRequest extends PauseAmbientVideosOptions {
  readonly sourceElement?: HTMLElement | null;
  readonly trigger?: Trigger;
  readonly reason?: string;
}

interface PauseResponse extends PauseAmbientVideosResult {
  readonly failed: boolean;
  readonly trigger: Trigger;
  readonly forced: boolean;
  readonly reason: string;
  readonly scope: PauseScope;
}

function emptyResult(): PauseAmbientVideosResult {
  return { pausedCount: 0, totalCandidates: 0, skippedCount: 0 };
}

function findTweetContainer(element?: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  return closestWithFallback<HTMLElement>(element, TWEET_CONTAINER_SELECTORS, {
    debugLabel: 'tweet-container',
  });
}

function resolveContext(request: AmbientVideoPauseRequest): {
  root: QueryableRoot | null;
  scope: PauseScope;
} {
  if (request.root !== undefined) return { root: request.root ?? null, scope: 'custom' };

  const tweet = findTweetContainer(request.sourceElement);
  if (tweet) return { root: tweet, scope: 'tweet' };

  return { root: null, scope: 'document' };
}

function isVideoTrigger(el?: HTMLElement | null): boolean {
  if (!el) return false;
  if (el.tagName === 'VIDEO') return true;
  return (
    closestWithFallback(el, VIDEO_CONTAINER_SELECTORS, { debugLabel: 'video-container' }) !== null
  );
}

function isImageTrigger(el?: HTMLElement | null): boolean {
  if (!el) return false;
  if (el.tagName === 'IMG') return true;
  return (
    closestWithFallback(el, IMAGE_CONTAINER_SELECTORS, { debugLabel: 'image-container' }) !== null
  );
}

function inferTrigger(el?: HTMLElement | null): Trigger {
  if (isVideoTrigger(el)) return 'video-click';
  if (isImageTrigger(el)) return 'image-click';
  return 'unknown';
}

export function pauseAmbientVideosForGallery(
  request: AmbientVideoPauseRequest = {}
): PauseResponse {
  const trigger = request.trigger ?? inferTrigger(request.sourceElement);
  const force = request.force ?? true;
  const reason = request.reason ?? trigger;
  const { root, scope } = resolveContext(request);

  let result: PauseAmbientVideosResult;

  try {
    result = pauseActiveTwitterVideos({ root: root, force });
  } catch (error) {
    if (__DEV__) {
      logger.warn('[AmbientVideoCoordinator] Failed to pause ambient videos', { error, trigger });
    }
    return { ...emptyResult(), failed: true, trigger, forced: force, reason, scope };
  }

  if ((result.totalCandidates > 0 || result.pausedCount > 0) && __DEV__) {
    logger.debug('[AmbientVideoCoordinator] Ambient videos paused', {
      ...result,
      reason,
      trigger,
      forced: force,
      scope,
    });
  }

  return { ...result, failed: false, trigger, forced: force, reason, scope };
}
