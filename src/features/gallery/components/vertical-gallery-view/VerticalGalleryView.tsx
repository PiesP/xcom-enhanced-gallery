// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Vertical Gallery View Component (Solid.js)
 * @description Main gallery component rendering media items with vertical scrolling, state management,
 * toolbar visibility, keyboard navigation, and fit mode support via useVerticalGallery hook.
 */

import { useGalleryFitMode } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-fit-mode';
import { useGalleryNavigationHandlers } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-navigation-handlers';
import { useGalleryScrollCorrection } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-scroll-correction';
import { useGalleryWheelRedirect } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-wheel-redirect';
import { useVerticalGallery } from '@features/gallery/components/vertical-gallery-view/hooks/use-vertical-gallery';
import styles from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css';
import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { getTypedSettingOr } from '@shared/container/settings-registry';
import { useTranslation } from '@shared/hooks/use-translation';
import { logger } from '@shared/logging/logger';
import {
  downloadState,
  gallerySignals,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import { computePreloadIndices } from '@shared/utils/performance/preload';
import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';
import { createEffect, createMemo, createSignal, For, splitProps } from 'solid-js';

export interface VerticalGalleryViewProps {
  /** Handler for closing the gallery */
  readonly onClose?: () => void;
  /** Additional CSS class name */
  readonly className?: string;
  /** Handler for navigating to previous item */
  readonly onPrevious?: () => void;
  /** Handler for navigating to next item */
  readonly onNext?: () => void;
  /** Handler for downloading current media item */
  readonly onDownloadCurrent?: () => void;
  /** Handler for downloading all media items */
  readonly onDownloadAll?: () => void;
}

export function VerticalGalleryView(props: VerticalGalleryViewProps): JSXElement {
  const [local] = splitProps(props, [
    'onClose',
    'className',
    'onPrevious',
    'onNext',
    'onDownloadCurrent',
    'onDownloadAll',
  ]);

  const handleClose = local.onClose ?? (() => {});

  // State accessors - using gallerySignals with createMemo for fine-grained reactivity
  const mediaItems = createMemo(() => gallerySignals.mediaItems);
  const currentIndex = createMemo(() => gallerySignals.currentIndex);
  const isDownloading = createMemo(() => downloadState.isProcessing);

  // Element refs
  const [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
  const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal<HTMLDivElement | null>(null);
  const [itemsContainerEl, setItemsContainerEl] = createSignal<HTMLDivElement | null>(null);

  // Derived state — trivially computed from already-memoized values; plain getters suffice
  const isVisible = createMemo(() => mediaItems().length > 0);

  const activeMedia = createMemo(() => {
    const items = mediaItems();
    const index = currentIndex();
    return items[index] ?? null;
  });

  const tweetText = () => activeMedia()?.tweetText ?? null;
  const tweetTextHTML = () => activeMedia()?.tweetTextHTML ?? null;
  const tweetUrl = () => activeMedia()?.tweetUrl ?? null;

  const preloadIndices = createMemo(() => {
    const count = getTypedSettingOr('gallery.preloadCount', 3);
    return computePreloadIndices(currentIndex(), mediaItems().length, count);
  });

  // Composed hook - consolidates all gallery behavior hooks
  const { scroll, navigation, focus, toolbar } = useVerticalGallery({
    isVisible,
    currentIndex,
    mediaItemsCount: () => mediaItems().length,
    containerEl,
    toolbarWrapperEl,
    itemsContainerEl,
  });

  const translate = useTranslation();

  // Debounced scroll correction — adjusts scroll position after media loads
  const { debouncedScrollCorrection } = useGalleryScrollCorrection({
    isVisible,
    currentIndex,
    activeMedia,
    scrollToItem: scroll.scrollToItem,
  });

  // Ensure initial focus is applied before any navigation events fire
  createEffect(() => {
    if (!isVisible() || navigation.lastNavigationTrigger()) {
      return;
    }

    // Initial focus is treated as keyboard/manual navigation
    navigateToItem(currentIndex(), 'auto-focus');
  });

  // Fit mode state — managed via useGalleryFitMode hook with persistence
  const { imageFitMode, handleFitOriginal, handleFitWidth, handleFitHeight, handleFitContainer } =
    useGalleryFitMode({
      scrollToCurrentItem: scroll.scrollToCurrentItem,
      currentIndex,
    });

  // Event handlers
  const handleDownloadCurrent = () => local.onDownloadCurrent?.();
  const handleDownloadAll = () => local.onDownloadAll?.();

  // Stable callback for media load — verifies mediaId to guard against stale indices
  const handleMediaLoad = (mediaId: string, indexValue: number): void => {
    const items = mediaItems();
    const item = items[indexValue];
    if (item?.id !== mediaId) return;
    debouncedScrollCorrection(indexValue, mediaId);
  };

  // Memoized callback factories for per-item refs
  // Avoids recreating closures on every parent render
  const createRegisterContainer =
    (index: number) =>
    (element: HTMLElement | null): void =>
      focus.registerItem(index, element);
  const createHandleFocus = (index: number) => (): void => focus.handleItemFocus(index);

  // Navigation handlers — previous/next, background click, media item click
  const { handlePrevious, handleNext, handleBackgroundClick, handleMediaItemClick } =
    useGalleryNavigationHandlers({
      currentIndex,
      mediaItems,
      onClose: handleClose,
    });

  // Wheel event redirection — redirects scroll from container to items container
  useGalleryWheelRedirect({
    containerEl,
    itemsContainerEl,
  });

  // Memoized handlers object to prevent unnecessary Toolbar re-renders
  const toolbarHandlers = createMemo(() => ({
    navigation: {
      onPrevious: local.onPrevious ?? handlePrevious,
      onNext: local.onNext ?? handleNext,
    },
    download: {
      onDownloadCurrent: handleDownloadCurrent,
      onDownloadAll: handleDownloadAll,
    },
    fitMode: {
      onFitOriginal: handleFitOriginal,
      onFitWidth: handleFitWidth,
      onFitHeight: handleFitHeight,
      onFitContainer: handleFitContainer,
    },
    lifecycle: {
      onClose: handleClose,
      onOpenSettings: () => {
        if (__DEV__) {
          logger.debug('[VerticalGalleryView] Settings opened');
        }
      },
    },
  }));

  // Empty state
  if (!isVisible()) {
    return (
      <div class={cx(styles.container, styles.empty, local.className)}>
        <div class={styles.emptyMessage}>
          <h2>{translate('msg.gal.emptyT')}</h2>
          <p>{translate('msg.gal.emptyD')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(el) => setContainerEl(el ?? null)}
      class={cx(
        styles.container,
        toolbar.isInitialToolbarVisible() && styles.initialToolbarVisible,
        scroll.isScrolling() && styles.isScrolling,
        local.className
      )}
      onClick={handleBackgroundClick}
    >
      <div class={styles.toolbarHoverZone} role="presentation" />

      <div
        class={styles.toolbarWrapper}
        role="toolbar"
        ref={(el) => setToolbarWrapperEl(el ?? null)}
      >
        <Toolbar
          currentIndex={currentIndex}
          focusedIndex={focus.focusedIndex}
          totalCount={() => mediaItems().length}
          isDownloading={isDownloading}
          currentFitMode={imageFitMode}
          tweetText={tweetText}
          tweetTextHTML={tweetTextHTML}
          tweetUrl={tweetUrl}
          className={styles.toolbar}
          handlers={toolbarHandlers()}
        />
      </div>

      <div class={styles.itemsContainer} role="list" ref={(el) => setItemsContainerEl(el ?? null)}>
        <For each={mediaItems()}>
          {(item, index) => {
            const actualIndex = index();
            const forcePreload = preloadIndices().includes(actualIndex);

            return (
              <VerticalImageItem
                media={item}
                index={actualIndex}
                isActive={actualIndex === currentIndex()}
                isFocused={actualIndex === focus.focusedIndex()}
                forceVisible={forcePreload}
                fitMode={imageFitMode}
                onClick={() => handleMediaItemClick(actualIndex)}
                onMediaLoad={handleMediaLoad}
                className={cx(
                  styles.galleryItem,
                  actualIndex === currentIndex() && styles.itemActive
                )}
                registerContainer={createRegisterContainer(actualIndex)}
                onFocus={createHandleFocus(actualIndex)}
              />
            );
          }}
        </For>
        <div class={styles.scrollSpacer} aria-hidden="true" />
      </div>
    </div>
  );
}
