/**
 * @fileoverview Unified video control helper with Service/Video fallback pattern
 * @description Integration point for video control logic.
 */

import { logger } from '@shared/logging/logger';
import { gallerySignals } from '@shared/state/signals/gallery.signals';

/**
 * Supported video control actions
 */
export type VideoControlAction =
  | 'play'
  | 'pause'
  | 'togglePlayPause'
  | 'volumeUp'
  | 'volumeDown'
  | 'mute'
  | 'toggleMute';

/**
 * Options for video control operations
 */
export interface VideoControlOptions {
  /** Video element to control (uses current gallery video if omitted) */
  readonly video?: HTMLVideoElement | null;
  /** Logging context identifier */
  readonly context?: string;
}

/**
 * Executes video control action on gallery video element.
 *
 * Unified integration point for video control using Service → Video fallback pattern.
 * Supports play, pause, toggle, volume adjustment, and mute operations.
 *
 * @param action - Video control action to execute
 * @param options - Configuration with video element and context
 *
 * @example
 * ```ts
 * executeVideoControl('togglePlayPause');
 * executeVideoControl('volumeUp', { context: 'keyboard' });
 * executeVideoControl('mute', { video: videoElement });
 * ```
 */
export function executeVideoControl(
  action: VideoControlAction,
  options: VideoControlOptions = {}
): void {
  try {
    const video = getGalleryVideo(options.video);
    if (!video) {
      if (__DEV__) {
        logger.debug('No video element available', { action, context: options.context });
      }
      return;
    }

    switch (action) {
      case 'play':
        playVideo(video, options.context);
        break;
      case 'pause':
        pauseVideo(video);
        break;
      case 'togglePlayPause':
        togglePlayPause(video, options.context);
        break;
      case 'volumeUp':
        adjustVolume(video, 0.1);
        break;
      case 'volumeDown':
        adjustVolume(video, -0.1);
        break;
      case 'toggleMute':
        video.muted = !video.muted;
        break;
      case 'mute':
        video.muted = true;
        break;
    }

    if (__DEV__) {
      logger.debug('Video control executed', {
        action,
        context: options.context,
      });
    }
  } catch (error) {
    logger.error('Video control error', { error, action, context: options.context });
  }
}

/**
 * Gets gallery video element from signal or parameter.
 * @internal
 */
function getGalleryVideo(video?: HTMLVideoElement | null): HTMLVideoElement | null {
  if (video instanceof HTMLVideoElement) {
    return video;
  }

  const signaled = gallerySignals.currentVideoElement;
  return signaled instanceof HTMLVideoElement ? signaled : null;
}

/**
 * Plays video with playback state tracking.
 * @internal
 */
function playVideo(video: HTMLVideoElement, context?: string): void {
  const promise = video.play?.();
  if (promise && typeof (promise as Promise<unknown>).then === 'function') {
    (promise as Promise<unknown>)
      .then(() => {
        /* playback started */
      })
      .catch(() => {
        if (__DEV__) {
          logger.debug('Play failed', { context });
        }
      });
  } else {
    /* synchronous play */
  }
}

/**
 * Pauses video and updates state.
 * @internal
 */
function pauseVideo(video: HTMLVideoElement): void {
  video.pause?.();
}

/**
 * Toggles play/pause state.
 * @internal
 */
function togglePlayPause(video: HTMLVideoElement, context?: string): void {
  const isPlaying = !video.paused;
  if (isPlaying) {
    pauseVideo(video);
  } else {
    playVideo(video, context);
  }
}

/**
 * Adjusts volume by delta, auto-unmutes if increasing from zero.
 * @internal
 */
function adjustVolume(video: HTMLVideoElement, delta: number): void {
  const newVolume = Math.round(Math.max(0, Math.min(1, video.volume + delta)) * 100) / 100;
  video.volume = newVolume;

  // Auto-unmute when increasing volume from zero
  if (newVolume > 0 && video.muted) {
    video.muted = false;
  }
  // Auto-mute when decreasing to zero
  if (newVolume === 0 && !video.muted) {
    video.muted = true;
  }
}
