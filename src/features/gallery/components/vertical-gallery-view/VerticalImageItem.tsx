/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Image/Video Item Component (Solid.js)
 * @description Individual media item component for displaying images and videos in gallery
 *
 * **Responsibilities**:
 * - Render image or video element based on media type
 * - Manage fit mode (original, fitWidth, fitHeight, fitContainer)
 * - Handle loading, error, and visibility states
 * - Auto-pause videos when item becomes invisible
 * - Provide focus/blur event handling for accessibility
 *
 * **Architecture**:
 * - Media is rendered eagerly (no IntersectionObserver-gated lazy loading)
 * - Dimension calculation extracted to @shared/utils/media/media-dimensions
 * - Video visibility control extracted to useVideoVisibility hook
 *
 * @module features/gallery/components/vertical-gallery-view
 * @version 7.0.0 - SharedObserver integration and hook extraction
 */

import { createDebounced } from '@shared/async/debounce';
import { getTypedSettingOr, setTypedSetting } from '@shared/container/settings-access';
import type { JSX, JSXElement } from '@shared/external/vendors';
import { useTranslation } from '@shared/hooks/use-translation';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type { ImageFitMode } from '@shared/types';
import {
  createIntrinsicSizingStyle,
  resolveMediaDimensionsWithIntrinsicFlag,
} from '@shared/utils/media/media-dimensions';
import { cx } from '@shared/utils/text/formatting';
import { createEffect, createMemo, createSignal, onCleanup, splitProps, untrack } from 'solid-js';
import { useVideoVisibility } from './hooks/useVideoVisibility';
import { createVideoVolumeChangeGuard } from './utils/video-volume-change-guard';
import {
  cleanFilename,
  isVideoMedia,
  normalizeVideoMutedSetting,
  normalizeVideoVolumeSetting,
} from './VerticalImageItem.helpers';
import styles from './VerticalImageItem.module.css';
import type { VerticalImageItemProps } from './VerticalImageItem.types';

/** Fit mode CSS class mapping */
const FIT_MODE_CLASSES: Record<ImageFitMode, string | undefined> = {
  original: styles.fitOriginal,
  fitHeight: styles.fitHeight,
  fitWidth: styles.fitWidth,
  fitContainer: styles.fitContainer,
};

/**
 * Core vertical image item component
 */
