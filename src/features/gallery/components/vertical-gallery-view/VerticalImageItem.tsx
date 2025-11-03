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
import { createClassName, createAriaProps, createTestProps } from '@shared/utils/component-utils'; // Phase 284: 개별 함수 직접 import
import { getSolid } from '@shared/external/vendors';
import { languageService } from '@shared/services/language-service';
import { logger } from '@shared/logging';
import styles from './VerticalImageItem.module.css';
import { cleanFilename, isVideoMedia } from './VerticalImageItem.helpers';
import type { VerticalImageItemProps } from './VerticalImageItem.types';

const solid = getSolid();
const { createSignal, createEffect, onCleanup, createMemo } = solid;

const fitModeMap: Record<string, string | undefined> = {
  original: styles.fitOriginal,
  fitHeight: styles.fitHeight,
  fitWidth: styles.fitWidth,
  fitContainer: styles.fitContainer,
};

const FIT_MODE_CLASSES = Object.values(fitModeMap).filter(Boolean) as string[];

type DimensionPair = { width: number; height: number };

const VIDEO_DIMENSION_PATTERN = /\/(\d{2,6})x(\d{2,6})\//;

const extractDimensionsFromUrl = (url?: string): DimensionPair | null => {
  if (!url) {
    return null;
  }

  const match = url.match(VIDEO_DIMENSION_PATTERN);
  if (!match) {
    return null;
  }

  const width = Number.parseInt(match[1] ?? '', 10);
  const height = Number.parseInt(match[2] ?? '', 10);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
};

const scaleAspectRatio = (w: number, h: number): DimensionPair => ({
  height: 720,
  width: Math.max(1, Math.round((w / h) * 720)),
});

const parsePositiveNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const n = Number.parseFloat(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const syncFitModeAttributes = (
  element: HTMLElement | null,
  mode: ImageFitMode,
  className: string
): void => {
  if (!element) return;
  element.setAttribute('data-fit-mode', mode);
  element.classList.remove(...FIT_MODE_CLASSES);
  className && element.classList.add(className);
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
  const toRem = (v: number) => `${(v / 16).toFixed(4)}rem`;

  // Phase 267: 메타데이터 폴백 강화
  // 기본 intrinsic height (720px = 45rem) - 미디어 메타데이터 부재 시 사용
  // 사유: reflowing 최소화, 안정성 개선
  // 설정: 일반적인 갤러리 높이 기준 (실제 미디어는 로드 후 업데이트)
  const DEFAULT_INTRINSIC_HEIGHT = 720;
  const DEFAULT_INTRINSIC_WIDTH = 540; // 16:9 비율 기준

  const deriveDimensionsFromMetadata = (): DimensionPair | null => {
    const m = media?.metadata as Record<string, unknown> | undefined;
    if (!m) return null;
    const d = m.dimensions as Record<string, unknown> | undefined;
    if (d) {
      const w = parsePositiveNumber(d.width);
      const h = parsePositiveNumber(d.height);
      if (w && h) return { width: w, height: h };
    }
    const a = m.apiData as Record<string, unknown> | undefined;
    if (!a) return null;
    const x = parsePositiveNumber(a['original_width'] ?? a['originalWidth']);
    const y = parsePositiveNumber(a['original_height'] ?? a['originalHeight']);
    if (x && y) return { width: x, height: y };
    const dim =
      extractDimensionsFromUrl(a['download_url'] as string | undefined) ||
      extractDimensionsFromUrl(a['preview_url'] as string | undefined);
    if (dim) return dim;
    if (Array.isArray(a['aspect_ratio']) && a['aspect_ratio'].length >= 2) {
      const r1 = parsePositiveNumber(a['aspect_ratio'][0]);
      const r2 = parsePositiveNumber(a['aspect_ratio'][1]);
      if (r1 && r2) return scaleAspectRatio(r1, r2);
    }
    return null;
  };

  const resolvedDimensions = createMemo<DimensionPair | null>(() => {
    const directWidth = parsePositiveNumber(media?.width);
    const directHeight = parsePositiveNumber(media?.height);

    if (directWidth && directHeight) {
      return { width: directWidth, height: directHeight };
    }

    const fromMetadata = deriveDimensionsFromMetadata();
    if (fromMetadata) {
      return fromMetadata;
    }

    // Phase 267: 메타데이터 폴백 - 기본 intrinsic 크기 사용
    // 미디어 메타데이터가 모두 부재한 경우에만 사용
    // 실제 미디어는 로드 후 업데이트되므로 reflowing은 미미함
    return { width: DEFAULT_INTRINSIC_WIDTH, height: DEFAULT_INTRINSIC_HEIGHT };
  });

  const intrinsicSizingStyle = createMemo<JSX.CSSProperties | undefined>(() => {
    const dim = resolvedDimensions();
    // Phase 267: 폴백이 적용된 경우도 CSS 변수 설정
    // (폴백은 기본값이므로 undefined를 반환하지 않음)
    if (!dim) return undefined;
    const ratio = dim.width / dim.height;
    return {
      '--xeg-aspect-default': `${dim.width} / ${dim.height}`,
      '--xeg-gallery-item-intrinsic-width': toRem(dim.width),
      '--xeg-gallery-item-intrinsic-height': toRem(dim.height),
      '--xeg-gallery-item-intrinsic-ratio': ratio.toFixed(6),
    } as unknown as JSX.CSSProperties;
  });
  const hasIntrinsicSizing = createMemo(() => !!resolvedDimensions());
  const handleClick = () => {
    containerRef()?.focus?.({ preventScroll: true });
    onClick?.();
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
  const handleImageContextMenuInternal = (event: MouseEvent) => {
    onImageContextMenu?.(event, media);
  };

  const setupVideoAutoPlayPause = (container: HTMLDivElement, video: HTMLVideoElement) => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      if (!entry.isIntersecting) {
        try {
          wasPlayingBeforeHidden = !video.paused;
          wasMutedBeforeHidden = video.muted;
          video.muted = true;
          if (!video.paused) video.pause();
        } catch (err) {
          logger.warn('Failed to pause video', { error: err });
        }
      } else {
        try {
          if (wasMutedBeforeHidden !== null) video.muted = wasMutedBeforeHidden;
          if (wasPlayingBeforeHidden) void video.play?.();
        } catch (err) {
          logger.warn('Failed to resume video', { error: err });
        } finally {
          wasPlayingBeforeHidden = false;
          wasMutedBeforeHidden = null;
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  };

  createEffect(() => {
    if (forceVisible && !isVisible()) setIsVisible(true);
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
        handleMediaLoad();
      }
    } else {
      const image = imageRef();
      if (image?.complete) {
        handleMediaLoad();
      }
    }
  });

  createEffect(() => {
    if (!isVideo) return;
    const container = containerRef();
    const video = videoRefSignal();
    if (!container || !video || typeof IntersectionObserver === 'undefined') return;
    onCleanup(setupVideoAutoPlayPause(container, video));
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
  const fitModeClass = createMemo(() => fitModeMap[resolvedFitMode()] ?? '');

  const containerClasses = createMemo(() =>
    createClassName(
      styles.container,
      styles.imageWrapper,
      isActive ? styles.active : undefined,
      isFocused ? styles.focused : undefined,
      fitModeClass(),
      className
    )
  );

  const imageClasses = createMemo(() => createClassName(styles.image, fitModeClass()));

  createEffect(() => {
    const mode = resolvedFitMode();
    const nextClass = fitModeClass();

    syncFitModeAttributes(containerRef(), mode, nextClass);
    syncFitModeAttributes(imageRef(), mode, nextClass);
    syncFitModeAttributes(videoRefSignal(), mode, nextClass);
  });

  const ariaProps = createAriaProps({
    'aria-label': ariaLabel || `미디어 ${index + 1}: ${cleanFilename(media.filename)}`,
    'aria-describedby': ariaDescribedBy,
    role: role || 'button',
    tabIndex: tabIndex ?? 0,
  } as Record<string, string | number | boolean | undefined>);

  const testProps = createTestProps(testId);

  const assignContainerRef = (element: HTMLDivElement | null) => {
    setContainerRef(element);
    registerContainer?.(element);
  };

  // Phase 269-3: Inline style 런타임 검증
  // CSS 변수 폴백이 적용되지 않는 경우를 대비한 인라인 스타일 설정
  // (CSS 로드 지연이나 브라우저 호환성 문제 방지)
  createEffect(() => {
    const container = containerRef();
    if (!container || isLoaded() || !hasIntrinsicSizing()) {
      return;
    }

    // CSS 변수 계산값을 계산하여 폴백 확인
    const computedStyle = window.getComputedStyle(container);
    const imageWrapperMinHeight = computedStyle.getPropertyValue('--xeg-spacing-3xl');
    const aspectRatio = computedStyle.getPropertyValue('--xeg-aspect-default');

    // 폴백이 없거나 0인 경우 명시적으로 설정
    if (!imageWrapperMinHeight || imageWrapperMinHeight.trim() === '') {
      container.style.setProperty('--xeg-spacing-3xl-fallback', '3rem');
    }

    if (!aspectRatio || aspectRatio.trim() === '') {
      container.style.setProperty('--xeg-aspect-default-fallback', '4 / 3');
    }

    logger.debug('[VerticalImageItem] Phase 269-3 inline style validation completed', {
      index,
      imageWrapperMinHeight: imageWrapperMinHeight || 'undefined',
      aspectRatio: aspectRatio || 'undefined',
    });
  });

  return (
    <div
      ref={assignContainerRef}
      class={containerClasses()}
      data-xeg-role='gallery-item'
      data-index={index}
      data-item-index={index}
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
              class={createClassName(
                styles.video,
                fitModeClass(),
                isLoaded() ? styles.loaded : styles.loading
              )}
              data-fit-mode={resolvedFitMode()}
              onLoadedMetadata={handleMediaLoad}
              onLoadedData={handleMediaLoad}
              onCanPlay={handleMediaLoad}
              onError={handleMediaError}
              onContextMenu={handleImageContextMenuInternal}
              onDragStart={(e: DragEvent) => e.preventDefault()}
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
              class={createClassName(imageClasses(), isLoaded() ? styles.loaded : styles.loading)}
              data-fit-mode={resolvedFitMode()}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              onContextMenu={handleImageContextMenuInternal}
              onDragStart={(e: DragEvent) => e.preventDefault()}
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
  events: { preventClick: false, preventKeyboard: false, blockTwitterNative: true },
  customData: { component: 'vertical-image-item', role: 'gallery-item' },
});

const VerticalImageItemMemo = solid.memo(WithGalleryVerticalImageItem);
Object.defineProperty(VerticalImageItemMemo, 'displayName', {
  value: 'memo(VerticalImageItem)',
});

export type { VerticalImageItemProps, FitModeProp } from './VerticalImageItem.types';
export const VerticalImageItem = VerticalImageItemMemo;
