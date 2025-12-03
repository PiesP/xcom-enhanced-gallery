import { SELECTORS, STABLE_SELECTORS } from '@/constants/selectors';
import { logger } from '@shared/logging';
import {
  type PauseAmbientVideosOptions,
  type PauseAmbientVideosResult,
  pauseActiveTwitterVideos,
} from '@shared/utils/media/twitter-video-pauser';

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
  const enforcedTrigger = trigger === 'video-click' || trigger === 'guard';
  const force = request.force ?? enforcedTrigger;
  const reason = request.reason ?? trigger;
  const root = request.root ?? null;

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
    };
  }

  if (force || result.pausedCount > 0) {
    logger.debug('[AmbientVideoCoordinator] Ambient videos paused', {
      ...result,
      reason,
      trigger,
      forced: force,
    });
  }

  return {
    ...result,
    trigger,
    forced: force,
    reason,
  };
}
