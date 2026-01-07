import {
  STABLE_IMAGE_CONTAINERS_SELECTORS,
  STABLE_TWEET_CONTAINERS_SELECTORS,
  STABLE_VIDEO_CONTAINERS_SELECTORS,
  TWEET_PHOTO_SELECTOR,
  VIDEO_PLAYER_SELECTOR,
} from '@shared/dom/selectors';
import { logger } from '@shared/logging/logger';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';
import {
  type PauseAmbientVideosOptions,
  type PauseAmbientVideosResult,
  pauseActiveTwitterVideos,
} from '@shared/utils/media/twitter-video-pauser';

type PauseRoot = Exclude<PauseAmbientVideosOptions['root'], undefined>;

type AmbientVideoPauseScope = 'document' | 'tweet' | 'custom';

type AmbientVideoTrigger = 'video-click' | 'image-click' | 'programmatic' | 'guard' | 'unknown';

export interface AmbientVideoPauseRequest extends PauseAmbientVideosOptions {
  readonly sourceElement?: HTMLElement | null;
  readonly trigger?: AmbientVideoTrigger;
  readonly reason?: string;
}

interface AmbientVideoPauseResponse extends PauseAmbientVideosResult {
  readonly trigger: AmbientVideoTrigger;
  readonly forced: boolean;
  readonly reason: string;
  readonly scope: AmbientVideoPauseScope;
}

const VIDEO_TRIGGER_SELECTORS = [
  VIDEO_PLAYER_SELECTOR,
  ...STABLE_VIDEO_CONTAINERS_SELECTORS,
] as const;

const IMAGE_TRIGGER_SELECTORS = [
  TWEET_PHOTO_SELECTOR,
  ...STABLE_IMAGE_CONTAINERS_SELECTORS,
] as const;

const PAUSE_RESULT_DEFAULT = {
  pausedCount: 0,
  totalCandidates: 0,
  skippedCount: 0,
} as const satisfies PauseAmbientVideosResult;

interface PauseResolution {
  readonly root: PauseRoot;
  readonly scope: AmbientVideoPauseScope;
}

function findTweetContainer(element?: HTMLElement | null): HTMLElement | null {
  if (!element) {
    return null;
  }

  return closestWithFallback<HTMLElement>(element, STABLE_TWEET_CONTAINERS_SELECTORS);
}

function resolvePauseContext(request: AmbientVideoPauseRequest): PauseResolution {
  if (request.root !== undefined) {
    return {
      root: request.root ?? null,
      scope: 'custom',
    };
  }

  const tweetContainer = findTweetContainer(request.sourceElement);
  if (tweetContainer) {
    return {
      root: tweetContainer,
      scope: 'tweet',
    };
  }

  return {
    root: null,
    scope: 'document',
  };
}

/**
 * Check if element is a video trigger (video tag or video container)
 * Uses fast tag check first, then selector matching as fallback
 */
function isVideoTriggerElement(element?: HTMLElement | null): boolean {
  if (!element) return false;
  if (element.tagName === 'VIDEO') return true;

  // Check if element matches or is within a video container
  for (const selector of VIDEO_TRIGGER_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch {
      // Ignore invalid selector patterns
    }
  }

  return closestWithFallback(element, VIDEO_TRIGGER_SELECTORS) !== null;
}

/**
 * Check if element is an image trigger (img tag or image container)
 * Uses fast tag check first, then selector matching as fallback
 */
function isImageTriggerElement(element?: HTMLElement | null): boolean {
  if (!element) return false;
  if (element.tagName === 'IMG') return true;

  // Check if element matches or is within an image container
  for (const selector of IMAGE_TRIGGER_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch {
      // Ignore invalid selector patterns
    }
  }

  return closestWithFallback(element, IMAGE_TRIGGER_SELECTORS) !== null;
}

function inferAmbientVideoTrigger(element?: HTMLElement | null): AmbientVideoTrigger {
  if (isVideoTriggerElement(element)) {
    return 'video-click';
  }

  if (isImageTriggerElement(element)) {
    return 'image-click';
  }

  return 'unknown';
}

export function pauseAmbientVideosForGallery(
  request: AmbientVideoPauseRequest = {}
): AmbientVideoPauseResponse {
  const trigger = request.trigger ?? inferAmbientVideoTrigger(request.sourceElement);
  const force = request.force ?? true;
  const reason = request.reason ?? trigger;
  const { root, scope } = resolvePauseContext(request);

  let result: PauseAmbientVideosResult;

  try {
    result = pauseActiveTwitterVideos({
      root,
      force,
    });
  } catch (error) {
    if (__DEV__) {
      logger.warn('[AmbientVideoCoordinator] Failed to pause ambient videos', {
        error,
        trigger,
      });
    }
    return {
      ...PAUSE_RESULT_DEFAULT,
      trigger,
      forced: force,
      reason,
      scope,
    };
  }

  if (result.totalCandidates > 0 || result.pausedCount > 0) {
    if (__DEV__) {
      logger.debug('[AmbientVideoCoordinator] Ambient videos paused', {
        ...result,
        reason,
        trigger,
        forced: force,
        scope,
      });
    }
  }

  return {
    ...result,
    trigger,
    forced: force,
    reason,
    scope,
  };
}
