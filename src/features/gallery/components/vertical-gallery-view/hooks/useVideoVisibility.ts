/**
 * @fileoverview Video visibility hook for auto-play/pause
 * @description Manages video playback state based on viewport visibility
 * @module features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility
 * @version 1.0.0 - Phase 434
 */

import { logger } from '@shared/logging';
import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';
import { createEffect, onCleanup } from 'solid-js';

/**
 * Options for video visibility hook
 */
interface UseVideoVisibilityOptions {
  /** Container element accessor */
  readonly container: () => HTMLElement | null;
  /** Video element accessor */
  readonly video: () => HTMLVideoElement | null;
  /** Whether this is a video media item */
  readonly isVideo: Accessor<boolean>;

  /**
   * Optional setter used when mutating `video.muted`.
   *
   * Consumers that persist volume/mute state can use this to mark programmatic
   * changes (e.g., to ignore synthetic `volumechange` events).
   */
  readonly setMuted?: (video: HTMLVideoElement, nextMuted: boolean) => void;
}

interface CreateVideoVisibilityControllerOptions {
  readonly video: HTMLVideoElement;
  readonly setMuted?: (video: HTMLVideoElement, nextMuted: boolean) => void;
}

interface VideoVisibilityController {
  readonly handleEntry: (entry: IntersectionObserverEntry) => void;
}

function createVideoVisibilityController(
  options: CreateVideoVisibilityControllerOptions
): VideoVisibilityController {
  const { video, setMuted } = options;

  // Playback state preservation
  let wasPlayingBeforeHidden = false;
  let wasMutedBeforeHidden: boolean | null = null;
  let didAutoMute = false;

  const pauseVideo = () => {
    if (typeof video.pause === 'function') {
      video.pause();
    }
  };

  const playVideo = () => {
    if (typeof video.play !== 'function') {
      return;
    }

    try {
      const result = video.play();
      // Browsers may reject the promise when autoplay is blocked.
      // We intentionally swallow that rejection to avoid unhandled-rejection noise.
      if (result && typeof (result as Promise<void>).catch === 'function') {
        void (result as Promise<void>).catch((err) => {
          if (__DEV__) {
            logger.debug('Video play() was prevented', { error: err });
          }
        });
      }
    } catch (err) {
      // Some browsers can throw synchronously.
      if (__DEV__) {
        logger.debug('Video play() threw synchronously', { error: err });
      }
    }
  };

  const applyMuted = (nextMuted: boolean) => {
    if (typeof setMuted === 'function') {
      setMuted(video, nextMuted);
      return;
    }
    video.muted = nextMuted;
  };

  return {
    handleEntry(entry) {
      if (!entry.isIntersecting) {
        // Scrolled out of view - pause and save state
        try {
          // Snapshot only once per "hidden" cycle. Multiple consecutive
          // not-intersecting callbacks should not overwrite the original
          // user state (e.g., muted=false) after we've already auto-muted.
          if (wasMutedBeforeHidden === null) {
            wasPlayingBeforeHidden = !video.paused;
            wasMutedBeforeHidden = video.muted;
            didAutoMute = false;
          }

          if (!video.muted) {
            applyMuted(true);
            didAutoMute = true;
          }

          if (!video.paused) {
            pauseVideo();
          }
        } catch (err) {
          if (__DEV__) {
            logger.warn('Failed to pause video', { error: err });
          }
        }
      } else {
        // Scrolled into view - restore state
        try {
          if (wasMutedBeforeHidden !== null) {
            // Only restore the muted state if *we* auto-muted the video.
            // This avoids overwriting external state changes that may happen
            // while the item is hidden (e.g., user toggles a global mute setting).
            if (didAutoMute && video.muted === true && wasMutedBeforeHidden === false) {
              applyMuted(false);
            }
          }

          if (wasPlayingBeforeHidden) {
            playVideo();
          }
        } catch (err) {
          if (__DEV__) {
            logger.warn('Failed to resume video', { error: err });
          }
        } finally {
          wasPlayingBeforeHidden = false;
          wasMutedBeforeHidden = null;
          didAutoMute = false;
        }
      }
    },
  };
}

/**
 * Hook to manage video auto-play/pause based on viewport visibility
 *
 * Features:
 * - Pauses video when scrolled out of view
 * - Resumes playback when scrolled back into view
 * - Preserves muted state across visibility changes
 * - Uses SharedObserver for visibility detection
 *
 * @param options - Hook configuration
 */
export function useVideoVisibility(options: UseVideoVisibilityOptions): void {
  const { container, video, isVideo, setMuted } = options;

  // Visibility-based playback control
  createEffect(() => {
    if (!isVideo()) {
      return;
    }

    const containerEl = container();
    const videoEl = video();

    if (!containerEl || !videoEl) {
      return;
    }

    const controller = createVideoVisibilityController(
      typeof setMuted === 'function' ? { video: videoEl, setMuted } : { video: videoEl }
    );

    const unsubscribeObserver = SharedObserver.observe(containerEl, controller.handleEntry, {
      threshold: 0,
      rootMargin: '0px',
    });

    onCleanup(() => {
      unsubscribeObserver();
    });
  });
}
