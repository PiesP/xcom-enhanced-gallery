/**
 * @fileoverview Video visibility hook for auto-play/pause based on viewport visibility
 *
 * Manages video playback state using IntersectionObserver with mute state preservation.
 */

import { logger } from '@shared/logging/logger';
import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';
import { createEffect, onCleanup } from 'solid-js';

/**
 * Configuration options for useVideoVisibility hook
 *
 * @property container - Accessor returning the container element to observe
 * @property video - Accessor returning the video element to control
 * @property isVideo - Accessor indicating whether the current media is a video
 * @property setMuted - Optional custom setter for muted state management
 */
interface UseVideoVisibilityOptions {
  /** Container element accessor for IntersectionObserver observation */
  readonly container: () => HTMLElement | null;
  /** Video element accessor for playback control */
  readonly video: () => HTMLVideoElement | null;
  /** Whether this is a video media item (vs. image/gif) */
  readonly isVideo: Accessor<boolean>;

  /**
   * Optional custom setter for video muted state
   *
   * Consumers that persist volume/mute state can provide this function
   * to mark programmatic mute changes, allowing them to distinguish
   * between user-initiated and automatic mute changes (e.g., to ignore
   * synthetic `volumechange` events during auto-mute operations).
   *
   * @param video - The video element being mutated
   * @param nextMuted - The target muted state
   */
  readonly setMuted?: (video: HTMLVideoElement, nextMuted: boolean) => void;
}

/**
 * Internal configuration for video visibility controller
 *
 * @property video - The video element to control
 * @property setMuted - Optional custom setter for muted state
 */
interface CreateVideoVisibilityControllerOptions {
  readonly video: HTMLVideoElement;
  readonly setMuted?: (video: HTMLVideoElement, nextMuted: boolean) => void;
}

/**
 * Controller interface for handling IntersectionObserver entries
 *
 * @property handleEntry - Callback invoked when visibility changes
 */
interface VideoVisibilityController {
  readonly handleEntry: (entry: IntersectionObserverEntry) => void;
}

/**
 * Creates a video visibility controller for managing playback state
 *
 * This controller maintains state across visibility changes:
 * - Tracks whether video was playing before being hidden
 * - Preserves mute state from before auto-mute
 * - Only restores state if the controller itself made the change
 *
 * State preservation logic:
 * 1. When video scrolls out: save playback state, auto-mute if needed, pause
 * 2. When video scrolls in: restore mute state (if we auto-muted), resume if was playing
 *
 * @param options - Controller configuration with video element and optional setMuted
 * @returns Controller with handleEntry method for IntersectionObserver
 */
