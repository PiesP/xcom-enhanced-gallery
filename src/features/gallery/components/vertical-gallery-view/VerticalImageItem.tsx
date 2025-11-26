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
 * **Architecture (Phase 434)**:
 * - Uses SharedObserver for memory-efficient visibility detection
 * - Dimension calculation extracted to @shared/utils/media/dimensions
 * - Video visibility control extracted to useVideoVisibility hook
 *
 * @module features/gallery/components/vertical-gallery-view
 * @version 7.0.0 - Phase 434: SharedObserver integration and hook extraction
 */

import type { ImageFitMode } from '@shared/types';
import type { JSX } from 'solid-js';

import { getLanguageService } from '@shared/container/service-accessors';
import { getSolid } from '@shared/external/vendors';
import { createIntrinsicSizingStyle, resolveMediaDimensions } from '@shared/utils/media/dimensions';
import { SharedObserver } from '@shared/utils/performance';
import { createClassName } from '@shared/utils/text/formatting';
import { cleanFilename, isVideoMedia } from './VerticalImageItem.helpers';
import styles from './VerticalImageItem.module.css';
import type { VerticalImageItemProps } from './VerticalImageItem.types';
import { useVideoVisibility } from './hooks/useVideoVisibility';

const solid = getSolid();
const { createSignal, createEffect, onCleanup, createMemo } = solid;

/** Fit mode CSS class mapping */
const FIT_MODE_CLASSES: Record<string, string | undefined> = {
  original: styles.fitOriginal,
  fitHeight: styles.fitHeight,
  fitWidth: styles.fitWidth,
  fitContainer: styles.fitContainer,
};

/**
 * Core vertical image item component
 */
