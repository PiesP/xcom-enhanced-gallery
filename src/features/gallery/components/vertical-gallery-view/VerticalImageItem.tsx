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
import { cleanFilename } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers';
import styles from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css';
import type { VerticalImageItemProps } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.types';
import { isClickOnVideoElement } from '@shared/dom/utils';
import { useTranslation } from '@shared/hooks/use-translation';
import { gallerySignals, setCurrentVideoElement } from '@shared/state/signals/gallery.signals';
import type { ImageFitMode } from '@shared/types/settings.types';
import {
  computeContainIntrinsicSizeOverride,
  createIntrinsicSizingStyle,
  resolveMediaDimensionsWithIntrinsicFlag,
} from '@shared/utils/media/media-dimensions';
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
  const [local, rest] = splitProps(props, [
    'media',
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
    'role',
    'tabIndex',
  ]);

  const isFocused = () => local.isFocused ?? false;
  const className = () => local.className ?? '';
  const shouldEagerLoad = () => (local.forceVisible ?? false) || (local.isActive ?? false);
  const translate = useTranslation();

  /** Priority hint for media fetch — high for above-the-fold (active, focused, preloaded),
   *  low for below-the-fold items yet to be scrolled into view. */
  const fetchPriority = () => (shouldEagerLoad() ? 'high' : 'low') as 'high' | 'low';

  const isVideo = () => local.media.type === 'video' || local.media.type === 'gif';

  /**
   * Resolve the image source URL for display.
   *
   * Uses media.url for all types. Non-active images previously used
   * thumbnailUrl (perf optimization B5), but this caused dimension
   * mismatches requiring complex workarounds. loading=\"lazy\" already
   * defers off-screen network requests, making thumbnail URLs redundant.
   */
  const displaySrc = createMemo(() => local.media.url);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isError, setIsError] = createSignal(false);

  // Defense-in-depth: validate the rendered URL
  const isDisplaySrcValid = createMemo(() => isUrlAllowed(displaySrc(), MEDIA_URL_POLICY));

  // MED-2: Track both media.id and index to handle item reorder.
  // <For> keys by index, so when items reorder the component instance
  // persists but receives new props — track index to ensure reset.
  createEffect(() => {
    void local.media.id;
    void local.index;
    setIsLoaded(false);
    setIsError(false);
  });

  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);
  const [imageRef, setImageRef] = createSignal<HTMLImageElement | null>(null);
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);

  const resolvedDimensions = createMemo(() => resolveMediaDimensionsWithIntrinsicFlag(local.media));
  const dimensions = () => resolvedDimensions().dimensions;
  const hasIntrinsicSize = () => resolvedDimensions().hasIntrinsicSize;

  const intrinsicSizingStyle = createMemo(() => createIntrinsicSizingStyle(dimensions()));

  const { applyMutedProgrammatically, handleVolumeChange } = useVideoVolumePersistence({
    videoRef,
    isVideo,
  });

  useVideoVisibility({
    container: containerRef,
    video: videoRef,
    isVideo,
    setMuted: applyMutedProgrammatically,
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

  const handleContainerClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (event) => {
    event.stopPropagation();

    if (isVideo()) {
      const video = videoRef();
      if (video && isClickOnVideoElement(event, video)) return;
    }

    containerRef()?.focus?.({ preventScroll: true });
    local.onClick();
  };

  const handleContainerKeyDown: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> = (event) => {
    if (rest.onKeyDown) {
      rest.onKeyDown(event);
      return;
    }
    if (local.role !== undefined && local.role !== 'button') return;

    const key = event.key;
    if (key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      local.onClick();
    }
  };

  const handleContainerKeyUp: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> = (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      local.onClick();
    }
  };

  const handleMediaLoad = () => {
    if (!isLoaded()) {
      setIsLoaded(true);
      setIsError(false);
      local.onMediaLoad?.(local.media.id, local.index);
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
      if (video && video.readyState >= 1 && !isLoaded()) handleMediaLoad();
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

  const assignContainerRef = (element: HTMLDivElement | null) => {
    setContainerRef(element);
    local.registerContainer?.(element);
  };

  const defaultContainerRole = () => 'listitem';
  const resolvedContainerRole = () =>
    (local.role ?? defaultContainerRole()) as JSX.HTMLAttributes<HTMLDivElement>['role'];

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
    <div
      ref={assignContainerRef}
      class={containerClasses()}
      data-index={local.index}
      data-fit-mode={resolvedFitMode()}
      data-media-loaded={isLoaded() ? 'true' : 'false'}
      data-has-intrinsic-size={hasIntrinsicSize() ? 'true' : undefined}
      style={mergedStyle()}
      onClick={handleContainerClick}
      onFocus={local.onFocus}
      onBlur={rest.onBlur}
      onKeyDown={handleContainerKeyDown}
      onKeyUp={handleContainerKeyUp}
      aria-label={local['aria-label'] || imageAltText()}
      aria-describedby={local['aria-describedby']}
      aria-posinset={local.index + 1}
      aria-setsize={totalItems()}
      role={resolvedContainerRole()}
      tabIndex={isFocused() ? 0 : -1}
      data-testid={__DEV__ ? rest['data-testid'] : undefined}
    >
      <div class={styles.imageWrapper}>
        {!isLoaded() && !isError() && (
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
            src={displaySrc()}
            controls
            ref={setVideoRef}
            class={cx(styles.video, fitModeClass(), isLoaded() ? styles.loaded : styles.loading)}
            aria-label={translate('msg.gal.videoCount', { index: local.index + 1, total: totalItems() })}
            onLoadedMetadata={handleMediaLoad}
            onError={handleMediaError}
            onDragStart={preventDragStart}
            onVolumeChange={handleVolumeChange}
          />
        ) : !isVideo() && isDisplaySrcValid() ? (
          <img
            ref={setImageRef}
            src={displaySrc()}
            alt={imageAltText()}
            width={dimensions().width}
            height={dimensions().height}
            loading={shouldEagerLoad() ? 'eager' : 'lazy'}
            decoding="async"
            class={cx(styles.image, fitModeClass(), isLoaded() ? styles.loaded : styles.loading)}
            onLoad={handleMediaLoad}
            onError={handleMediaError}
            onDragStart={preventDragStart}
          />
        ) : null}

        {isError() && (
          <div class={styles.error} role="alert">
            <span class={styles.errorIcon}>⚠️</span>
            <span class={styles.errorText}>
              {translate('msg.gal.loadFail', { type: isVideo() ? 'video' : 'image' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
