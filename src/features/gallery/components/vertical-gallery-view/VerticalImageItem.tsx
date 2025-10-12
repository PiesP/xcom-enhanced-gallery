/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Image Item Component (Solid.js)
 * @description 통합된 수직 이미지 아이템 컴포넌트 - StandardProps 표준화 완료
 */

import type { ComponentType } from '@shared/types/app.types';
import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';
import type { JSX } from 'solid-js';

import { withGallery, type GalleryComponentProps } from '../../../../shared/components/hoc';
import { Button } from '../../../../shared/components/ui/Button/Button';
import type { ButtonProps } from '../../../../shared/components/ui/Button/Button';
import { ComponentStandards } from '../../../../shared/components/ui/StandardProps';
import { getSolid } from '../../../../shared/external/vendors';
import { languageService } from '../../../../shared/services/language-service';
import styles from './VerticalImageItem.module.css';

const solid = getSolid();
const { createSignal, createEffect, onCleanup, createMemo } = solid;

const ButtonCompat = Button as unknown as (props: ButtonProps) => JSX.Element;

function cleanFilename(filename?: string): string {
  if (!filename) {
    return 'Untitled';
  }

  let cleaned = filename
    .replace(/^twitter_media_\d{8}T\d{6}_\d+\./, '')
    .replace(/^\/media\//, '')
    .replace(/^\.\//g, '')
    .replace(/[\\/]/g, '_');

  if (cleaned.length > 40 || !cleaned) {
    const match = filename.match(/([a-zA-Z0-9_-]+)$/);
    cleaned = match?.[1] ?? 'Image';
  }

  return cleaned;
}

function isVideoMedia(media: MediaInfo): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const urlLowerCase = media.url.toLowerCase();

  if (videoExtensions.some(ext => urlLowerCase.includes(ext))) {
    return true;
  }

  if (media.filename) {
    const filenameLowerCase = media.filename.toLowerCase();
    if (videoExtensions.some(ext => filenameLowerCase.endsWith(ext))) {
      return true;
    }
  }

  if (urlLowerCase.includes('video.twimg.com') || urlLowerCase.includes('/video/')) {
    return true;
  }

  return false;
}

type FitModeProp = ImageFitMode | (() => ImageFitMode | undefined);

interface VerticalImageItemProps extends GalleryComponentProps {
  readonly media: MediaInfo;
  readonly index: number;
  readonly isActive: boolean;
  readonly isFocused?: boolean;
  readonly isVisible?: boolean;
  readonly forceVisible?: boolean;
  readonly onClick: () => void;
  readonly onDownload?: () => void;
  readonly fitMode?: FitModeProp;
  readonly onMediaLoad?: (mediaId: string, index: number) => void;
  readonly onImageContextMenu?: (event: MouseEvent, media: MediaInfo) => void;
  readonly className?: string;
  readonly registerContainer?: (element: HTMLDivElement | null) => void;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly role?: string;
  readonly tabIndex?: number;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
}

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

function BaseVerticalImageItemCore(props: VerticalImageItemProps): JSX.Element | null {
  const {
    media,
    index,
    isActive,
    isFocused = false,
    forceVisible = false,
    onClick,
    onDownload,
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

  const handleClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest(`.${styles.downloadButton}`)) {
      return;
    }

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

  const handleDownloadClick = (event?: Event) => {
    event?.preventDefault();
    (event as MouseEvent | undefined)?.stopPropagation();
    onDownload?.();
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
        } catch {
          /* ignore */
        }
      } else {
        try {
          if (wasMutedBeforeHidden !== null) {
            video.muted = wasMutedBeforeHidden;
          }
          if (wasPlayingBeforeHidden) {
            void video.play?.();
          }
        } catch {
          /* ignore */
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
      } catch {
        /* ignore */
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
    const container = containerRef();
    const image = imageRef();
    const video = videoRefSignal();
    const currentFitClass = fitModeClass();

    if (container && container.getAttribute('data-fit-mode') !== mode) {
      container.setAttribute('data-fit-mode', mode);
    }

    if (container) {
      if (FIT_MODE_CLASSES.length > 0) {
        container.classList.remove(...FIT_MODE_CLASSES);
      }
      if (currentFitClass) {
        container.classList.add(currentFitClass);
      }
    }

    if (image && image.getAttribute('data-fit-mode') !== mode) {
      image.setAttribute('data-fit-mode', mode);
    }

    if (image) {
      if (FIT_MODE_CLASSES.length > 0) {
        image.classList.remove(...FIT_MODE_CLASSES);
      }
      if (currentFitClass) {
        image.classList.add(currentFitClass);
      }
    }

    if (video && video.getAttribute('data-fit-mode') !== mode) {
      video.setAttribute('data-fit-mode', mode);
    }

    if (video) {
      if (FIT_MODE_CLASSES.length > 0) {
        video.classList.remove(...FIT_MODE_CLASSES);
      }
      if (currentFitClass) {
        video.classList.add(currentFitClass);
      }
    }
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

      {onDownload && (
        <ButtonCompat
          variant='ghost'
          size='sm'
          className={styles.downloadButton || ''}
          onClick={handleDownloadClick}
          aria-label={languageService.getString('toolbar.download')}
        >
          <span class={styles.downloadIcon}>⬇️</span>
        </ButtonCompat>
      )}
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

export const VerticalImageItem = VerticalImageItemMemo;
