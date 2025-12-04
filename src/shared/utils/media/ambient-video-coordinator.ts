import { SELECTORS, STABLE_SELECTORS } from '@/constants/selectors';
import { logger } from '@/shared/logging';
import {
  type PauseAmbientVideosOptions,
  type PauseAmbientVideosResult,
  pauseActiveTwitterVideos,
} from '@/shared/utils/media/twitter-video-pauser';

type PauseRoot = Exclude<PauseAmbientVideosOptions['root'], undefined>;

export type AmbientVideoPauseScope = 'document' | 'tweet' | 'custom';

export type AmbientVideoTrigger =
  | 'video-click'
  | 'image-click'
  | 'programmatic'
  | 'guard'
  | 'unknown';

export interface AmbientVideoPauseRequest extends PauseAmbientVideosOptions {
  readonly sourceElement?: HTMLElement | null;
  readonly trigger?: AmbientVideoTrigger;
  readonly reason?: string;
}

export interface AmbientVideoPauseResponse extends PauseAmbientVideosResult {
  readonly trigger: AmbientVideoTrigger;
  readonly forced: boolean;
  readonly reason: string;
  readonly scope: AmbientVideoPauseScope;
}

const VIDEO_TRIGGER_SCOPES = new Set<string>([
  SELECTORS.VIDEO_PLAYER,
  ...STABLE_SELECTORS.VIDEO_CONTAINERS,
]);

const IMAGE_TRIGGER_SCOPES = new Set<string>([
  SELECTORS.TWEET_PHOTO,
  ...STABLE_SELECTORS.IMAGE_CONTAINERS,
]);

const PAUSE_RESULT_DEFAULT: PauseAmbientVideosResult = Object.freeze({
  pausedCount: 0,
  totalCandidates: 0,
  skippedCount: 0,
});

interface PauseResolution {
  readonly root: PauseRoot;
  readonly scope: AmbientVideoPauseScope;
}

function findTweetContainer(element?: HTMLElement | null): HTMLElement | null {
  if (!element) {
    return null;
  }

  for (const selector of STABLE_SELECTORS.TWEET_CONTAINERS) {
    try {
      const container = element.closest(selector);
      if (container instanceof HTMLElement) {
        return container;
      }
    } catch {
      // Ignore selector failures
    }
  }

  return null;
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
      root: null,
      scope: 'tweet',
    };
  }

  return {
    root: null,
    scope: 'document',
  };
}

function isVideoTriggerElement(element?: HTMLElement | null): boolean {
  if (!element) return false;
  if (element.tagName === 'VIDEO') return true;

  for (const selector of VIDEO_TRIGGER_SCOPES) {
    try {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    } catch {
      // Ignore selector failures
    }
  }

  return false;
}

function isImageTriggerElement(element?: HTMLElement | null): boolean {
  if (!element) return false;
  if (element.tagName === 'IMG') return true;

  for (const selector of IMAGE_TRIGGER_SCOPES) {
    try {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    } catch {
      // Ignore selector failures
    }
  }

  return false;
}

export function inferAmbientVideoTrigger(element?: HTMLElement | null): AmbientVideoTrigger {
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
    logger.warn('[AmbientVideoCoordinator] Failed to pause ambient videos', { error, trigger });
    return {
      ...PAUSE_RESULT_DEFAULT,
      trigger,
      forced: force,
      reason,
      scope,
    };
  }

  if (result.totalCandidates > 0 || result.pausedCount > 0) {
    logger.debug('[AmbientVideoCoordinator] Ambient videos paused', {
      ...result,
      reason,
      trigger,
      forced: force,
      scope,
    });
  }

  return {
    ...result,
    trigger,
    forced: force,
    reason,
    scope,
  };
}
