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
 * - Preserve video playback state through visibility changes
 * - Support context menu for additional actions
 * - Provide focus/blur event handling for accessibility
 * - Sync fit mode with DOM attributes and CSS classes
 *
 * **Features**:
 * - Video detection via extension and URL patterns
 * - Automatic filename cleanup for display
 * - Memoization for performance optimization
 * - HOC wrapper for gallery-specific functionality
 * - Multiple state signals for reactive updates
 * - Frame-accurate media loading
 *
 * **Properties**:
 * - Props: {@link VerticalImageItemProps}
 * - Uses memo wrapper to prevent unnecessary re-renders
 * - Supports forceVisible for preloading optimization
 *
 * **Event Handling**:
 * - PC-only events: click, focus, blur, context menu, keyboard
 * - Callback-based event propagation (onClick, onMediaLoad, etc.)
 * - No touch or pointer events (PC-only policy)
 *
 * @module features/gallery/components/vertical-gallery-view
 * @see VerticalImageItem.helpers for utility functions
 * @see VerticalImageItem.types for type definitions
 */

import type { ComponentType } from '@shared/types/app.types';
import type { ImageFitMode } from '@shared/types';
import type { JSX } from 'solid-js';

import { withGallery } from '@shared/components/hoc';
import { ComponentStandards } from '@shared/components/ui/StandardProps';
import { getSolid } from '@shared/external/vendors';
import { languageService } from '@shared/services/language-service';
import { logger } from '@shared/logging';
import styles from './VerticalImageItem.module.css';
import { cleanFilename, isVideoMedia } from './VerticalImageItem.helpers';
import type { VerticalImageItemProps } from './VerticalImageItem.types';

const solid = getSolid();
const { createSignal, createEffect, onCleanup, createMemo } = solid;

function getFitModeClass(fitMode?: ImageFitMode): string {
  switch (fitMode) {
    case 'original':
      return styles.fitOriginal ?? '';
    case 'fitHeight':
      return styles.fitHeight ?? '';
    case 'fitWidth':
      return styles.fitWidth ?? '';
    case 'fitContainer':
      return styles.fitContainer ?? '';
    default:
      return '';
  }
}

const FIT_MODE_CLASSES: readonly string[] = [
  styles.fitOriginal,
  styles.fitWidth,
  styles.fitHeight,
  styles.fitContainer,
].filter((className): className is string => Boolean(className));

const syncFitModeAttributes = (
  element: HTMLElement | null,
  mode: ImageFitMode,
  className: string
): void => {
  if (!element) {
    return;
  }

  if (element.getAttribute('data-fit-mode') !== mode) {
    element.setAttribute('data-fit-mode', mode);
  }

  if (FIT_MODE_CLASSES.length > 0) {
    element.classList.remove(...FIT_MODE_CLASSES);
  }

  if (className) {
    element.classList.add(className);
  }
};

