/**
 * @fileoverview UnoCSS Vertical Image Item Component
 * @version 1.0.0 - CSS Modules to UnoCSS Migration
 * @description Individual media item using UnoCSS atomic classes
 * @module @features/gallery/components/vertical-gallery-view
 *
 * Features:
 * - Image and video rendering with fit modes
 * - Loading, error, and visibility states
 * - Auto-pause videos when invisible
 * - UnoCSS atomic classes for optimal styling
 *
 * @example
 * ```tsx
 * import { VerticalImageItem } from './VerticalImageItem.uno';
 *
 * <VerticalImageItem media={mediaItem} index={0} isActive fitMode="fitWidth" />
 * ```
 */

import { getLanguageService } from '@shared/container/service-accessors';
import { getSetting, setSetting } from '@shared/container/settings-access';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from '@shared/external/vendors/solid-hooks';
import { createIntrinsicSizingStyle, resolveMediaDimensions } from '@shared/media/media-utils';
import type { ImageFitMode } from '@shared/types';
import { SharedObserver } from '@shared/utils/performance';
import { createClassName } from '@shared/utils/text/formatting';
import type { JSX } from 'solid-js';
import { useVideoVisibility } from './hooks/useVideoVisibility';
import { cleanFilename, isVideoMedia } from './VerticalImageItem.helpers';
import type { VerticalImageItemProps } from './VerticalImageItem.types';

// ============================================================================
// UnoCSS Class Mappings
// ============================================================================

/** Fit mode to UnoCSS class mapping for images */
const IMAGE_FIT_MODE_CLASSES: Record<ImageFitMode, string> = {
  original: 'xeg-image-item-fit-original',
  fitHeight: 'xeg-image-item-fit-height',
  fitWidth: 'xeg-image-item-fit-width',
  fitContainer: 'xeg-image-item-fit-container',
};

/** Fit mode to UnoCSS class mapping for videos */
const VIDEO_FIT_MODE_CLASSES: Record<ImageFitMode, string> = {
  original: 'xeg-video-item-fit-original',
  fitHeight: 'xeg-video-item-fit-height',
  fitWidth: 'xeg-video-item-fit-width',
  fitContainer: 'xeg-video-item-fit-container',
};

// ============================================================================
// Vertical Image Item Component
// ============================================================================

/**
 * UnoCSS Vertical Image Item Component
 *
 * Individual media item with image/video rendering and fit modes.
 * Uses atomic CSS classes for optimal bundle size.
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

  const dimensions = createMemo(() => resolveMediaDimensions(media));

  const intrinsicSizingStyle = createMemo<JSX.CSSProperties>(
    () => createIntrinsicSizingStyle(dimensions()) as unknown as JSX.CSSProperties
  );

  useVideoVisibility({
    container: containerRef,
    video: videoRef,
    isVideo,
  });

  // Video volume settings
  const [videoVolume, setVideoVolume] = createSignal(getSetting('gallery.videoVolume', 1.0));
  const [videoMuted, setVideoMuted] = createSignal(getSetting('gallery.videoMuted', false));

  let isApplyingVideoSettings = false;

  createEffect(() => {
    const video = videoRef();
    if (video && isVideo) {
      isApplyingVideoSettings = true;
      try {
        video.muted = videoMuted();
        video.volume = videoVolume();
      } finally {
        isApplyingVideoSettings = false;
      }
    }
  });

  const handleVolumeChange = (event: Event) => {
    if (isApplyingVideoSettings) return;
    const video = event.currentTarget as HTMLVideoElement;
    const newVolume = video.volume;
    const newMuted = video.muted;

    setVideoVolume(newVolume);
    setVideoMuted(newMuted);

    void setSetting('gallery.videoVolume', newVolume);
    void setSetting('gallery.videoMuted', newMuted);
  };

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

  // Visibility handling
  createEffect(() => {
    if (forceVisible && !isVisible()) {
      setIsVisible(true);
    }
  });

  createEffect(() => {
    const container = containerRef();
    if (!container || isVisible() || forceVisible) return;

    let unsubscribe: (() => void) | null = null;

    const handleEntry = (entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        unsubscribe?.();
        unsubscribe = null;
      }
    };

    unsubscribe = SharedObserver.observe(container, handleEntry, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    onCleanup(() => {
      unsubscribe?.();
      unsubscribe = null;
    });
  });

  createEffect(() => {
    if (!isVisible() || isLoaded()) return;

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

  const imageFitClass = createMemo(() => IMAGE_FIT_MODE_CLASSES[resolvedFitMode()]);
  const videoFitClass = createMemo(() => VIDEO_FIT_MODE_CLASSES[resolvedFitMode()]);

  // UnoCSS class builders
  const containerClasses = createMemo(() =>
    createClassName(
      'xeg-image-item-container',
      'xeg-image-item-container-hover',
      'xeg-image-item-container-focus',
      isActive ? 'xeg-image-item-container-active' : undefined,
      isFocused ? 'xeg-image-item-container-focused' : undefined,
      resolvedFitMode() === 'original' ? 'xeg-image-item-container-original' : undefined,
      isLoaded() ? 'xeg-image-item-container-loaded' : undefined,
      isError() ? 'xeg-image-item-container-error' : undefined,
      className
    )
  );

  const imageClasses = createMemo(() =>
    createClassName(
      'xeg-image-item-image',
      'xeg-image-item-transition',
      imageFitClass(),
      isLoaded() ? 'xeg-image-item-loaded' : 'xeg-image-item-loading'
    )
  );

  const videoClasses = createMemo(() =>
    createClassName(
      'xeg-image-item-video',
      'xeg-image-item-transition',
      videoFitClass(),
      isLoaded() ? 'xeg-image-item-loaded' : 'xeg-image-item-loading'
    )
  );

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
          {/* Loading Placeholder */}
          {!isLoaded() && !isError() && !isVideo && (
            <div class="xeg-image-item-placeholder">
              <div class="xeg-spinner xeg-image-item-spinner" />
            </div>
          )}

          {/* Video Element */}
          {isVideo ? (
            <video
              src={media.url}
              autoplay={false}
              controls
              ref={setVideoRef}
              class={videoClasses()}
              data-fit-mode={resolvedFitMode()}
              onLoadedMetadata={handleMediaLoad}
              onLoadedData={handleMediaLoad}
              onCanPlay={handleMediaLoad}
              onError={handleMediaError}
              onContextMenu={handleContextMenu}
              onDragStart={(e: DragEvent) => e.preventDefault()}
              onVolumeChange={handleVolumeChange}
            />
          ) : (
            /* Image Element */
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
              class={imageClasses()}
              data-fit-mode={resolvedFitMode()}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              onContextMenu={handleContextMenu}
              onDragStart={(e: DragEvent) => e.preventDefault()}
            />
          )}

          {/* Error State */}
          {isError() && (
            <div class="xeg-image-item-error">
              <span class="xeg-image-item-error-icon">⚠️</span>
              <span class="xeg-image-item-error-text">
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

export default VerticalImageItem;
