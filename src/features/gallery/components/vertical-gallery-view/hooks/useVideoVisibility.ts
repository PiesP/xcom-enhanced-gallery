/**
 * @fileoverview Video visibility hook for auto-play/pause
 * @description Manages video playback state based on viewport visibility
 * @module features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility
 * @version 1.0.0 - Phase 434
 */

import { logger } from '@shared/logging';
import { SharedObserver } from '@shared/utils/performance';
import { createEffect, onCleanup } from 'solid-js';

/**
 * Options for video visibility hook
 */
export interface UseVideoVisibilityOptions {
  /** Container element accessor */
  readonly container: () => HTMLElement | null;
  /** Video element accessor */
  readonly video: () => HTMLVideoElement | null;
  /** Whether this is a video media item */
  readonly isVideo: boolean;

  /**
   * Optional hook invoked immediately before mutating `video.muted`.
   *
   * This is useful for consumers that persist volume/mute state and need to
   * ignore synthetic `volumechange` events triggered by programmatic updates.
   */
  readonly onBeforeMutedChange?: (video: HTMLVideoElement, nextMuted: boolean) => void;
}

interface CreateVideoVisibilityControllerOptions {
  readonly video: HTMLVideoElement;
  readonly onBeforeMutedChange?: (video: HTMLVideoElement, nextMuted: boolean) => void;
}

interface VideoVisibilityController {
  readonly handleEntry: (entry: IntersectionObserverEntry) => void;
}

function createVideoVisibilityController(
  options: CreateVideoVisibilityControllerOptions
): VideoVisibilityController {
  const { video, onBeforeMutedChange } = options;

  // Playback state preservation
  let wasPlayingBeforeHidden = false;
  let wasMutedBeforeHidden: boolean | null = null;

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
          logger.debug('Video play() was prevented', { error: err });
        });
      }
    } catch (err) {
      // Some browsers can throw synchronously.
      logger.debug('Video play() threw synchronously', { error: err });
    }
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
          }

          if (!video.muted) {
            onBeforeMutedChange?.(video, true);
            video.muted = true;
          }

          if (!video.paused) {
            pauseVideo();
          }
        } catch (err) {
          logger.warn('Failed to pause video', { error: err });
        }
      } else {
        // Scrolled into view - restore state
        try {
          if (wasMutedBeforeHidden !== null) {
            if (video.muted !== wasMutedBeforeHidden) {
              onBeforeMutedChange?.(video, wasMutedBeforeHidden);
              video.muted = wasMutedBeforeHidden;
            }
          }

          if (wasPlayingBeforeHidden) {
            playVideo();
          }
        } catch (err) {
          logger.warn('Failed to resume video', { error: err });
        } finally {
          wasPlayingBeforeHidden = false;
          wasMutedBeforeHidden = null;
        }
      }
    },
  };
}

/** @internal Test helper */
export function createVideoVisibilityControllerForTests(
  options: CreateVideoVisibilityControllerOptions
): VideoVisibilityController {
  return createVideoVisibilityController(options);
}

/**
 * Hook to manage video auto-play/pause based on viewport visibility
 *
 * Features:
 * - Pauses video when scrolled out of view
 * - Resumes playback when scrolled back into view
 * - Preserves muted state across visibility changes
 * - Uses SharedObserver for memory efficiency
 *
 * @param options - Hook configuration
 */
export function useVideoVisibility(options: UseVideoVisibilityOptions): void {
  const { container, video, isVideo, onBeforeMutedChange } = options;

  // Visibility-based playback control
  createEffect(() => {
    if (!isVideo) {
      return;
    }

    const containerEl = container();
    const videoEl = video();

    if (!containerEl || !videoEl) {
      return;
    }

    const controller = createVideoVisibilityController(
      onBeforeMutedChange
        ? {
            video: videoEl,
            onBeforeMutedChange,
          }
        : {
            video: videoEl,
          }
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