export function VerticalImageItem(props: VerticalImageItemProps): JSXElement | null {
  // NOTE: Do not destructure reactive props in Solid. Use splitProps to preserve reactivity.
  const [local, rest] = splitProps(
    props as VerticalImageItemProps & { readonly isVisible?: boolean },
    [
      'media',
      'index',
      'isActive',
      'isFocused',
      'forceVisible',
      // Legacy prop: stripped to avoid leaking unknown attributes to the DOM.
      // This prop is intentionally not part of the public VerticalImageItemProps type.
      'isVisible',
      'onClick',
      'onImageContextMenu',
      'className',
      'onMediaLoad',
      'fitMode',
      'style',
      'data-testid',
      'aria-label',
      'aria-describedby',
      'registerContainer',
      'role',
      'tabIndex',
      'onFocus',
      'onBlur',
      'onKeyDown',
    ]
  );

  const isFocused = createMemo(() => local.isFocused ?? false);
  const className = createMemo(() => local.className ?? '');

  const translate = useTranslation();

  const isVideo = createMemo(() => {
    // Prefer the extractor-provided media.type (most accurate).
    // Fall back to URL/extension heuristics only as a safety net.
    switch (local.media.type) {
      case 'video':
      case 'gif':
        return true;
      case 'image':
        return false;
      default:
        return isVideoMedia(local.media);
    }
  });
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isError, setIsError] = createSignal(false);

  // Reset per-media load/error state when the item is reused with a different media.
  createEffect(() => {
    void local.media.id;
    setIsLoaded(false);
    setIsError(false);
  });

  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);
  const [imageRef, setImageRef] = createSignal<HTMLImageElement | null>(null);
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);

  const resolvedDimensions = createMemo(() => resolveMediaDimensionsWithIntrinsicFlag(local.media));
  const dimensions = () => resolvedDimensions().dimensions;
  const hasIntrinsicSize = () => resolvedDimensions().hasIntrinsicSize;

  const intrinsicSizingStyle = createMemo<JSX.CSSProperties>(() => {
    return createIntrinsicSizingStyle(dimensions());
  });

  const mergedStyle = createMemo<JSX.CSSProperties>(() => {
    const base = intrinsicSizingStyle();
    const extra = (local.style ?? {}) as JSX.CSSProperties;
    return { ...base, ...extra };
  });

  const volumeChangeGuard = createVideoVolumeChangeGuard();

  const applyMutedProgrammatically = (videoEl: HTMLVideoElement, muted: boolean) => {
    volumeChangeGuard.markProgrammaticChange({ volume: videoEl.volume, muted });
    videoEl.muted = muted;
  };

  const applyVolumeProgrammatically = (videoEl: HTMLVideoElement, volume: number) => {
    volumeChangeGuard.markProgrammaticChange({ volume, muted: videoEl.muted });
    videoEl.volume = volume;
  };

  useVideoVisibility({
    container: containerRef,
    video: videoRef,
    isVideo,
    setMuted: applyMutedProgrammatically,
  });

  createEffect(() => {
    const video = videoRef();
    if (local.isActive && video) {
      const alreadySignaled = untrack(() => gallerySignals.currentVideoElement.value === video);
      if (!alreadySignaled) {
        gallerySignals.currentVideoElement.value = video;
      }
      return;
    }

    const shouldClear = untrack(() => gallerySignals.currentVideoElement.value === video);
    if (shouldClear) {
      gallerySignals.currentVideoElement.value = null;
    }
  });

  // Video volume settings (persisted across sessions)
  const [videoVolume, setVideoVolume] = createSignal(
    normalizeVideoVolumeSetting(getTypedSettingOr('gallery.videoVolume', 1.0), 1.0)
  );
  const [videoMuted, setVideoMuted] = createSignal(
    normalizeVideoMutedSetting(getTypedSettingOr('gallery.videoMuted', false), false)
  );

  // Guard to prevent handling synthetic volumechange events triggered by us when
  // programmatically applying persisted settings. This avoids races where the event
  // handler reads stale values during the initial apply and overwrites the signal.
  let isApplyingVideoSettings = false;

  // Apply saved volume/muted state when video element is ready
  createEffect(() => {
    const video = videoRef();
    if (video && isVideo()) {
      // Apply persisted state while preventing the volumechange handler from
      // reacting to our programmatic assignment. We set both properties under
      // a guard so any intermediate events are ignored.
      isApplyingVideoSettings = true;
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
        isApplyingVideoSettings = false;
      }
    }
  });

  // Debounced settings persistence to reduce GM_setValue calls during slider drag
  const debouncedSaveVolume = createDebounced((volume: number, muted: boolean) => {
    void setTypedSetting('gallery.videoVolume', volume);
    void setTypedSetting('gallery.videoMuted', muted);
  }, 300);

  // Cleanup debounced function on unmount
  onCleanup(() => {
    debouncedSaveVolume.flush();
  });

  // Handle volume change events from video controls
  const handleVolumeChange = (event: Event) => {
    const video = event.currentTarget as HTMLVideoElement;
    const snapshot = { volume: video.volume, muted: video.muted };

    if (isApplyingVideoSettings || volumeChangeGuard.shouldIgnoreChange(snapshot)) {
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

  // Event handlers
  const preventDragStart = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleContainerClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (event) => {
    event.stopPropagation();

    if (isVideo()) {
      const video = videoRef();
      if (video) {
        const target = event.target;
        const targetInVideo = target instanceof Node && video.contains(target);

        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        const pathIncludesVideo = Array.isArray(path) && path.includes(video);

        // If the click originated from the <video> element or its native controls,
        // do not trigger item activation. This prevents nested interaction conflicts
        // between the gallery item click handler and native video controls.
        if (targetInVideo || pathIncludesVideo) {
          return;
        }
      }

      // Click outside the video element: treat as item activation.
      containerRef()?.focus?.({ preventScroll: true });
      local.onClick();
      return;
    }

    containerRef()?.focus?.({ preventScroll: true });
    local.onClick();
  };

  const handleContainerKeyDown: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> = (event) => {
    if (typeof local.onKeyDown === 'function') {
      local.onKeyDown(event);
      return;
    }

    // Only provide default activation semantics when the container is explicitly a button.
    if ((local.role ?? (isVideo() ? 'group' : 'button')) !== 'button') {
      return;
    }

    // Default keyboard activation for role=button containers.
    // - Enter: activate
    // - Space: activate + prevent page scroll
    const key = event.key;
    if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
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

  const handleContextMenu = (event: MouseEvent) => {
    local.onImageContextMenu?.(event, local.media);
  };

  // Check if media is already loaded
  createEffect(() => {
    if (isLoaded()) {
      return;
    }

    if (isVideo()) {
      const video = videoRef();
      if (video && video.readyState >= 1) {
        handleMediaLoad();
      }
    } else {
      const image = imageRef();
      if (image?.complete) {
        // `HTMLImageElement.complete` can be true even on failed loads (naturalWidth === 0).
        if (image.naturalWidth > 0) {
          handleMediaLoad();
        } else {
          handleMediaError();
        }
      }
    }
  });

  // Fit mode handling
  const resolvedFitMode = createMemo<ImageFitMode>(() => {
    const value = local.fitMode;
    if (typeof value === 'function') {
      return value() ?? 'fitWidth';
    }
    return value ?? 'fitWidth';
  });

  const fitModeClass = createMemo(() => FIT_MODE_CLASSES[resolvedFitMode()] ?? '');

  const containerClasses = createMemo(() =>
    cx(
      'xeg-gallery',
      'xeg-gallery-item',
      'vertical-item',
      styles.container,
      local.isActive ? styles.active : undefined,
      isFocused() ? styles.focused : undefined,
      className()
    )
  );

  // Accessibility props
  const assignContainerRef = (element: HTMLDivElement | null) => {
    setContainerRef(element);
    local.registerContainer?.(element);
  };

  const defaultContainerRole = createMemo(() => (isVideo() ? 'group' : 'button'));
  const resolvedContainerRole = createMemo(
    () => (local.role ?? defaultContainerRole()) as JSX.HTMLAttributes<HTMLDivElement>['role']
  );

  const defaultAriaLabel = createMemo(() =>
    translate('msg.gal.itemLbl', {
      index: local.index + 1,
      filename: cleanFilename(local.media.filename),
    })
  );

  return (
    <div
      {...rest}
      ref={assignContainerRef}
      class={containerClasses()}
      data-xeg-role="gallery-item"
      data-index={local.index}
      data-fit-mode={resolvedFitMode()}
      data-media-loaded={isLoaded() ? 'true' : 'false'}
      data-has-intrinsic-size={hasIntrinsicSize() ? 'true' : undefined}
      data-xeg-gallery="true"
      data-xeg-gallery-type="item"
      data-xeg-gallery-version="2.0"
      data-xeg-component="vertical-image-item"
      data-xeg-block-twitter="true"
      style={mergedStyle()}
      onClick={handleContainerClick}
      onFocus={local.onFocus}
      onBlur={local.onBlur}
      onKeyDown={handleContainerKeyDown}
      aria-label={local['aria-label'] || defaultAriaLabel()}
      aria-describedby={local['aria-describedby']}
      role={resolvedContainerRole()}
      tabIndex={local.tabIndex ?? 0}
      data-testid={__DEV__ ? local['data-testid'] : undefined}
    >
      <div class={styles.imageWrapper} data-xeg-role="media-wrapper">
        {!isLoaded() && !isError() && !isVideo() && (
          <div class={styles.placeholder}>
            <div class={cx('xeg-spinner', styles.loadingSpinner)} />
          </div>
        )}

        {isVideo() ? (
          <video
            src={local.media.url}
            controls
            ref={setVideoRef}
            class={cx(styles.video, fitModeClass(), isLoaded() ? styles.loaded : styles.loading)}
            onLoadedMetadata={handleMediaLoad}
            onLoadedData={handleMediaLoad}
            onCanPlay={handleMediaLoad}
            onError={handleMediaError}
            onContextMenu={handleContextMenu}
            onDragStart={preventDragStart}
            onVolumeChange={handleVolumeChange}
          />
        ) : (
          <img
            ref={setImageRef}
            src={local.media.url}
            alt={cleanFilename(local.media.filename)}
            loading="eager"
            decoding="async"
            class={cx(styles.image, fitModeClass(), isLoaded() ? styles.loaded : styles.loading)}
            onLoad={handleMediaLoad}
            onError={handleMediaError}
            onContextMenu={handleContextMenu}
            onDragStart={preventDragStart}
          />
        )}

        {isError() && (
          <div class={styles.error}>
            <span class={styles.errorIcon}>⚠️</span>
            <span class={styles.errorText}>
              {translate('msg.gal.loadFail', {
                type: isVideo() ? 'video' : 'image',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export type { FitModeProp, VerticalImageItemProps } from './VerticalImageItem.types';
