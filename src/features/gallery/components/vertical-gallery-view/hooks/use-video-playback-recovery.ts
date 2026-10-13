// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/** Owns one gallery video's source attempts, playback intent, and recovery lifecycle. */

import type { VideoVisibilityState } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-visibility';
import {
  hasKnownVideoAccessDenial,
  isRecoverableVideoError,
  nextVideoPlaybackSource,
} from '@features/gallery/components/vertical-gallery-view/utils/video-playback-recovery';
import type { MediaInfo } from '@shared/types/media.types';
import { subscribeVideoPlaybackIntent } from '@shared/utils/events/handlers/video-control-helper';
import type { Accessor, JSX } from 'solid-js';
import { createEffect, createSignal, on, onCleanup } from 'solid-js';

interface PlaybackRecoveryOptions {
  readonly media: Accessor<MediaInfo>;
  readonly displaySrc: Accessor<string>;
  readonly isVideo: Accessor<boolean>;
  readonly shouldAdmitImmediately: Accessor<boolean>;
  readonly videoRef: Accessor<HTMLVideoElement | null>;
  readonly isLoaded: Accessor<boolean>;
  readonly visibility: () => VideoVisibilityState;
  readonly applyMutedProgrammatically: (video: HTMLVideoElement, muted: boolean) => void;
  readonly applyVolumeProgrammatically: (video: HTMLVideoElement, volume: number) => void;
  readonly onReset: () => void;
  readonly onFallback: () => void;
  readonly onReady: () => void;
  readonly onError: () => void;
}

interface PendingResume {
  readonly media: MediaInfo;
  readonly source: string;
  readonly time: number;
  readonly volume: number;
  readonly muted: boolean;
  readonly playing: boolean;
  readonly controlGeneration: number;
}

interface VideoPlaybackRecovery {
  readonly isAdmitted: Accessor<boolean>;
  readonly hasFirstFrame: Accessor<boolean>;
  readonly playbackSrc: Accessor<string>;
  readonly isFallback: Accessor<boolean>;
  readonly admit: () => void;
  readonly onUserVolumeChange: (video: HTMLVideoElement) => void;
  readonly onVisibilityChange: (visible: boolean) => void;
  readonly observePlaybackIntent: () => void;
  readonly markCachedReady: (video: HTMLVideoElement) => void;
  readonly handlePointerDown: JSX.EventHandlerUnion<HTMLVideoElement, PointerEvent>;
  readonly handleKeyDown: JSX.EventHandlerUnion<HTMLVideoElement, KeyboardEvent>;
  readonly handleLoadStart: JSX.EventHandlerUnion<HTMLVideoElement, Event>;
  readonly handleMetadata: JSX.EventHandlerUnion<HTMLVideoElement, Event>;
  readonly handleData: JSX.EventHandlerUnion<HTMLVideoElement, Event>;
  readonly handleError: JSX.EventHandlerUnion<HTMLVideoElement, Event>;
  readonly handlePlay: JSX.EventHandlerUnion<HTMLVideoElement, Event>;
  readonly handlePause: JSX.EventHandlerUnion<HTMLVideoElement, Event>;
}

