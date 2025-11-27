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
 * - Logic extracted to custom hooks for better maintainability
 *
 * @module features/gallery/components/vertical-gallery-view
 * @version 7.0 - Refactored with extracted hooks for reduced complexity
 */

import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { getLanguageService } from '@shared/container/service-accessors';
import { getSetting, setSetting } from '@shared/container/settings-access';
import { getSolid } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { DownloadState } from '@shared/state/signals/download.signals';
import { downloadState } from '@shared/state/signals/download.signals';
import type { GalleryState } from '@shared/state/signals/gallery.signals';
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import { useSelector } from '@shared/state/signals/signal-selector';
import { isDownloadUiBusy } from '@shared/state/ui/download-ui-state';
import type { ImageFitMode, MediaInfo } from '@shared/types';
import { safeEventPrevent } from '@shared/utils/events/utils';
import { computePreloadIndices } from '@shared/utils/performance';
import { stringWithDefault } from '@shared/utils/types/safety';
import type { JSX } from 'solid-js';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryLifecycle } from './hooks/useGalleryLifecycle';
import { useGalleryNavigation } from './hooks/useGalleryNavigation';
import { useToolbarAutoHide } from './hooks/useToolbarAutoHide';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';

const solidAPI = getSolid();
const { For } = solidAPI;

export interface VerticalGalleryViewProps {
  onClose?: () => void;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownloadCurrent?: () => void;
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
  const { createSignal, createMemo, createEffect } = solidAPI;

  // State selectors
  const mediaItems = useSelector<GalleryState, readonly MediaInfo[]>(
    galleryState,
    state => state.mediaItems,
    { dependencies: state => [state.mediaItems] }
  );

  const currentIndex = useSelector<GalleryState, number>(
    galleryState,
    state => state.currentIndex,
    { dependencies: state => [state.currentIndex] }
  );