export function VerticalImageItem(props: VerticalImageItemProps): JSX.Element | null {
  const {
    media,
    index,
    isActive,
    isFocused = false,
    forceVisible = false,
    onClick,
    onImageContextMenu,
    className = '',
    onMediaLoad,
    'data-testid': testId,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    registerContainer,
    role,
    tabIndex,
    onFocus,
    onBlur,
    onKeyDown,
  } = props;

  const isVideo = isVideoMedia(media);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isError, setIsError] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(forceVisible);

  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);
  const [imageRef, setImageRef] = createSignal<HTMLImageElement | null>(null);
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);

  // Phase 434: Use extracted dimension utility
  const dimensions = createMemo(() => resolveMediaDimensions(media));

  const intrinsicSizingStyle = createMemo<JSX.CSSProperties>(() => {
    return createIntrinsicSizingStyle(dimensions()) as unknown as JSX.CSSProperties;
  });

  // Phase 434: Use extracted video visibility hook
  useVideoVisibility({
    container: containerRef,
    video: videoRef,
    isVideo,
  });

  // Event handlers
  const handleClick = () => {
    containerRef()?.focus?.({ preventScroll: true });
    onClick?.();
  };

  const handleContainerClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = event => {
    const mouseEvent = event as MouseEvent;
    mouseEvent?.stopImmediatePropagation?.();
    handleClick();
  };

  const handleMediaLoad = () => {
    if (!isLoaded()) {
      setIsLoaded(true);
      setIsError(false);
      onMediaLoad?.(media.url, index);
    }
  };

  const handleMediaError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  const handleContextMenu = (event: MouseEvent) => {
    onImageContextMenu?.(event, media);
  };

  // Sync forceVisible to isVisible
  createEffect(() => {
    if (forceVisible && !isVisible()) {
      setIsVisible(true);
    }
  });

  // Phase 434: Lazy visibility detection using SharedObserver
  createEffect(() => {
    const container = containerRef();
    if (!container || isVisible() || forceVisible) {
      return;
    }

    const handleEntry = (entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        SharedObserver.unobserve(container);
      }
    };

    SharedObserver.observe(container, handleEntry, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    onCleanup(() => {
      SharedObserver.unobserve(container);
    });
  });

  // Check if media is already loaded
  createEffect(() => {
    if (!isVisible() || isLoaded()) {
      return;
    }

    if (isVideo) {
      const video = videoRef();
      if (video && video.readyState >= 1) {
        handleMediaLoad();
      }
    } else {
      const image = imageRef();
      if (image?.complete) {
        handleMediaLoad();
      }
    }
  });

  // Fit mode handling
  const resolvedFitMode = createMemo<ImageFitMode>(() => {
    const value = props.fitMode;
    if (typeof value === 'function') {
      return (value() ?? 'fitWidth') as ImageFitMode;
    }
    return (value ?? 'fitWidth') as ImageFitMode;
  });

  const fitModeClass = createMemo(() => FIT_MODE_CLASSES[resolvedFitMode()] ?? '');

  const containerClasses = createMemo(() =>
    createClassName(
      'xeg-gallery',
      'xeg-gallery-item',
      'vertical-item',
      styles.container,
      styles.imageWrapper,
      isActive ? styles.active : undefined,
      isFocused ? styles.focused : undefined,
      fitModeClass(),
      className,
    ),
  );

  const imageClasses = createMemo(() => createClassName(styles.image, fitModeClass()));

  // Accessibility props
  const ariaProps = {
    'aria-label': ariaLabel || `Media ${index + 1}: ${cleanFilename(media.filename)}`,
    'aria-describedby': ariaDescribedBy,
    role: (role || 'button') as JSX.HTMLAttributes<HTMLDivElement>['role'],
    tabIndex: tabIndex ?? 0,
  };

  const testProps = testId ? { 'data-testid': testId } : {};

  const assignContainerRef = (element: HTMLDivElement | null) => {
    setContainerRef(element);
    registerContainer?.(element);
  };

  return (
    <div
      ref={assignContainerRef}
      class={containerClasses()}
      data-xeg-role="gallery-item"
      data-index={index}
      data-item-index={index}
      data-fit-mode={resolvedFitMode()}
      data-media-loaded={isLoaded() ? 'true' : 'false'}
      data-xeg-gallery="true"
      data-xeg-gallery-type="item"
      data-xeg-gallery-version="2.0"
      data-xeg-component="vertical-image-item"
      data-xeg-block-twitter="true"
      style={intrinsicSizingStyle()}
      onClick={handleContainerClick}
      onFocus={onFocus as (event: FocusEvent) => void}
      onBlur={onBlur as (event: FocusEvent) => void}
      onKeyDown={onKeyDown as (event: KeyboardEvent) => void}
      {...ariaProps}
      {...testProps}
    >
      {isVisible() && (
        <>
          {!isLoaded() && !isError() && !isVideo && (
            <div class={styles.placeholder}>
              <div class={createClassName('xeg-spinner', styles.loadingSpinner)} />
            </div>
          )}

          {isVideo ? (
            <video
              src={media.url}
              autoplay={false}
              controls
              ref={setVideoRef}
              class={createClassName(
                styles.video,
                fitModeClass(),
                isLoaded() ? styles.loaded : styles.loading,
              )}
              data-fit-mode={resolvedFitMode()}
              onLoadedMetadata={handleMediaLoad}
              onLoadedData={handleMediaLoad}
              onCanPlay={handleMediaLoad}
              onError={handleMediaError}
              onContextMenu={handleContextMenu}
              onDragStart={(e: DragEvent) => e.preventDefault()}
            />
          ) : (
            <img
              ref={setImageRef}
              src={media.url}
              alt={
                cleanFilename(media.filename) ||
                getLanguageService().translate('messages.gallery.failedToLoadImage', {
                  type: 'image',
                })
              }
              loading="lazy"
              decoding="async"
              class={createClassName(imageClasses(), isLoaded() ? styles.loaded : styles.loading)}
              data-fit-mode={resolvedFitMode()}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              onContextMenu={handleContextMenu}
              onDragStart={(e: DragEvent) => e.preventDefault()}
            />
          )}

          {isError() && (
            <div class={styles.error}>
              <span class={styles.errorIcon}>⚠️</span>
              <span class={styles.errorText}>
                {getLanguageService().translate('messages.gallery.failedToLoadImage', {
                  type: isVideo ? 'video' : 'image',
                })}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export type { FitModeProp, VerticalImageItemProps } from './VerticalImageItem.types';