function BaseVerticalImageItemCore(props: VerticalImageItemProps): JSX.Element | null {
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
  const [videoRefSignal, setVideoRefSignal] = createSignal<HTMLVideoElement | null>(null);

  let wasPlayingBeforeHidden = false;
  let wasMutedBeforeHidden: boolean | null = null;

  const parseDimension = (value: unknown): number | null => {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0 ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    return null;
  };

  const toRem = (value: number): string => `${(value / 16).toFixed(4)}rem`;

  const intrinsicSizingStyle = createMemo<JSX.CSSProperties | undefined>(() => {
    const width = parseDimension(media?.width);
    const height = parseDimension(media?.height);

    if (!width || !height) {
      return undefined;
    }

    const ratio = width / height;

    const style: Record<string, string> = {
      '--xeg-aspect-default': `${width} / ${height}`,
      '--xeg-gallery-item-intrinsic-width': toRem(width),
      '--xeg-gallery-item-intrinsic-height': toRem(height),
      '--xeg-gallery-item-intrinsic-ratio': ratio.toFixed(6),
    };

    return style as unknown as JSX.CSSProperties;
  });

  const hasIntrinsicSizing = createMemo(() => Boolean(intrinsicSizingStyle()));

  const handleClick = () => {
    const container = containerRef();
    container?.focus?.({ preventScroll: true });
    onClick?.();
  };

  const handleImageLoad = () => {
    if (!isLoaded()) {
      setIsLoaded(true);
      setIsError(false);
      onMediaLoad?.(media.url, index);
    }
  };

  const handleImageError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  const handleVideoLoadedMetadata = () => {
    setIsLoaded(true);
    setIsError(false);
    onMediaLoad?.(media.url, index);
  };

  const handleVideoLoaded = () => {
    if (!isLoaded()) {
      setIsLoaded(true);
      setIsError(false);
      onMediaLoad?.(media.url, index);
    }
  };

  const handleVideoError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  const handleImageContextMenuInternal = (event: MouseEvent) => {
    onImageContextMenu?.(event, media);
  };

  const handleImageDragStart = (event: DragEvent) => {
    event.preventDefault();
  };

  // forceVisible props 변경에 반응 (Solid.js 반응성 원칙)
  createEffect(() => {
    if (forceVisible && !isVisible()) {
      setIsVisible(true);
    }
  });

  createEffect(() => {
    const container = containerRef();
    if (!container || isVisible() || forceVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(container);
    onCleanup(() => observer.disconnect());
  });

  createEffect(() => {
    if (!isVisible() || isLoaded()) {
      return;
    }

    if (isVideo) {
      const video = videoRefSignal();
      if (video && video.readyState >= 1) {
        handleVideoLoaded();
      }
    } else {
      const image = imageRef();
      if (image?.complete) {
        handleImageLoad();
      }
    }
  });

  createEffect(() => {
    if (!isVideo) return;

    const container = containerRef();
    const video = videoRefSignal();

    if (!container || !video || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      if (!entry.isIntersecting) {
        try {
          wasPlayingBeforeHidden = !video.paused;
          wasMutedBeforeHidden = video.muted;
          video.muted = true;
          if (!video.paused) {
            video.pause();
          }
        } catch (err) {
          logger.warn('Failed to pause video', { error: err });
        }
      } else {
        try {
          if (wasMutedBeforeHidden !== null) {
            video.muted = wasMutedBeforeHidden;
          }
          if (wasPlayingBeforeHidden) {
            void video.play?.();
          }
        } catch (err) {
          logger.warn('Failed to resume video', { error: err });
        } finally {
          wasPlayingBeforeHidden = false;
          wasMutedBeforeHidden = null;
        }
      }
    });

    observer.observe(container);
    onCleanup(() => observer.disconnect());
  });

  createEffect(() => {
    if (!isVideo) return;
    const video = videoRefSignal();
    if (video && typeof video.muted === 'boolean') {
      try {
        video.muted = true;
      } catch (err) {
        logger.warn('Failed to mute video', { error: err });
      }
    }
  });

  const resolvedFitMode = createMemo<ImageFitMode>(() => {
    const value = props.fitMode;
    if (typeof value === 'function') {
      const result = value();
      return (result ?? 'fitWidth') as ImageFitMode;
    }

    return (value ?? 'fitWidth') as ImageFitMode;
  });
  const fitModeClass = createMemo(() => getFitModeClass(resolvedFitMode()));

  const containerClasses = createMemo(() =>
    ComponentStandards.createClassName(
      styles.container,
      styles.imageWrapper,
      isActive ? styles.active : undefined,
      isFocused ? styles.focused : undefined,
      fitModeClass(),
      className
    )
  );

  const imageClasses = createMemo(() =>
    ComponentStandards.createClassName(styles.image, fitModeClass())
  );

  createEffect(() => {
    const mode = resolvedFitMode();
    const nextClass = fitModeClass();

    syncFitModeAttributes(containerRef(), mode, nextClass);
    syncFitModeAttributes(imageRef(), mode, nextClass);
    syncFitModeAttributes(videoRefSignal(), mode, nextClass);
  });

  const ariaProps = ComponentStandards.createAriaProps({
    'aria-label': ariaLabel || `미디어 ${index + 1}: ${cleanFilename(media.filename)}`,
    'aria-describedby': ariaDescribedBy,
    role: role || 'button',
    tabIndex: tabIndex ?? 0,
  } as Record<string, string | number | boolean | undefined>);

  const testProps = ComponentStandards.createTestProps(testId);

  const assignContainerRef = (element: HTMLDivElement | null) => {
    setContainerRef(element);
    registerContainer?.(element);
  };

  return (
    <div
      ref={assignContainerRef}
      class={containerClasses()}
      data-index={index}
      data-fit-mode={resolvedFitMode()}
      data-media-loaded={isLoaded() ? 'true' : 'false'}
      style={intrinsicSizingStyle()}
      data-has-intrinsic-size={hasIntrinsicSizing() ? 'true' : 'false'}
      onClick={handleClick}
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
              <div class={styles.loadingSpinner} />
            </div>
          )}

          {isVideo ? (
            <video
              src={media.url}
              autoplay={false}
              controls
              ref={setVideoRefSignal}
              class={ComponentStandards.createClassName(
                styles.video,
                fitModeClass(),
                isLoaded() ? styles.loaded : styles.loading
              )}
              data-fit-mode={resolvedFitMode()}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onLoadedData={handleVideoLoaded}
              onCanPlay={handleVideoLoaded}
              onError={handleVideoError}
              onContextMenu={handleImageContextMenuInternal}
              onDragStart={handleImageDragStart}
            />
          ) : (
            <img
              ref={setImageRef}
              src={media.url}
              alt={
                cleanFilename(media.filename) ||
                languageService.getFormattedString('messages.gallery.failedToLoadImage', {
                  type: 'image',
                })
              }
              loading='lazy'
              decoding='async'
              class={ComponentStandards.createClassName(
                imageClasses(),
                isLoaded() ? styles.loaded : styles.loading
              )}
              data-fit-mode={resolvedFitMode()}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onContextMenu={handleImageContextMenuInternal}
              onDragStart={handleImageDragStart}
            />
          )}

          {isError() && (
            <div class={styles.error}>
              <span class={styles.errorIcon}>⚠️</span>
              <span class={styles.errorText}>
                {languageService.getFormattedString('messages.gallery.failedToLoadImage', {
                  type: isVideo ? 'video' : 'image',
                })}
              </span>
            </div>
          )}
        </>
      )}

      {/* Phase 58: 이미지 오른쪽 상단의 다운로드용 버튼 제거 */}
    </div>
  );
}

const BaseComponent = BaseVerticalImageItemCore as unknown as ComponentType<VerticalImageItemProps>;

const WithGalleryVerticalImageItem = withGallery(BaseComponent, {
  type: 'item',
  className: 'vertical-item',
  events: {
    preventClick: false,
    preventKeyboard: false,
    blockTwitterNative: true,
  },
  customData: {
    component: 'vertical-image-item',
    role: 'gallery-item',
  },
});

const VerticalImageItemMemo = solid.memo(WithGalleryVerticalImageItem);

Object.defineProperty(VerticalImageItemMemo, 'displayName', {
  value: 'memo(VerticalImageItem)',
  writable: false,
  configurable: true,
});

export type { VerticalImageItemProps, FitModeProp } from './VerticalImageItem.types';
export const VerticalImageItem = VerticalImageItemMemo;
