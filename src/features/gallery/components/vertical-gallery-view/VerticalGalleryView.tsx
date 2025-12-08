/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Component (Solid.js)
 * @description Main gallery view component that renders media items in vertical layout
 *
 * **Responsibilities**:
 * - Render media items collection with vertical scrolling
 * - Manage gallery state (current index, loading, etc.)
 * - Coordinate scroll behavior and focus tracking
 * - Handle keyboard navigation (Escape, Help)
 * - Manage toolbar visibility and auto-hide behavior
 * - Implement animations (enter/exit)
 * - Support image fit modes (original, fitWidth, fitHeight, fitContainer)
 * - Provide download UI and interactions
 *
 * **Architecture**:
 * - Follows PC-only event policy (click, keydown/keyup, wheel, mouse*)
 * - Uses design tokens for all colors and sizes (no hardcoding)
 * - Vendor APIs accessed via getSolid() getter pattern
 * - Logic extracted to useVerticalGallery composed hook
 *
 * @module features/gallery/components/vertical-gallery-view
 * @version 8.0 - Refactored with useVerticalGallery composed hook
 */

import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { getLanguageService } from '@shared/container/service-accessors';
import { getTypedSettingOr, setTypedSetting } from '@shared/container/settings-access';
import { logger } from '@shared/logging';
import { downloadState } from '@shared/state/signals/download.signals';
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import { isDownloadUiBusy } from '@shared/state/ui/download-ui-state';
import type { ImageFitMode } from '@shared/types';
import { safeEventPrevent } from '@shared/utils/events/utils';
import { computePreloadIndices } from '@shared/utils/performance';
import { cx } from '@shared/utils/text/formatting';
import { createEffect, createMemo, createSignal, For, type JSX, onCleanup } from 'solid-js';
import { useVerticalGallery } from './hooks/useVerticalGallery';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';

export interface VerticalGalleryViewProps {
  /** Handler for closing the gallery */
  onClose?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Handler for navigating to previous item */
  onPrevious?: () => void;
  /** Handler for navigating to next item */
  onNext?: () => void;
  /** Handler for downloading current media item */
  onDownloadCurrent?: () => void;
  /** Handler for downloading all media items */
  onDownloadAll?: () => void;
}

