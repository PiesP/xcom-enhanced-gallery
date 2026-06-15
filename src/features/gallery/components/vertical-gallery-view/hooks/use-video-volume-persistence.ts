// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Video volume persistence hook
 * @description Manages video volume/muted state with settings persistence
 * and guards against programmatic vs user-driven volume changes.
 */

import { createVideoVolumeChangeGuard } from '@features/gallery/components/vertical-gallery-view/utils/video-volume-change-guard';
import {
  normalizeVideoMutedSetting,
  normalizeVideoVolumeSetting,
} from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers';
import { createDebounced } from '@shared/async/debounce';
import { getTypedSettingOr, setTypedSetting } from '@shared/container/settings-registry';
import { logger } from '@shared/logging/logger';
import type { JSX } from 'solid-js';
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js';

const VOLUME_PERSISTENCE_DEBOUNCE_MS = 300;

export interface UseVideoVolumePersistenceOptions {
  readonly videoRef: () => HTMLVideoElement | null;
  readonly isVideo: () => boolean;
}

export interface UseVideoVolumePersistenceResult {
  readonly volumeChangeGuard: ReturnType<typeof createVideoVolumeChangeGuard>;
  readonly applyMutedProgrammatically: (videoEl: HTMLVideoElement, muted: boolean) => void;
  readonly applyVolumeProgrammatically: (videoEl: HTMLVideoElement, volume: number) => void;
  readonly handleVolumeChange: JSX.EventHandlerUnion<HTMLVideoElement, Event>;
}

/**
 * Hook to manage video volume state with settings persistence.
 *
 * Reads initial volume/muted from settings, applies them when the video
 * element becomes ready, and persists any user-driven changes back to
 * settings with debounce.
 */
export function useVideoVolumePersistence(
  options: UseVideoVolumePersistenceOptions
): UseVideoVolumePersistenceResult {
  const { videoRef, isVideo } = options;

  const [videoVolume, setVideoVolume] = createSignal(
    normalizeVideoVolumeSetting(getTypedSettingOr('gallery.videoVolume', 1.0), 1.0)
  );
  const [videoMuted, setVideoMuted] = createSignal(
    normalizeVideoMutedSetting(getTypedSettingOr('gallery.videoMuted', false), false)
  );

  // Guard to prevent handling synthetic volumechange events triggered by us when
  // programmatically applying persisted settings. This avoids races where the event
  // handler reads stale values during the initial apply and overwrites the signal.
  const [isApplyingVideoSettings, setIsApplyingVideoSettings] = createSignal(false);

  const volumeChangeGuard = createVideoVolumeChangeGuard();

  const applyMutedProgrammatically = (videoEl: HTMLVideoElement, muted: boolean) => {
    volumeChangeGuard.markProgrammaticChange({ volume: videoEl.volume, muted });
    videoEl.muted = muted;
  };

  const applyVolumeProgrammatically = (videoEl: HTMLVideoElement, volume: number) => {
    volumeChangeGuard.markProgrammaticChange({ volume, muted: videoEl.muted });
    videoEl.volume = volume;
  };

  // Apply saved volume/muted state when video element is ready
  createEffect(() => {
    const video = videoRef();
    if (video && isVideo()) {
      // Apply persisted state while preventing the volumechange handler from
      // reacting to our programmatic assignment. We set both properties under
      // a guard so any intermediate events are ignored.
      setIsApplyingVideoSettings(true);
      try {
        // untrack: Prevent reactive dependencies inside from re-triggering this effect.
        // This ensures we only apply settings once when the video element becomes ready,
        // not on every subsequent signal change.
        untrack(() => {
          const nextMuted = normalizeVideoMutedSetting(videoMuted(), false);
          const nextVolume = normalizeVideoVolumeSetting(videoVolume(), 1.0);

          // Keep the signals normalized as well.
          if (nextMuted !== videoMuted()) {
            setVideoMuted(nextMuted);
          }
          if (nextVolume !== videoVolume()) {
            setVideoVolume(nextVolume);
          }

          applyMutedProgrammatically(video, nextMuted);
          applyVolumeProgrammatically(video, nextVolume);
        });
      } finally {
        setIsApplyingVideoSettings(false);
      }
    }
  });

  // Debounced settings persistence to reduce GM_setValue calls during slider drag
  const debouncedSaveVolume = createDebounced((volume: number, muted: boolean) => {
    setTypedSetting('gallery.videoVolume', volume).catch((error) => {
      if (__DEV__) logger.warn('Failed to persist video volume', { error });
    });
    setTypedSetting('gallery.videoMuted', muted).catch((error) => {
      if (__DEV__) logger.warn('Failed to persist video muted', { error });
    });
  }, VOLUME_PERSISTENCE_DEBOUNCE_MS);

  // Cleanup debounced function on unmount
  onCleanup(() => {
    debouncedSaveVolume.flush();
  });

  // Handle volume change events from video controls
  const handleVolumeChange: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget as HTMLVideoElement;
    const snapshot = { volume: video.volume, muted: video.muted };

    if (isApplyingVideoSettings() || volumeChangeGuard.shouldIgnoreChange(snapshot)) {
      return;
    }
    const newVolume = normalizeVideoVolumeSetting(snapshot.volume, 1.0);
    const newMuted = normalizeVideoMutedSetting(snapshot.muted, false);

    // Update local signals immediately for responsive UI
    setVideoVolume(newVolume);
    setVideoMuted(newMuted);

    // Persist to settings with debounce (reduces GM_setValue calls during drag)
    debouncedSaveVolume(newVolume, newMuted);
  };

  return {
    volumeChangeGuard,
    applyMutedProgrammatically,
    applyVolumeProgrammatically,
    handleVolumeChange,
  };
}
