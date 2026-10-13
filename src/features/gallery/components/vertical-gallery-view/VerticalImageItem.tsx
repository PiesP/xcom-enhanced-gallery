// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Vertical Image/Video Item Component (Solid.js)
 * @description Renders individual media items with fit mode, visibility/loading states,
 * video auto-pause, and accessibility support via useVideoVisibility hook.
 */

import { CSS } from '@constants/css';
import { useVideoPlaybackRecovery } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-playback-recovery';
import { useVideoVisibility } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-visibility';
import { useVideoVolumePersistence } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence';
import { cleanFilename } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers';
import styles from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css';
import type { VerticalImageItemProps } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.types';
import { useTranslation } from '@shared/hooks/use-translation';
import { gallerySignals, setCurrentVideoElement } from '@shared/state/signals/gallery.signals';
import type { ImageFitMode } from '@shared/types/settings.types';
import {
  computeContainIntrinsicSizeOverride,
  createIntrinsicSizingStyle,
  resolveMediaDimensionsWithIntrinsicFlag,
} from '@shared/utils/media/media-dimensions';
import { getMediaDisplayUrl } from '@shared/utils/media/media-source';
import { cx } from '@shared/utils/text/formatting';
import { isUrlAllowed, MEDIA_URL_POLICY } from '@shared/utils/url/safety';
import type { JSX, JSXElement } from 'solid-js';
import { createEffect, createMemo, createSignal, splitProps, untrack } from 'solid-js';

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
  let geometryReported = false;
  const recovery = useVideoPlaybackRecovery({
    media: () => local.media,
    displaySrc,
    isVideo,
    shouldAdmitImmediately: shouldAdmitVideoImmediately,
    videoRef: () => videoRef(),
    isLoaded,
    visibility: () => visibility,
    applyMutedProgrammatically: (video, muted) => applyMutedProgrammatically(video, muted),
    applyVolumeProgrammatically: (video, volume) => applyVolumeProgrammatically(video, volume),
    onReset: () => {
      setIsLoaded(false);
      setIsError(false);
      geometryReported = false;
    },
    onFallback: () => setIsLoaded(false),
    onReady: () => handleMediaLoad(),
    onError: () => handleMediaError(),
  });

  // Defense-in-depth: validate the rendered URL
  const isDisplaySrcValid = createMemo(() => isUrlAllowed(displaySrc(), MEDIA_URL_POLICY));
  const posterSrc = createMemo(() => {
    if (!isVideo()) {
      return undefined;
    }
    const candidate = local.media.thumbnailUrl;
    if (!candidate || !isUrlAllowed(candidate, MEDIA_URL_POLICY)) {
      return undefined;
    }
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
      onUserVolumeChange: recovery.onUserVolumeChange,
    });

  const visibility = useVideoVisibility({
    container: containerRef,
    scrollRoot: () => local.scrollRoot(),
    scrollRootHeight: () => local.scrollRootHeight(),
    video: videoRef,
    isVideo,
    mediaIdentity: () => local.media,
    admit: recovery.admit,
    setMuted: applyMutedProgrammatically,
    onVisibilityChange: recovery.onVisibilityChange,
  });

  recovery.observePlaybackIntent();

  createEffect(() => {
    const video = videoRef();
    if (local.isActive && video) {
      const alreadySignaled = untrack(() => gallerySignals.currentVideoElement === video);
      if (!alreadySignaled) {
        setCurrentVideoElement(video);
      }
      return;
    }
    const shouldClear = untrack(() => gallerySignals.currentVideoElement === video);
    if (shouldClear) {
      setCurrentVideoElement(null);
    }
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

  // M8: No dependency on isLoaded() — this effect is a one-shot cached-image
  // check for images that load before the native onLoad fires (e.g. browser
  // cache). The native onLoad/onLoadedMetadata handlers are the primary paths.
  createEffect(() => {
    if (isVideo()) {
      const video = videoRef();
      if (video) {
        recovery.markCachedReady(video);
      }
    } else {
      const image = imageRef();
      if (image?.complete && !isLoaded()) {
        if (image.naturalWidth > 0) {
          handleMediaLoad();
        } else {
          handleMediaError();
        }
      }
    }
  });

  const resolvedFitMode = createMemo<ImageFitMode>(() => {
    const value = local.fitMode;
    if (typeof value === 'function') {
      return value();
    }
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
    if (!value) {
      return {};
    }
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
      data-video-admitted={isVideo() ? String(recovery.isAdmitted()) : undefined}
      data-video-first-frame={isVideo() ? String(recovery.hasFirstFrame()) : undefined}
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
          // biome-ignore lint/a11y/useMediaCaption: X supplies external media without a caption track; a fabricated track would misrepresent it.
          <video
            src={recovery.isAdmitted() ? recovery.playbackSrc() : undefined}
            poster={posterSrc()}
            preload={recovery.isAdmitted() ? 'metadata' : 'none'}
            controls
            ref={setVideoRef}
            width={dimensions().width}
            height={dimensions().height}
            class={cx(styles.video, fitModeClass(), styles.loaded)}
            aria-label={local['aria-label'] || imageAltText()}
            aria-describedby={local['aria-describedby']}
            tabIndex={isFocused() ? 0 : -1}
            onFocus={(event) => {
              recovery.admit();
              local.onFocus?.(event);
            }}
            onPointerDown={recovery.handlePointerDown}
            onKeyDown={recovery.handleKeyDown}
            onLoadStart={recovery.handleLoadStart}
            onLoadedMetadata={recovery.handleMetadata}
            onLoadedData={recovery.handleData}
            onPlay={recovery.handlePlay}
            onPause={recovery.handlePause}
            onError={recovery.handleError}
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
        {isVideo() && recovery.isFallback() && !isError() && (
          <div class={styles.playbackFallback} role="status">
            {translate('msg.gal.video.playbackFallback')}
          </div>
        )}
      </div>
    </li>
  );
}
