// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Vertical Image/Video Item Component (Solid.js)
 * @description Renders individual media items with fit mode, visibility/loading states,
 * video auto-pause, and accessibility support via useVideoVisibility hook.
 */

import { CSS } from '@constants/css';
import { useVideoVisibility } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-visibility';
import { useVideoVolumePersistence } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence';
import {
  hasKnownVideoAccessDenial,
  isRecoverableVideoError,
  nextVideoPlaybackSource,
} from '@features/gallery/components/vertical-gallery-view/utils/video-playback-recovery';
import { cleanFilename } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers';
import styles from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css';
import type { VerticalImageItemProps } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.types';
import { useTranslation } from '@shared/hooks/use-translation';
import { gallerySignals, setCurrentVideoElement } from '@shared/state/signals/gallery.signals';
import type { ImageFitMode } from '@shared/types/settings.types';
import { subscribeVideoPlaybackIntent } from '@shared/utils/events/handlers/video-control-helper';
import {
  computeContainIntrinsicSizeOverride,
  createIntrinsicSizingStyle,
  resolveMediaDimensionsWithIntrinsicFlag,
} from '@shared/utils/media/media-dimensions';
import { getMediaDisplayUrl } from '@shared/utils/media/media-source';
import { cx } from '@shared/utils/text/formatting';
import { isUrlAllowed, MEDIA_URL_POLICY } from '@shared/utils/url/safety';
import type { JSX, JSXElement } from 'solid-js';
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js';

const FIT_MODE_CLASSES: Record<ImageFitMode, string> = {
  original: styles.fitOriginal as string,
  fitHeight: styles.fitHeight as string,
  fitWidth: styles.fitWidth as string,
  fitContainer: styles.fitContainer as string,
};