function createVideoVisibilityController(
  options: CreateVideoVisibilityControllerOptions
): VideoVisibilityController {
  const { video, setMuted } = options;

  // State preservation across visibility changes
  let wasPlayingBeforeHidden = false;
  let wasMutedBeforeHidden: boolean | null = null;
  let didAutoMute = false;

  /**
   * Safely pauses the video element
   */
  const pauseVideo = (): void => {
    if (typeof video.pause === 'function') {
      video.pause();
    }
  };

  /**
   * Safely plays the video element, handling potential rejections
   */
  const playVideo = (): void => {
    if (typeof video.play !== 'function') {
      return;
    }

    try {
      const result = video.play();
      // Browsers may reject the promise when autoplay is blocked
      // Intentionally swallow rejection to avoid unhandled-rejection noise
      if (result && typeof (result as Promise<void>).catch === 'function') {
        void (result as Promise<void>).catch((err) => {
          if (__DEV__) {
            logger.debug('Video play() was prevented', { error: err });
          }
        });
      }
    } catch (err) {
      // Some browsers can throw synchronously
      if (__DEV__) {
        logger.debug('Video play() threw synchronously', { error: err });
      }
    }
  };

  /**
   * Applies muted state using custom setter if provided, otherwise directly
   *
   * @param nextMuted - Target muted state
   */
  const applyMuted = (nextMuted: boolean): void => {
    if (typeof setMuted === 'function') {
      setMuted(video, nextMuted);
      return;
    }
    video.muted = nextMuted;
  };

  return {
    handleEntry(entry: IntersectionObserverEntry): void {
      if (!entry.isIntersecting) {
        // Video scrolled out of viewport - pause and preserve state
        try {
          // Snapshot state only once per "hidden" cycle
          // Multiple consecutive not-intersecting callbacks should not overwrite
          // the original user state after we've already applied auto-mute
          if (wasMutedBeforeHidden === null) {
            wasPlayingBeforeHidden = !video.paused;
            wasMutedBeforeHidden = video.muted;
            didAutoMute = false;
          }

          // Auto-mute if currently unmuted
          if (!video.muted) {
            applyMuted(true);
            didAutoMute = true;
          }

          // Pause if currently playing
          if (!video.paused) {
            pauseVideo();
          }
        } catch (err) {
          if (__DEV__) {
            logger.warn('Failed to pause video on scroll out', { error: err });
          }
        }
      } else {
        // Video scrolled into viewport - restore state
        try {
          if (wasMutedBeforeHidden !== null) {
            // Only restore muted state if we auto-muted the video
            // This avoids overwriting external state changes that may occur
            // while the item is hidden (e.g., user toggles global mute setting)
            if (didAutoMute && video.muted === true && wasMutedBeforeHidden === false) {
              applyMuted(false);
            }
          }

          // Resume playback if video was playing before being hidden
          if (wasPlayingBeforeHidden) {
            playVideo();
          }
        } catch (err) {
          if (__DEV__) {
            logger.warn('Failed to resume video on scroll in', { error: err });
          }
        } finally {
          // Reset state tracking for next visibility cycle
          wasPlayingBeforeHidden = false;
          wasMutedBeforeHidden = null;
          didAutoMute = false;
        }
      }
    },
  };
}

/**
 * Custom hook for managing video playback based on viewport visibility
 *
 * Automatically pauses videos when they scroll out of the viewport and resumes
 * playback when they scroll back in. Preserves playback and mute state across
 * visibility changes to provide seamless user experience.
 *
 * Features:
 * - Automatic pause on scroll out of viewport
 * - Automatic resume on scroll back into viewport (if was playing)
 * - Auto-mute for out-of-viewport videos
 * - Smart mute state restoration (only restores if we auto-muted)
 * - Uses SharedObserver for performance (single IntersectionObserver instance)
 * - Handles browser autoplay policy rejections gracefully
 * - Safe cleanup on component unmount
 *
 * Implementation notes:
 * - Uses IntersectionObserver with threshold 0 (any intersection triggers)
 * - State tracking prevents overwriting user preferences during hidden periods
 * - Play/pause operations are wrapped in try-catch for browser compatibility
 *
 * @param options - Hook configuration with element accessors and optional setMuted
 *
 * @example
 * ```typescript
 * useVideoVisibility({
 *   container: () => containerRef(),
 *   video: () => videoRef(),
 *   isVideo: () => mediaType() === 'video',
 *   setMuted: (video, muted) => {
 *     video.muted = muted;
 *     // Track programmatic mute to ignore in volumechange handler
 *   },
 * });
 * ```
 */
export function useVideoVisibility(options: UseVideoVisibilityOptions): void {
  const { container, video, isVideo, setMuted } = options;

  // Visibility-based playback control effect
  createEffect(() => {
    // Only activate for video media items
    if (!isVideo()) {
      return;
    }

    const containerEl = container();
    const videoEl = video();

    // Wait for both elements to be available
    if (!containerEl || !videoEl) {
      return;
    }

    // Create visibility controller with appropriate options
    const controller = createVideoVisibilityController(
      typeof setMuted === 'function' ? { video: videoEl, setMuted } : { video: videoEl }
    );

    // Subscribe to visibility changes via shared IntersectionObserver
    const unsubscribeObserver = SharedObserver.observe(containerEl, controller.handleEntry, {
      threshold: 0,
      rootMargin: '0px',
    });

    // Cleanup: unsubscribe from observer when effect re-runs or component unmounts
    onCleanup(() => {
      unsubscribeObserver();
    });
  });
}