  const isDownloading = useSelector(
    downloadState,
    (download: DownloadState) => isDownloadUiBusy({ downloadProcessing: download.isProcessing }),
    { dependencies: (download: DownloadState) => [download.isProcessing] }
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
    const count = getSetting<number>('gallery.preloadCount', 0);
    return computePreloadIndices(currentIndex(), mediaItems().length, count);
  });

  // Toolbar auto-hide
  const { isInitialToolbarVisible, setIsInitialToolbarVisible } = useToolbarAutoHide({
    isVisible,
    hasItems: () => mediaItems().length > 0,
  });

  // Focus tracking
  const {
    focusedIndex,
    registerItem: registerFocusItem,
    handleItemFocus,
    handleItemBlur,
    applyFocusAfterNavigation,
    setManualFocus,
    forceSync: focusTrackerForceSync,
  } = useGalleryFocusTracker({
    container: () => containerEl(),
    isEnabled: isVisible,
  });

  // Scroll tracking
  const { isScrolling } = useGalleryScroll({
    container: () => containerEl(),
    scrollTarget: () => itemsContainerEl(),
    enabled: isVisible,
    programmaticScrollTimestamp: () => navigationState.programmaticScrollTimestamp(),
    onScrollEnd: () => focusTrackerForceSync(),
  });

  // Item scroll handling - defined before navigation hook
  const { scrollToItem, scrollToCurrentItem } = useGalleryItemScroll(
    () => containerEl(),
    currentIndex,
    () => mediaItems().length,
    {
      enabled: () => !isScrolling() && navigationState.lastNavigationTrigger() !== 'scroll',
      block: 'start',
      isScrolling,
      onScrollStart: () => navigationState.setProgrammaticScrollTimestamp(Date.now()),
    }
  );

  // Navigation handling - uses scrollToItem
  const navigationState = useGalleryNavigation({
    isVisible,
    scrollToItem,
    applyFocusAfterNavigation,
  });

  // Gallery lifecycle (animations, video cleanup, viewport CSS vars)
  useGalleryLifecycle({
    containerEl: () => containerEl(),
    toolbarWrapperEl: () => toolbarWrapperEl(),
    isVisible,
  });

  // Clear manual focus and hide toolbar when user scrolls
  createEffect(() => {
    if (isScrolling()) {
      setManualFocus(null);
      setIsInitialToolbarVisible(false);
    }
  });

  // Keyboard handling
  useGalleryKeyboard({
    onClose: onClose || (() => {}),
  });

  // Ensure initial focus is applied before any navigation events fire
  createEffect(() => {
    if (!isVisible() || navigationState.lastNavigationTrigger()) {
      return;
    }

    applyFocusAfterNavigation(currentIndex());
  });

  // Fit mode state
  const getInitialFitMode = (): ImageFitMode => {
    const saved = getSetting<ImageFitMode>('gallery.imageFitMode', 'fitWidth');
    return saved ?? 'fitWidth';
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

  const persistFitMode = (mode: ImageFitMode) =>
    setSetting('gallery.imageFitMode', mode).catch(error => {
      logger.warn('Failed to save fit mode', { error, mode });
    });

  const applyFitMode = (mode: ImageFitMode, event?: Event) => {
    safeEventPrevent(event);
    setImageFitMode(mode);
    void persistFitMode(mode);
    scrollToCurrentItem();
    applyFocusAfterNavigation(currentIndex());
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
    if (
      target.closest('.toolbarWrapper') ||
      target.closest('.toolbarHoverZone') ||
      target.closest('[data-role="toolbar"]') ||
      target.closest('[class*="toolbar"]')
    ) {
      return;
    }

    if (event.target === event.currentTarget) {
      onClose?.();
    }
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
   */
  const handleContainerWheel = (event: WheelEvent) => {
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

  // Empty state
  if (!isVisible() || mediaItems().length === 0) {
    const languageService = getLanguageService();
    const emptyTitle = languageService.translate('messages.gallery.emptyTitle');
    const emptyDesc = languageService.translate('messages.gallery.emptyDescription');

    return (
      <div class={`${styles.container} ${styles.empty} ${stringWithDefault(className, '')}`}>
        <div class={styles.emptyMessage}>
          <h3>{emptyTitle}</h3>
          <p>{emptyDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={el => setContainerEl(el ?? null)}
      class={`${styles.container} ${
        isInitialToolbarVisible() ? styles.initialToolbarVisible : ''
      } ${isScrolling() ? styles.isScrolling : ''} ${stringWithDefault(className, '')}`}
      onClick={handleBackgroundClick}
      onWheel={handleContainerWheel}
      data-xeg-gallery="true"
      data-xeg-role="gallery"
    >
      <div class={styles.toolbarHoverZone} data-role="toolbar-hover-zone" />

      <div class={styles.toolbarWrapper} ref={el => setToolbarWrapperEl(el ?? null)}>
        <Toolbar
          onClose={onClose || (() => {})}
          onPrevious={onPrevious || handlePrevious}
          onNext={onNext || handleNext}
          currentIndex={currentIndex}
          focusedIndex={focusedIndex}
          totalCount={() => mediaItems().length}
          isDownloading={isDownloading}
          onDownloadCurrent={handleDownloadCurrent}
          onDownloadAll={handleDownloadAll}
          onOpenSettings={() => logger.debug('[VerticalGalleryView] Settings opened')}
          onFitOriginal={handleFitOriginal}
          onFitWidth={handleFitWidth}
          onFitHeight={handleFitHeight}
          onFitContainer={handleFitContainer}
          currentFitMode={imageFitMode()}
          tweetText={() => activeMedia()?.tweetText}
          tweetTextHTML={() => activeMedia()?.tweetTextHTML}
          className={styles.toolbar || ''}
        />
      </div>

      <div
        class={styles.itemsContainer}
        data-xeg-role="items-container"
        data-xeg-role-compat="items-list"
        ref={el => setItemsContainerEl(el ?? null)}
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
                isFocused={actualIndex === focusedIndex()}
                forceVisible={forcePreload}
                fitMode={imageFitMode}
                onClick={() => handleMediaItemClick(actualIndex)}
                className={`${styles.galleryItem} ${
                  actualIndex === currentIndex() ? styles.itemActive : ''
                }`}
                data-index={actualIndex}
                data-xeg-role="gallery-item"
                registerContainer={(element: HTMLElement | null) =>
                  registerFocusItem(actualIndex, element)
                }
                {...(onDownloadCurrent ? { onDownload: handleDownloadCurrent } : {})}
                onFocus={() => handleItemFocus(actualIndex)}
                onBlur={() => handleItemBlur(actualIndex)}
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
