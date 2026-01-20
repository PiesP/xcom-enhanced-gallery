/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Component (Solid.js)
 * @description Main gallery component rendering media items with vertical scrolling, state management,
 * toolbar visibility, keyboard navigation, and fit mode support via useVerticalGallery hook.
 * @version 8.0
 */

import { useVerticalGallery } from '@features/gallery/components/vertical-gallery-view/hooks/use-vertical-gallery';
import styles from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css';
import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { createDebounced } from '@shared/async/debounce';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { getTypedSettingOr, setTypedSetting } from '@shared/container/settings-access';
import type { JSX, JSXElement } from '@shared/external/vendors';
import { useTranslation } from '@shared/hooks/use-translation';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import { downloadState } from '@shared/state/signals/download.signals';
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import { isDownloadUiBusy } from '@shared/state/ui/download-ui-state';
import type { ImageFitMode } from '@shared/types/ui.types';
import { safeEventPrevent } from '@shared/utils/events/utils';
import { computePreloadIndices } from '@shared/utils/performance/preload';
import { cx } from '@shared/utils/text/formatting';
import { createEffect, createMemo, createSignal, For, onCleanup, splitProps } from 'solid-js';

const noop = (): void => {};

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
    onClose: local.onClose,
  });
  const translate = useTranslation();

  const debouncedScrollCorrection = createDebounced((index: number, mediaId: string) => {
    if (!isVisible()) {
      return;
    }

    if (index !== currentIndex() || activeMedia()?.id !== mediaId) {
      return;
    }

    scroll.scrollToItem(index);
  }, 120);

  onCleanup(() => {
    debouncedScrollCorrection.cancel();
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

  const persistFitMode = (mode: ImageFitMode): Promise<void> =>
    setTypedSetting('gallery.imageFitMode', mode).catch((error) => {
      if (__DEV__) {
        logger.warn('Failed to save fit mode', { error, mode });
      }
    });

  const applyFitMode = (mode: ImageFitMode, event?: Event): void => {
    safeEventPrevent(event);
    setImageFitMode(mode);
    void persistFitMode(mode);
    scroll.scrollToCurrentItem();
    navigateToItem(currentIndex(), 'click');
  };

  // Event handlers
  const handleDownloadCurrent = () => local.onDownloadCurrent?.();
  const handleDownloadAll = () => local.onDownloadAll?.();
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

  const handleBackgroundClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    // Ignore clicks on interactive zones and gallery content (production-safe selectors).
    // Keeping this as a single selector avoids repeated closest() traversals.
    const ignoreSelector =
      '[data-role="toolbar"], [data-role="toolbar-hover-zone"], [data-gallery-element], [data-xeg-role="gallery-item"], [data-xeg-role="scroll-spacer"]';

    if (target.closest(ignoreSelector)) {
      return;
    }

    // Close gallery when clicking on background area (outside items and toolbar)
    local.onClose?.();
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

    const controller = new AbortController();

    const handleContainerWheel = (event: WheelEvent): void => {
      const itemsContainer = itemsContainerEl();
      if (!itemsContainer) return;

      // Check if the wheel event target is inside the items container
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

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
    const eventManager = EventManager.getInstance();
    const listener: EventListener = (event) => {
      handleContainerWheel(event as WheelEvent);
    };

    eventManager.addEventListener(container, 'wheel', listener, {
      passive: false,
      signal: controller.signal,
      context: 'gallery:wheel:container-redirect',
    });
    onCleanup(() => controller.abort());
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
              onClose: local.onClose ?? noop,
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
