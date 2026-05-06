/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Component (Solid.js)
 * @description Main gallery component rendering media items with vertical scrolling, state management,
 * toolbar visibility, keyboard navigation, and fit mode support via useVerticalGallery hook.
 * @version 8.0
 */

import { useGalleryFitMode } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-fit-mode';
import { useGalleryKeyboard } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-keyboard';
import { useGalleryNavigationHandlers } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-navigation-handlers';
import { useGalleryScrollCorrection } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-scroll-correction';
import { useGalleryWheelRedirect } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-wheel-redirect';
import { useVerticalGallery } from '@features/gallery/components/vertical-gallery-view/hooks/use-vertical-gallery';
import styles from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css';
import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { getTypedSettingOr } from '@shared/container/container';
import type { JSXElement } from '@shared/external/vendors';
import { useTranslation } from '@shared/hooks/use-translation';
import { logger } from '@shared/logging/logger';
import { downloadState } from '@shared/state/signals/download.signals';
import { gallerySignals, navigateToItem } from '@shared/state/signals/gallery.signals';
import { computePreloadIndices } from '@shared/utils/performance/preload';
import { cx } from '@shared/utils/text/formatting';
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

function VerticalGalleryViewCore(props: VerticalGalleryViewProps): JSXElement {
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
  const isDownloading = createMemo(() => downloadState.value.isProcessing);

  // Element refs
  const [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
  const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal<HTMLDivElement | null>(null);
  const [itemsContainerEl, setItemsContainerEl] = createSignal<HTMLDivElement | null>(null);

  // Derived state
  const isVisible = createMemo(() => mediaItems().length > 0);

  const activeMedia = createMemo(() => {
    const items = mediaItems();
    const index = currentIndex();
    return items[index] ?? null;
  });

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

  // Keyboard escape handler - integrated from useGalleryKeyboard hook
  useGalleryKeyboard({ onClose: handleClose });

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
    navigateToItem(currentIndex(), 'click', 'auto-focus');
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

  // Empty state
  if (!isVisible()) {
    return (
      <div class={cx(styles.container, styles.empty, local.className)}>
        <div class={styles.emptyMessage}>
          <h3>{translate('msg.gal.emptyT')}</h3>
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
      data-xeg-gallery="true"
      data-xeg-role="gallery"
    >
      <div class={styles.toolbarHoverZone} data-role="toolbar-hover-zone" />

      <div
        class={styles.toolbarWrapper}
        data-role="toolbar"
        ref={(el) => setToolbarWrapperEl(el ?? null)}
      >
        <Toolbar
          currentIndex={currentIndex}
          focusedIndex={focus.focusedIndex}
          totalCount={() => mediaItems().length}
          isDownloading={isDownloading}
          currentFitMode={imageFitMode()}
          tweetText={() => activeMedia()?.tweetText}
          tweetTextHTML={() => activeMedia()?.tweetTextHTML}
          tweetUrl={() => activeMedia()?.tweetUrl}
          className={styles.toolbar}
          handlers={{
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
          }}
        />
      </div>

      <div
        class={styles.itemsContainer}
        data-xeg-role="items-container"
        data-xeg-role-compat="items-list"
        ref={(el) => setItemsContainerEl(el ?? null)}
      >
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
                onMediaLoad={(mediaId, indexValue) =>
                  debouncedScrollCorrection(indexValue, mediaId)
                }
                className={cx(
                  styles.galleryItem,
                  actualIndex === currentIndex() && styles.itemActive
                )}
                registerContainer={(element: HTMLElement | null) =>
                  focus.registerItem(actualIndex, element)
                }
                onFocus={() => focus.handleItemFocus(actualIndex)}
              />
            );
          }}
        </For>
        <div class={styles.scrollSpacer} aria-hidden="true" data-xeg-role="scroll-spacer" />
      </div>
    </div>
  );
}

export const VerticalGalleryView = VerticalGalleryViewCore;