export function useVideoPlaybackRecovery(options: PlaybackRecoveryOptions): VideoPlaybackRecovery {
  const [isAdmitted, setIsAdmitted] = createSignal(false);
  const [hasFirstFrame, setHasFirstFrame] = createSignal(false);
  const [playbackSrc, setPlaybackSrc] = createSignal(options.displaySrc());
  const [isFallback, setIsFallback] = createSignal(false);
  let attemptedSources = new Set([options.displaySrc()]);
  let sourceAttachedAt = performance.now();
  let armedSource: string | null = null;
  let wantsPlayback = false;
  let needsResume = false;
  let recoveringSource: string | null = null;
  let controlInteractionAfterError = false;
  let controlGeneration = 0;
  let intentGeneration = 0;
  let disposed = false;
  let pendingResume: PendingResume | null = null;

  // A keyed item can change index without changing its owned MediaInfo object.
  let resetMedia = options.media();
  createEffect(
    on(
      options.media,
      (media) => {
        if (media === resetMedia) {
          return;
        }
        resetMedia = media;
        options.onReset();
        setHasFirstFrame(false);
        setIsFallback(false);
        setIsAdmitted(false);
        attemptedSources = new Set([media.url]);
        sourceAttachedAt = performance.now();
        armedSource = null;
        wantsPlayback = false;
        needsResume = false;
        recoveringSource = null;
        controlInteractionAfterError = false;
        controlGeneration = 0;
        intentGeneration++;
        pendingResume = null;
        setPlaybackSrc(media.url);
      },
      { defer: true }
    )
  );

  const admit = (): void => {
    if (options.isVideo() && !disposed) {
      setIsAdmitted(true);
    }
  };

  createEffect(() => {
    if (options.isVideo() && options.shouldAdmitImmediately()) {
      admit();
    }
  });

  onCleanup(() => {
    disposed = true;
    pendingResume = null;
    needsResume = false;
  });

  const isCurrentVideoEvent = (video: HTMLVideoElement): boolean => {
    const source = playbackSrc();
    return (
      !disposed &&
      video.isConnected &&
      options.videoRef() === video &&
      video.getAttribute('src') === source &&
      (!video.currentSrc || video.currentSrc === video.src) &&
      (armedSource === source || video.currentSrc === video.src)
    );
  };

  const resumeWhenReady = (): void => {
    const video = options.videoRef();
    if (
      !video ||
      !needsResume ||
      !wantsPlayback ||
      pendingResume ||
      !options.visibility().isVisible() ||
      !isCurrentVideoEvent(video) ||
      video.readyState < 1
    ) {
      return;
    }
    needsResume = false;
    const media = options.media();
    const source = playbackSrc();
    const generation = intentGeneration;
    try {
      void video.play().catch(() => {
        if (
          !disposed &&
          options.media() === media &&
          playbackSrc() === source &&
          intentGeneration === generation &&
          options.visibility().isVisible()
        ) {
          wantsPlayback = false;
        }
      });
    } catch {
      if (
        options.media() === media &&
        playbackSrc() === source &&
        intentGeneration === generation &&
        options.visibility().isVisible()
      ) {
        wantsPlayback = false;
      }
    }
  };

  const onUserVolumeChange = (video: HTMLVideoElement): void => {
    if (options.videoRef() !== video || disposed) {
      return;
    }
    controlGeneration++;
    options.visibility().noteUserVolumeChange(video);
  };

  const onVisibilityChange = (visible: boolean): void => {
    if (!visible && wantsPlayback) {
      needsResume = true;
    }
    if (visible) {
      resumeWhenReady();
    }
  };

  // Called after the visibility hook is installed to preserve effect registration order.
  const observePlaybackIntent = (): void => {
    createEffect(() => {
      const video = options.videoRef();
      const media = options.media();
      if (!video || !options.isVideo()) {
        return;
      }
      let latestPlay: { token: object; source: string; generation: number } | null = null;
      onCleanup(
        subscribeVideoPlaybackIntent(video, (event) => {
          if (disposed || options.videoRef() !== video || options.media() !== media) {
            return;
          }
          if (event.type === 'play-rejected') {
            if (
              latestPlay?.token !== event.token ||
              latestPlay.source !== playbackSrc() ||
              latestPlay.generation !== intentGeneration
            ) {
              return;
            }
            latestPlay = null;
            wantsPlayback = false;
            needsResume = false;
          } else {
            wantsPlayback = event.playing;
            needsResume = event.playing && pendingResume !== null;
          }
          recoveringSource = null;
          controlInteractionAfterError = false;
          intentGeneration++;
          if (event.type === 'command') {
            latestPlay = event.playing
              ? { token: event.token, source: playbackSrc(), generation: intentGeneration }
              : null;
          }
        })
      );
    });
  };

  const markCachedReady = (video: HTMLVideoElement): void => {
    if (isCurrentVideoEvent(video) && video.readyState >= 1 && !options.isLoaded()) {
      options.onReady();
      if (video.readyState >= 2) {
        setHasFirstFrame(true);
      }
    }
  };

  const handlePointerDown: JSX.EventHandlerUnion<HTMLVideoElement, PointerEvent> = () => {
    admit();
    if (recoveringSource) {
      controlInteractionAfterError = true;
    }
  };

  const handleKeyDown: JSX.EventHandlerUnion<HTMLVideoElement, KeyboardEvent> = () => {
    if (recoveringSource) {
      controlInteractionAfterError = true;
    }
  };

  const handleLoadStart: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget;
    const source = playbackSrc();
    if (
      !disposed &&
      video.isConnected &&
      options.videoRef() === video &&
      video.getAttribute('src') === source &&
      (!video.currentSrc || video.currentSrc === video.src)
    ) {
      armedSource = source;
    }
  };

  const handleMetadata: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget;
    if (!isCurrentVideoEvent(video) || video.readyState < 1) {
      return;
    }
    options.onReady();
    if (video.readyState >= 2) {
      setHasFirstFrame(true);
    }
    const resume = pendingResume;
    if (!resume || resume.media !== options.media() || resume.source !== playbackSrc()) {
      return;
    }
    pendingResume = null;
    try {
      if (controlGeneration === resume.controlGeneration) {
        if (options.visibility().isVisible()) {
          options.applyMutedProgrammatically(video, resume.muted);
        }
        options.applyVolumeProgrammatically(video, resume.volume);
      }
      if (resume.time > 0) {
        video.currentTime = Number.isFinite(video.duration)
          ? Math.min(resume.time, Math.max(0, video.duration - 0.1))
          : resume.time;
      }
    } catch {
      // A source can reject a seek; the controls remain usable at the start.
    }
    if (resume.playing && wantsPlayback) {
      needsResume = true;
    }
    resumeWhenReady();
  };

  const handleData: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    if (isCurrentVideoEvent(event.currentTarget) && event.currentTarget.readyState >= 2) {
      setHasFirstFrame(true);
      options.onReady();
    }
  };

  const handleError: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget;
    if (!isCurrentVideoEvent(video) || !isAdmitted()) {
      return;
    }
    const source = playbackSrc();
    const code = video.error?.code;
    const next =
      isRecoverableVideoError(code) && !hasKnownVideoAccessDenial(source, sourceAttachedAt)
        ? nextVideoPlaybackSource(options.media(), attemptedSources)
        : null;
    if (!next) {
      pendingResume = null;
      needsResume = false;
      recoveringSource = null;
      options.onError();
      return;
    }
    pendingResume = {
      media: options.media(),
      source: next,
      time: Number.isFinite(video.currentTime) ? video.currentTime : 0,
      volume: video.volume,
      muted: options.visibility().recoveryMuted(video),
      playing: wantsPlayback || !video.paused,
      controlGeneration,
    };
    wantsPlayback = pendingResume.playing;
    needsResume = pendingResume.playing;
    recoveringSource = next;
    controlInteractionAfterError = false;
    attemptedSources.add(next);
    sourceAttachedAt = performance.now();
    armedSource = null;
    options.onFallback();
    setHasFirstFrame(false);
    setIsFallback(true);
    setPlaybackSrc(next);
  };

  const handlePlay: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    if (!isCurrentVideoEvent(event.currentTarget)) {
      return;
    }
    wantsPlayback = true;
    intentGeneration++;
    recoveringSource = null;
    controlInteractionAfterError = false;
    if (options.visibility().hasObservation() && !options.visibility().isVisible()) {
      needsResume = true;
      options.visibility().pauseIfHidden();
    }
  };

  const handlePause: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget;
    const controlledRecovery =
      recoveringSource === playbackSrc() &&
      options.videoRef() === video &&
      video.isConnected &&
      video.getAttribute('src') === recoveringSource;
    if ((!isCurrentVideoEvent(video) && !controlledRecovery) || video.error) {
      return;
    }
    if (!options.visibility().isVisible() || options.visibility().isAutoPaused()) {
      return;
    }
    if (recoveringSource && !controlInteractionAfterError) {
      return;
    }
    wantsPlayback = false;
    needsResume = false;
    recoveringSource = null;
    controlInteractionAfterError = false;
    intentGeneration++;
  };

  return {
    isAdmitted,
    hasFirstFrame,
    playbackSrc,
    isFallback,
    admit,
    onUserVolumeChange,
    onVisibilityChange,
    observePlaybackIntent,
    markCachedReady,
    handlePointerDown,
    handleKeyDown,
    handleLoadStart,
    handleMetadata,
    handleData,
    handleError,
    handlePlay,
    handlePause,
  };
}