function VerticalGalleryViewCore({
  onClose,
  className = '',
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
}: VerticalGalleryViewProps): JSX.Element {
  // State accessors - using galleryState with createMemo for fine-grained reactivity
  const mediaItems = createMemo(() => galleryState.value.mediaItems);
  const currentIndex = createMemo(() => galleryState.value.currentIndex);
  const isDownloading = createMemo(() =>
    isDownloadUiBusy({ downloadProcessing: downloadState.value.isProcessing })
  );

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
    const count = getTypedSettingOr('gallery.preloadCount', 0);
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
    onClose,
  });

  // Ensure initial focus is applied before any navigation events fire
  createEffect(() => {
    if (!isVisible() || navigation.lastNavigationTrigger()) {
      return;
    }

    // Initial focus is treated as keyboard/manual navigation
    navigateToItem(currentIndex(), 'click');
  });

  // Fit mode state
  const getInitialFitMode = (): ImageFitMode => {
    return getTypedSettingOr('gallery.imageFitMode', 'fitWidth');
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

  const persistFitMode = (mode: ImageFitMode) =>
    setTypedSetting('gallery.imageFitMode', mode).catch((error) => {
      logger.warn('Failed to save fit mode', { error, mode });
    });

  const applyFitMode = (mode: ImageFitMode, event?: Event) => {
    safeEventPrevent(event);
    setImageFitMode(mode);
    void persistFitMode(mode);
    scroll.scrollToCurrentItem();
    navigateToItem(currentIndex(), 'click');
  };

  // Event handlers
  const handleDownloadCurrent = () => onDownloadCurrent?.();
  const handleDownloadAll = () => onDownloadAll?.();
  const handleFitOriginal = (event?: Event) => applyFitMode('original', event);
  const handleFitWidth = (event?: Event) => applyFitMode('fitWidth', event);
  const handleFitHeight = (event?: Event) => applyFitMode('fitHeight', event);
  const handleFitContainer = (event?: Event) => applyFitMode('fitContainer', event);

  const handlePrevious = () => {
    const current = currentIndex();
    if (current > 0) {
      navigateToItem(current - 1, 'click');
    }
  };

  const handleNext = () => {
    const current = currentIndex();
    const items = mediaItems();
    if (current < items.length - 1) {
      navigateToItem(current + 1, 'click');
    }
  };

  const handleBackgroundClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Ignore clicks on toolbar and toolbar hover zone using data attributes (production-safe)
    if (
      target.closest('[data-role="toolbar"]') ||
      target.closest('[data-role="toolbar-hover-zone"]') ||
      target.closest('[data-gallery-element="toolbar"]') ||
      target.closest('[data-gallery-element]')
    ) {
      return;
    }

    // Ignore clicks on gallery items (images/videos) - use data attributes for production safety
    if (target.closest('[data-xeg-role="gallery-item"]')) {
      return;
    }

    // Ignore clicks on scroll spacer
    if (target.closest('[data-xeg-role="scroll-spacer"]')) {
      return;
    }

    // Close gallery when clicking on background area (outside items and toolbar)
    onClose?.();
  };

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();
    const current = currentIndex();

    if (index >= 0 && index < items.length && index !== current) {
      navigateToItem(index, 'click');
    }
  };

  /**
   * Handle wheel events on the gallery container.
   * Redirects scroll to the items container when wheel event occurs outside of it,
   * preventing the underlying Twitter page from scrolling.
   *
   * Note: We use createEffect with addEventListener instead of onWheel to control
   * the passive option and avoid Chrome's passive event listener warnings.
   */
  createEffect(() => {
    const container = containerEl();
    if (!container) return;

    const handleContainerWheel = (event: WheelEvent): void => {
      const itemsContainer = itemsContainerEl();
      if (!itemsContainer) return;

      // Check if the wheel event target is inside the items container
      const target = event.target as HTMLElement;
      if (itemsContainer.contains(target)) {
        // Let the items container handle its own scroll naturally
        return;
      }

      // For events outside the items container, redirect scroll to items container
      event.preventDefault();
      event.stopPropagation();
      itemsContainer.scrollTop += event.deltaY;
    };

    // Use passive: false only when we need to call preventDefault()
    container.addEventListener('wheel', handleContainerWheel, { passive: false });
    onCleanup(() => container.removeEventListener('wheel', handleContainerWheel));
  });

  // Empty state
  if (!isVisible() || mediaItems().length === 0) {
    const languageService = getLanguageService();
    const emptyTitle = languageService.translate('messages.gallery.emptyTitle');
    const emptyDesc = languageService.translate('messages.gallery.emptyDescription');

    return (
      <div class={cx(styles.container, styles.empty, className)}>
        <div class={styles.emptyMessage}>
          <h3>{emptyTitle}</h3>
          <p>{emptyDesc}</p>
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
        className,
      )}
      onClick={handleBackgroundClick}
      data-xeg-gallery='true'
      data-xeg-role='gallery'
    >
      <div class={styles.toolbarHoverZone} data-role='toolbar-hover-zone' />

      <div
        class={styles.toolbarWrapper}
        data-role='toolbar'
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
          className={styles.toolbar || ''}
          handlers={{
            navigation: {
              onPrevious: onPrevious || handlePrevious,
              onNext: onNext || handleNext,
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
              onClose: onClose || (() => {}),
              onOpenSettings: () => logger.debug('[VerticalGalleryView] Settings opened'),
            },
          }}
        />
      </div>

      <div
        class={styles.itemsContainer}
        data-xeg-role='items-container'
        data-xeg-role-compat='items-list'
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
                className={cx(
                  styles.galleryItem,
                  actualIndex === currentIndex() && styles.itemActive,
                )}
                data-index={actualIndex}
                data-xeg-role='gallery-item'
                registerContainer={(element: HTMLElement | null) =>
                  focus.registerItem(actualIndex, element)}
                {...(onDownloadCurrent ? { onDownload: handleDownloadCurrent } : {})}
                onFocus={() => focus.handleItemFocus(actualIndex)}
              />
            );
          }}
        </For>
        <div class={styles.scrollSpacer} aria-hidden='true' data-xeg-role='scroll-spacer' />
      </div>
    </div>
  );
}

export const VerticalGalleryView = VerticalGalleryViewCore;