export function VerticalImageItem(props: VerticalImageItemProps): JSXElement | null {
  const [local] = splitProps(props, [
    'media',
    'scrollRoot',
    'scrollRootHeight',
    'index',
    'isActive',
    'isFocused',
    'forceVisible',
    'onClick',
    'className',
    'onMediaLoad',
    'fitMode',
    'style',
    'registerContainer',
    'onFocus',
    'aria-label',
    'aria-describedby',
    'data-testid',
  ]);

  const isFocused = () => local.isFocused ?? false;
  const className = () => local.className ?? '';
  const shouldEagerLoadImage = () => (local.forceVisible ?? false) || (local.isActive ?? false);
  const shouldAdmitVideoImmediately = () => (local.isActive ?? false) || isFocused();
  const translate = useTranslation();
  const isVideo = () => local.media.type === 'video' || local.media.type === 'gif';

  /** Image preload neighbors are index-based; video priority follows actual admission. */
  const fetchPriority = () =>
    (isVideo() ? shouldAdmitVideoImmediately() : shouldEagerLoadImage()) ? 'high' : 'low';

  /**
   * Resolve the image source URL for display.
   *
   * Uses media.url for all types. Non-active images previously used
   * thumbnailUrl (perf optimization B5), but this caused dimension
   * mismatches requiring complex workarounds. loading=\"lazy\" already
   * defers off-screen network requests, making thumbnail URLs redundant.
   */
  const displaySrc = createMemo(() => getMediaDisplayUrl(local.media));
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isError, setIsError] = createSignal(false);
  const [isVideoAdmitted, setIsVideoAdmitted] = createSignal(false);
  const [videoHasFirstFrame, setVideoHasFirstFrame] = createSignal(false);
  const [playbackSrc, setPlaybackSrc] = createSignal(displaySrc());
  const [isPlaybackFallback, setIsPlaybackFallback] = createSignal(false);
  let attemptedSources = new Set([displaySrc()]);
  let sourceAttachedAt = performance.now();
  let armedSource: string | null = null;
  let geometryReported = false;
  let wantsPlayback = false;
  let needsResume = false;
  let recoveringSource: string | null = null;
  let controlInteractionAfterError = false;
  let controlGeneration = 0;
  let intentGeneration = 0;
  let disposed = false;
  let pendingResume: {
    readonly media: typeof local.media;
    readonly source: string;
    readonly time: number;
    readonly volume: number;
    readonly muted: boolean;
    readonly playing: boolean;
    readonly controlGeneration: number;
  } | null = null;

  // Defense-in-depth: validate the rendered URL
  const isDisplaySrcValid = createMemo(() => isUrlAllowed(displaySrc(), MEDIA_URL_POLICY));
  const posterSrc = createMemo(() => {
    if (!isVideo()) return undefined;
    const candidate = local.media.thumbnailUrl;
    if (!candidate || !isUrlAllowed(candidate, MEDIA_URL_POLICY)) return undefined;
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === 'https:' &&
        parsed.hostname === 'pbs.twimg.com' &&
        !parsed.username &&
        !parsed.password &&
        !parsed.hash &&
        /\.(?:jpe?g|png|webp)$/i.test(parsed.pathname)
        ? candidate
        : undefined;
    } catch {
      return undefined;
    }
  });

  // A keyed item may move to another index. Keep its source and admission sticky;
  // reset only when the owned MediaInfo object changes.
  let resetMedia = local.media;
  createEffect(
    on(
      () => local.media,
      (media) => {
        // The parent accessor can update for index/focus changes while returning
        // the same object; `on` observes that update even when its value is equal.
        if (media === resetMedia) return;
        resetMedia = media;
        setIsLoaded(false);
        setIsError(false);
        setVideoHasFirstFrame(false);
        setIsPlaybackFallback(false);
        setIsVideoAdmitted(false);
        attemptedSources = new Set([media.url]);
        sourceAttachedAt = performance.now();
        armedSource = null;
        geometryReported = false;
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

  const admitVideo = (): void => {
    if (isVideo() && !disposed) setIsVideoAdmitted(true);
  };

  createEffect(() => {
    if (isVideo() && shouldAdmitVideoImmediately()) admitVideo();
  });

  onCleanup(() => {
    disposed = true;
    pendingResume = null;
    needsResume = false;
  });

  const [containerRef, setContainerRef] = createSignal<HTMLElement | null>(null);
  const [imageRef, setImageRef] = createSignal<HTMLImageElement | null>(null);
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);

  const resolvedDimensions = createMemo(() => resolveMediaDimensionsWithIntrinsicFlag(local.media));
  const dimensions = () => resolvedDimensions().dimensions;
  const hasIntrinsicSize = () => resolvedDimensions().hasIntrinsicSize;

  const intrinsicSizingStyle = createMemo(() => createIntrinsicSizingStyle(dimensions()));

  const { applyMutedProgrammatically, applyVolumeProgrammatically, handleVolumeChange } =
    useVideoVolumePersistence({
      videoRef,
      isVideo,
      onUserVolumeChange: (video) => {
        if (videoRef() !== video || disposed) return;
        controlGeneration++;
        visibility.noteUserVolumeChange(video);
      },
    });

  const visibility = useVideoVisibility({
    container: containerRef,
    scrollRoot: () => local.scrollRoot(),
    scrollRootHeight: () => local.scrollRootHeight(),
    video: videoRef,
    isVideo,
    mediaIdentity: () => local.media,
    admit: admitVideo,
    setMuted: applyMutedProgrammatically,
    onVisibilityChange: (visible) => {
      if (!visible && wantsPlayback) needsResume = true;
      if (visible) resumeWhenReady();
    },
  });

  createEffect(() => {
    const video = videoRef();
    const media = local.media;
    if (!video || !isVideo()) return;
    onCleanup(
      subscribeVideoPlaybackIntent(video, (playing) => {
        if (disposed || videoRef() !== video || local.media !== media) return;
        wantsPlayback = playing;
        needsResume = playing && pendingResume !== null;
        recoveringSource = null;
        controlInteractionAfterError = false;
        intentGeneration++;
      })
    );
  });

  createEffect(() => {
    const video = videoRef();
    if (local.isActive && video) {
      const alreadySignaled = untrack(() => gallerySignals.currentVideoElement === video);
      if (!alreadySignaled) setCurrentVideoElement(video);
      return;
    }
    const shouldClear = untrack(() => gallerySignals.currentVideoElement === video);
    if (shouldClear) setCurrentVideoElement(null);
  });

  // Apply fetchpriority hint to media elements after mount
  // setAttribute is used instead of JSX attribute to avoid SolidJS type incompatibility
  createEffect(() => {
    const priority = fetchPriority();
    const video = videoRef();
    const image = imageRef();
    if (video && isVideo()) {
      video.setAttribute('fetchpriority', priority);
    }
    if (image && !isVideo()) {
      image.setAttribute('fetchpriority', priority);
    }
  });

  const preventDragStart = (event: DragEvent) => event.preventDefault();

  const handleImageClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    event.stopPropagation();
    local.onClick();
  };

  const handleMediaLoad = () => {
    if (!isLoaded()) {
      setIsLoaded(true);
      setIsError(false);
      if (!isVideo() || !geometryReported) {
        geometryReported = true;
        local.onMediaLoad?.(local.media.id, local.index);
      }
    }
  };

  const handleMediaError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  const isCurrentVideoEvent = (video: HTMLVideoElement): boolean => {
    const source = playbackSrc();
    return (
      !disposed &&
      video.isConnected &&
      videoRef() === video &&
      video.getAttribute('src') === source &&
      (!video.currentSrc || video.currentSrc === video.src) &&
      (armedSource === source || video.currentSrc === video.src)
    );
  };

  const resumeWhenReady = (): void => {
    const video = videoRef();
    if (
      !video ||
      !needsResume ||
      !wantsPlayback ||
      pendingResume ||
      !visibility.isVisible() ||
      !isCurrentVideoEvent(video) ||
      video.readyState < 1
    )
      return;
    needsResume = false;
    const media = local.media;
    const source = playbackSrc();
    const generation = intentGeneration;
    try {
      void video.play().catch(() => {
        if (
          !disposed &&
          local.media === media &&
          playbackSrc() === source &&
          intentGeneration === generation &&
          visibility.isVisible()
        )
          wantsPlayback = false;
      });
    } catch {
      if (
        local.media === media &&
        playbackSrc() === source &&
        intentGeneration === generation &&
        visibility.isVisible()
      )
        wantsPlayback = false;
    }
  };

  const handleVideoLoadStart: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget;
    const source = playbackSrc();
    if (
      !disposed &&
      video.isConnected &&
      videoRef() === video &&
      video.getAttribute('src') === source &&
      (!video.currentSrc || video.currentSrc === video.src)
    )
      armedSource = source;
  };

  const handleVideoMetadata: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget;
    if (!isCurrentVideoEvent(video) || video.readyState < 1) return;
    handleMediaLoad();
    if (video.readyState >= 2) setVideoHasFirstFrame(true);
    const resume = pendingResume;
    if (!resume || resume.media !== local.media || resume.source !== playbackSrc()) return;
    pendingResume = null;
    try {
      if (controlGeneration === resume.controlGeneration) {
        if (visibility.isVisible()) applyMutedProgrammatically(video, resume.muted);
        applyVolumeProgrammatically(video, resume.volume);
      }
      if (resume.time > 0) {
        video.currentTime = Number.isFinite(video.duration)
          ? Math.min(resume.time, Math.max(0, video.duration - 0.1))
          : resume.time;
      }
    } catch {
      // A source can reject a seek; the controls remain usable at the start.
    }
    if (resume.playing && wantsPlayback) needsResume = true;
    resumeWhenReady();
  };

  const handleVideoData: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    if (isCurrentVideoEvent(event.currentTarget) && event.currentTarget.readyState >= 2) {
      setVideoHasFirstFrame(true);
      handleMediaLoad();
    }
  };

  const handleVideoError: JSX.EventHandlerUnion<HTMLVideoElement, Event> = (event) => {
    const video = event.currentTarget;
    if (!isCurrentVideoEvent(video) || !isVideoAdmitted()) return;
    const source = playbackSrc();
    const code = video.error?.code;
    const next =
      isRecoverableVideoError(code) && !hasKnownVideoAccessDenial(source, sourceAttachedAt)
        ? nextVideoPlaybackSource(local.media, attemptedSources)
        : null;
    if (!next) {
      pendingResume = null;
      needsResume = false;
      recoveringSource = null;
      handleMediaError();
      return;
    }
    pendingResume = {
      media: local.media,
      source: next,
      time: Number.isFinite(video.currentTime) ? video.currentTime : 0,
      volume: video.volume,
      muted: visibility.recoveryMuted(video),
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
    setIsLoaded(false);
    setVideoHasFirstFrame(false);
    setIsPlaybackFallback(true);
    setPlaybackSrc(next);
  };

  // M8: No dependency on isLoaded() — this effect is a one-shot cached-image
  // check for images that load before the native onLoad fires (e.g. browser
  // cache). The native onLoad/onLoadedMetadata handlers are the primary paths.
  createEffect(() => {
    if (isVideo()) {
      const video = videoRef();
      if (video && isCurrentVideoEvent(video) && video.readyState >= 1 && !isLoaded()) {
        handleMediaLoad();
        if (video.readyState >= 2) setVideoHasFirstFrame(true);
      }
    } else {
      const image = imageRef();
      if (image?.complete && !isLoaded()) {
        if (image.naturalWidth > 0) handleMediaLoad();
        else handleMediaError();
      }
    }
  });

  const resolvedFitMode = createMemo<ImageFitMode>(() => {
    const value = local.fitMode;
    if (typeof value === 'function') return value();
    return value ?? 'fitWidth';
  });

  const fitModeClass = () => FIT_MODE_CLASSES[resolvedFitMode()];

  // Compute contain-intrinsic-size override for content-visibility: auto off-screen items.
  // The old hardcoded `auto none auto 300px` ignored fit mode and actual image dimensions,
  // causing off-screen items to all render at 300px height. This override uses CSS calc()
  // expressions referencing viewport custom properties so sizing auto-updates on resize.
  const cisOverrideStyle = createMemo(() => {
    const dims = dimensions();
    const value = computeContainIntrinsicSizeOverride({
      intrinsicWidth: dims.width,
      intrinsicHeight: dims.height,
      hasIntrinsicSize: hasIntrinsicSize(),
      fitMode: resolvedFitMode(),
    });
    if (!value) return {};
    return { '--xeg-cis-override': value };
  });

  // mergedStyle MUST be defined after resolvedFitMode (TDZ: cisOverrideStyle depends on resolvedFitMode).
  const mergedStyle = createMemo(() => ({
    ...intrinsicSizingStyle(),
    ...cisOverrideStyle(),
    ...(local.style ?? {}),
  }));

  const containerClasses = createMemo(() =>
    cx(
      'xeg-gallery',
      CSS.CLASSES.ITEM,
      styles.container,
      local.isActive ? styles.active : undefined,
      isFocused() ? styles.focused : undefined,
      className()
    )
  );

  const assignContainerRef = (element: HTMLLIElement | null) => {
    setContainerRef(element);
    local.registerContainer?.(element);
  };

  const totalItems = () => gallerySignals.mediaItems.length;

  const imageAltText = createMemo(() =>
    isVideo()
      ? translate('msg.gal.videoCount', { index: local.index + 1, total: totalItems() })
      : translate('msg.gal.imageCount', {
          index: local.index + 1,
          total: totalItems(),
          alt: local.media.alt || cleanFilename(local.media.filename),
        })
  );

  // W2: Focus trap implemented at GalleryContainer level, not per-item.
  // See GalleryContainer.tsx for the standardized focus trap.

  return (
    <li
      ref={assignContainerRef}
      class={containerClasses()}
      data-index={local.index}
      data-fit-mode={resolvedFitMode()}
      data-media-loaded={isLoaded() ? 'true' : 'false'}
      data-video-admitted={isVideo() ? String(isVideoAdmitted()) : undefined}
      data-video-first-frame={isVideo() ? String(videoHasFirstFrame()) : undefined}
      data-media-display-url={displaySrc()}
      data-has-intrinsic-size={hasIntrinsicSize() ? 'true' : undefined}
      style={mergedStyle()}
      aria-posinset={local.index + 1}
      aria-setsize={totalItems()}
      data-gallery-element="item"
      data-testid={__DEV__ ? local['data-testid'] : undefined}
    >
      <div class={styles.imageWrapper}>
        {!isVideo() && !isLoaded() && !isError() && (
          <div class={styles.placeholder}>
            <div
              class={cx('xeg-spinner', styles.loadingSpinner)}
              role="status"
              aria-live="polite"
              aria-label={translate('msg.gal.loading')}
            />
          </div>
        )}

        {isVideo() && isDisplaySrcValid() ? (
          <video
            src={isVideoAdmitted() ? playbackSrc() : undefined}
            poster={posterSrc()}
            preload={isVideoAdmitted() ? 'metadata' : 'none'}
            controls
            ref={setVideoRef}
            width={dimensions().width}
            height={dimensions().height}
            class={cx(styles.video, fitModeClass(), styles.loaded)}
            aria-label={local['aria-label'] || imageAltText()}
            aria-describedby={local['aria-describedby']}
            tabIndex={isFocused() ? 0 : -1}
            onFocus={(event) => {
              admitVideo();
              local.onFocus?.(event);
            }}
            onPointerDown={() => {
              admitVideo();
              if (recoveringSource) controlInteractionAfterError = true;
            }}
            onKeyDown={() => {
              if (recoveringSource) controlInteractionAfterError = true;
            }}
            onLoadStart={handleVideoLoadStart}
            onLoadedMetadata={handleVideoMetadata}
            onLoadedData={handleVideoData}
            onPlay={(event) => {
              if (!isCurrentVideoEvent(event.currentTarget)) return;
              wantsPlayback = true;
              intentGeneration++;
              recoveringSource = null;
              controlInteractionAfterError = false;
              if (visibility.hasObservation() && !visibility.isVisible()) {
                needsResume = true;
                visibility.pauseIfHidden();
              }
            }}
            onPause={(event) => {
              const video = event.currentTarget;
              const controlledRecovery =
                recoveringSource === playbackSrc() &&
                videoRef() === video &&
                video.isConnected &&
                video.getAttribute('src') === recoveringSource;
              if ((!isCurrentVideoEvent(video) && !controlledRecovery) || video.error) return;
              if (!visibility.isVisible() || visibility.isAutoPaused()) return;
              if (recoveringSource && !controlInteractionAfterError) return;
              wantsPlayback = false;
              needsResume = false;
              recoveringSource = null;
              controlInteractionAfterError = false;
              intentGeneration++;
            }}
            onError={handleVideoError}
            onDragStart={preventDragStart}
            onVolumeChange={handleVolumeChange}
          />
        ) : !isVideo() && isDisplaySrcValid() ? (
          <button
            type="button"
            class={styles.mediaAction}
            aria-label={local['aria-label'] || imageAltText()}
            aria-describedby={local['aria-describedby']}
            tabIndex={isFocused() ? 0 : -1}
            onFocus={local.onFocus}
            onClick={handleImageClick}
          >
            <img
              ref={setImageRef}
              src={displaySrc()}
              alt={imageAltText()}
              width={dimensions().width}
              height={dimensions().height}
              loading={shouldEagerLoadImage() ? 'eager' : 'lazy'}
              decoding="async"
              class={cx(styles.image, fitModeClass(), isLoaded() ? styles.loaded : styles.loading)}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              onDragStart={preventDragStart}
            />
          </button>
        ) : null}

        {isError() && (
          <div class={styles.error} role="alert">
            <span class={styles.errorIcon}>⚠️</span>
            <span class={styles.errorText}>
              {translate('msg.gal.loadFail', { type: isVideo() ? 'video' : 'image' })}
            </span>
          </div>
        )}
        {isVideo() && isPlaybackFallback() && !isError() && (
          <div class={styles.playbackFallback} role="status">
            {translate('msg.gal.video.playbackFallback')}
          </div>
        )}
      </div>
    </li>
  );
}
