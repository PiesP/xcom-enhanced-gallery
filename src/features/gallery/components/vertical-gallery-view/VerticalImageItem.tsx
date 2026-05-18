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
import { useTranslation } from '@shared/hooks/use-translation';
import { gallerySignals, setCurrentVideoElement } from '@shared/state/signals/gallery.signals';
import type { ImageFitMode } from '@shared/types/settings.types';
import {
  createIntrinsicSizingStyle,
  resolveMediaDimensionsWithIntrinsicFlag,
} from '@shared/utils/media/media-dimensions';
import { cx } from '@shared/utils/text/formatting';
import type { JSX, JSXElement } from 'solid-js';
import { createEffect, createMemo, createSignal, splitProps, untrack } from 'solid-js';

const FIT_MODE_CLASSES: Record<ImageFitMode, string | undefined> = {
  original: styles.fitOriginal,
  fitHeight: styles.fitHeight,
  fitWidth: styles.fitWidth,
  fitContainer: styles.fitContainer,
};

export function VerticalImageItem(props: VerticalImageItemProps): JSXElement | null {
  const [local, rest] = splitProps(props, [
    'media',
    'index',
    'isActive',
    'isFocused',
    'forceVisible',
    'onClick',
    'onImageContextMenu',
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

  const isFocused = createMemo(() => local.isFocused ?? false);
  const className = createMemo(() => local.className ?? '');
  const shouldEagerLoad = createMemo(() => (local.forceVisible ?? false) || (local.isActive ?? false));
  const translate = useTranslation();

  const isVideo = createMemo(() => local.media.type === 'video' || local.media.type === 'gif');
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isError, setIsError] = createSignal(false);

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

  const intrinsicSizingStyle = createMemo(() => createIntrinsicSizingStyle(dimensions()));
  const mergedStyle = createMemo(() => ({ ...intrinsicSizingStyle(), ...(local.style ?? {}) }));

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

  const preventDragStart = (event: DragEvent) => event.preventDefault();

  const handleContainerClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (event) => {
    event.stopPropagation();

    if (isVideo()) {
      const video = videoRef();
      if (video) {
        const target = event.target;
        const targetInVideo = target instanceof Node && video.contains(target);
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        const pathIncludesVideo = Array.isArray(path) && path.includes(video);
        if (targetInVideo || pathIncludesVideo) return;
      }
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
    if (key === 'Enter' || key === ' ') {
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

  createEffect(() => {
    if (isLoaded()) return;

    if (isVideo()) {
      const video = videoRef();
      if (video && video.readyState >= 1) handleMediaLoad();
    } else {
      const image = imageRef();
      if (image?.complete) {
        if (image.naturalWidth > 0) handleMediaLoad();
        else handleMediaError();
      }
    }
  });

  const resolvedFitMode = createMemo<ImageFitMode>(() => {
    const value = local.fitMode;
    if (typeof value === 'function') return value() ?? 'fitWidth';
    return value ?? 'fitWidth';
  });

  const fitModeClass = createMemo(() => FIT_MODE_CLASSES[resolvedFitMode()] ?? '');

  const containerClasses = createMemo(() =>
    cx(
      'xeg-gallery',
      CSS.CLASSES.ITEM,
      'vertical-item',
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
      ref={assignContainerRef}
      class={containerClasses()}
      data-xeg-role="gallery-item"
      data-index={local.index}
      data-fit-mode={resolvedFitMode()}
      data-media-loaded={isLoaded() ? 'true' : 'false'}
      data-has-intrinsic-size={hasIntrinsicSize() ? 'true' : undefined}
      style={mergedStyle()}
      onClick={handleContainerClick}
      onFocus={local.onFocus}
      onBlur={rest.onBlur}
      onKeyDown={handleContainerKeyDown}
      aria-label={local['aria-label'] || defaultAriaLabel()}
      aria-describedby={local['aria-describedby']}
      role={resolvedContainerRole()}
      tabIndex={local.tabIndex ?? 0}
      data-testid={__DEV__ ? rest['data-testid'] : undefined}
    >
      <div class={styles.imageWrapper} data-xeg-role="media-wrapper">
        {!isLoaded() && !isError() && (
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
            loading={shouldEagerLoad() ? 'eager' : 'lazy'}
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
              {translate('msg.gal.loadFail', { type: isVideo() ? 'video' : 'image' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
