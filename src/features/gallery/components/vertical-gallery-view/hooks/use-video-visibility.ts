// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Auto-play/pause video based on viewport visibility via IntersectionObserver. */

import { logger } from '@shared/logging/logger';
import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';
import { createEffect, onCleanup } from 'solid-js';

interface UseVideoVisibilityOptions {
  readonly container: () => HTMLElement | null;
  readonly video: () => HTMLVideoElement | null;
  readonly isVideo: Accessor<boolean>;
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

  let wasPlayingBeforeHidden = false;
  let wasMutedBeforeHidden: boolean | null = null;
  let didAutoMute = false;

  const pauseVideo = (): void => {
    if (typeof video.pause === 'function') video.pause();
  };

  const playVideo = (): void => {
    if (typeof video.play !== 'function') return;
    try {
      const result = video.play();
      if (result && typeof (result as Promise<void>).catch === 'function') {
        void (result as Promise<void>).catch((err) => {
          if (__DEV__) logger.debug('Video play() was prevented', { error: err });
        });
      }
    } catch (err) {
      if (__DEV__) logger.debug('Video play() threw synchronously', { error: err });
    }
  };

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
        try {
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
          if (__DEV__) logger.warn('Failed to pause video on scroll out', { error: err });
        }
      } else {
        try {
          if (wasMutedBeforeHidden !== null) {
            if (didAutoMute && video.muted === true && wasMutedBeforeHidden === false) {
              applyMuted(false);
            }
          }
          if (wasPlayingBeforeHidden) {
            playVideo();
          }
        } catch (err) {
          if (__DEV__) logger.warn('Failed to resume video on scroll in', { error: err });
        } finally {
          wasPlayingBeforeHidden = false;
          wasMutedBeforeHidden = null;
          didAutoMute = false;
        }
      }
    },
  };
}

export function useVideoVisibility(options: UseVideoVisibilityOptions): void {
  const { container, video, isVideo, setMuted } = options;

  createEffect(() => {
    if (!isVideo()) return;

    const containerEl = container();
    const videoEl = video();
    if (!containerEl || !videoEl) return;

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
