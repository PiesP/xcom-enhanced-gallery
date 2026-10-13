// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Gallery scrollport visibility and one-height video admission. */

import { logger } from '@shared/logging/logger';
import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';
import { createEffect, onCleanup } from 'solid-js';

interface UseVideoVisibilityOptions {
  readonly container: () => HTMLElement | null;
  readonly scrollRoot: () => HTMLElement | null;
  readonly scrollRootHeight: () => number;
  readonly video: () => HTMLVideoElement | null;
  readonly isVideo: Accessor<boolean>;
  readonly mediaIdentity: Accessor<object>;
  readonly admit: () => void;
  readonly setMuted: (video: HTMLVideoElement, nextMuted: boolean) => void;
  readonly onVisibilityChange: (visible: boolean) => void;
}

/** Playback intent remains with the component; this state describes geometry only. */
export interface VideoVisibilityState {
  readonly isVisible: () => boolean;
  readonly hasObservation: () => boolean;
  readonly isAutoPaused: () => boolean;
  /** User mute state before any temporary scroll-out mute. */
  readonly recoveryMuted: (video: HTMLVideoElement) => boolean;
  readonly noteUserVolumeChange: (video: HTMLVideoElement) => void;
  readonly pauseIfHidden: () => void;
}

export function useVideoVisibility(options: UseVideoVisibilityOptions): VideoVisibilityState {
  const {
    container,
    scrollRoot,
    scrollRootHeight,
    video,
    isVideo,
    mediaIdentity,
    admit,
    setMuted,
    onVisibilityChange,
  } = options;
  let visible = false;
  let observed = false;
  let autoPaused = false;
  let autoMuted = false;
  let mutedBeforeHidden = false;

  const pauseOutside = (videoEl: HTMLVideoElement): void => {
    try {
      if (!autoMuted && !videoEl.muted) {
        mutedBeforeHidden = videoEl.muted;
        setMuted(videoEl, true);
        autoMuted = true;
      }
      if (!videoEl.paused) {
        autoPaused = true;
        videoEl.pause();
      }
    } catch (error) {
      __DEV__ && logger.warn('Failed to pause video on scroll out', { error });
    }
  };

  const isCurrent = (
    root: HTMLElement,
    containerEl: HTMLElement,
    videoEl: HTMLVideoElement,
    identity: object
  ): boolean =>
    root.isConnected &&
    containerEl.isConnected &&
    scrollRoot() === root &&
    container() === containerEl &&
    video() === videoEl &&
    mediaIdentity() === identity;

  createEffect(() => {
    if (!isVideo()) {
      return;
    }
    const root = scrollRoot();
    const containerEl = container();
    const videoEl = video();
    const identity = mediaIdentity();
    if (!root || !containerEl || !videoEl) {
      return;
    }
    let active = true;
    visible = false;
    observed = false;
    autoPaused = false;
    autoMuted = false;

    const unsubscribe = SharedObserver.observe(
      containerEl,
      (entry) => {
        if (!active || !isCurrent(root, containerEl, videoEl, identity)) {
          return;
        }
        const nextVisible = entry.isIntersecting;
        observed = true;
        if (nextVisible === visible) {
          if (nextVisible) {
            return;
          }
          // Initial delivery may follow a user play before observation begins.
          if (autoMuted || autoPaused || videoEl.paused) {
            return;
          }
        }
        if (!nextVisible) {
          visible = false;
          pauseOutside(videoEl);
        } else {
          visible = true;
          try {
            if (autoMuted && videoEl.muted) {
              setMuted(videoEl, mutedBeforeHidden);
            }
          } catch (error) {
            __DEV__ && logger.warn('Failed to restore video mute on scroll in', { error });
          }
          autoMuted = false;
        }
        onVisibilityChange(nextVisible);
        if (nextVisible) {
          autoPaused = false;
        }
      },
      { root, rootMargin: '0px', threshold: 0 }
    );

    onCleanup(() => {
      active = false;
      unsubscribe();
      if (autoMuted && videoEl.isConnected && videoEl.muted) {
        try {
          setMuted(videoEl, mutedBeforeHidden);
        } catch (error) {
          __DEV__ && logger.warn('Failed to restore video mute on observer teardown', { error });
        }
      }
      visible = false;
      observed = false;
      autoPaused = false;
      autoMuted = false;
    });
  });

  createEffect(() => {
    if (!isVideo()) {
      return;
    }
    const root = scrollRoot();
    const height = scrollRootHeight();
    const containerEl = container();
    const videoEl = video();
    const identity = mediaIdentity();
    if (!root || !containerEl || !videoEl || height <= 0) {
      return;
    }
    let active = true;
    // IO percentage margins resolve against root width even on vertical sides.
    const margin = `${Math.round(height)}px 0px`;
    const unsubscribe = SharedObserver.observe(
      containerEl,
      (entry) => {
        if (active && entry.isIntersecting && isCurrent(root, containerEl, videoEl, identity)) {
          admit();
        }
      },
      { root, rootMargin: margin, threshold: 0 }
    );
    onCleanup(() => {
      active = false;
      unsubscribe();
    });
  });

  return {
    isVisible: () => visible,
    hasObservation: () => observed,
    isAutoPaused: () => autoPaused,
    recoveryMuted: (videoEl) => (autoMuted && videoEl.muted ? mutedBeforeHidden : videoEl.muted),
    noteUserVolumeChange: (videoEl) => {
      // A volume-only change does not alter the pre-scroll mute preference.
      if (autoMuted && !videoEl.muted) {
        autoMuted = false;
      }
    },
    pauseIfHidden: () => {
      if (observed && !visible) {
        const currentVideo = video();
        if (currentVideo) {
          pauseOutside(currentVideo);
        }
      }
    },
  };
}
