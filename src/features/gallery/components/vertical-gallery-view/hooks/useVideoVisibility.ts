/**
 * @fileoverview Video visibility hook for auto-play/pause
 * @description Manages video playback state based on viewport visibility
 * @module features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility
 * @version 1.0.0 - Phase 434
 */

import { createEffect, onCleanup } from '@shared/external/vendors/solid-hooks';
import { logger } from '@shared/logging';
import { SharedObserver } from '@shared/utils/performance';

/**
 * Options for video visibility hook
 */
export interface UseVideoVisibilityOptions {
  /** Container element accessor */
  readonly container: () => HTMLDivElement | null;
  /** Video element accessor */
  readonly video: () => HTMLVideoElement | null;
  /** Whether this is a video media item */
  readonly isVideo: boolean;
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
  const { container, video, isVideo } = options;

  // Playback state preservation
  let wasPlayingBeforeHidden = false;
  let wasMutedBeforeHidden: boolean | null = null;
  let unsubscribeObserver: (() => void) | undefined;
  let hasRunUnsubscribe = false;

  const runUnsubscribe = () => {
    if (hasRunUnsubscribe) {
      return;
    }

    hasRunUnsubscribe = true;
    if (typeof unsubscribeObserver === 'function') {
      unsubscribeObserver();
    }
  };

  // Initial mute effect
  createEffect(() => {
    if (!isVideo) {
      return;
    }

    const videoEl = video();
    if (videoEl && typeof videoEl.muted === 'boolean') {
      try {
        videoEl.muted = true;
      } catch (err) {
        logger.warn('Failed to mute video', { error: err });
      }
    }
  });

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

    const pauseVideo = () => {
      if (typeof videoEl.pause === 'function') {
        videoEl.pause();
      }
    };

    const playVideo = () => {
      if (typeof videoEl.play === 'function') {
        void videoEl.play();
      }
    };

    const handleVisibilityChange = (entry: IntersectionObserverEntry) => {
      if (!entry.isIntersecting) {
        // Scrolled out of view - pause and save state
        try {
          wasPlayingBeforeHidden = !videoEl.paused;
          wasMutedBeforeHidden = videoEl.muted;
          videoEl.muted = true;
          if (!videoEl.paused) {
            pauseVideo();
          }
        } catch (err) {
          logger.warn('Failed to pause video', { error: err });
        }
      } else {
        // Scrolled into view - restore state
        try {
          if (wasMutedBeforeHidden !== null) {
            videoEl.muted = wasMutedBeforeHidden;
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
    };

    hasRunUnsubscribe = false;
    unsubscribeObserver = SharedObserver.observe(containerEl, handleVisibilityChange, {
      threshold: 0,
      rootMargin: '0px',
    });

    onCleanup(runUnsubscribe);
  });
}
