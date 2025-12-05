/**
 * @fileoverview UnoCSS Vertical Gallery View Component
 * @version 1.0.0 - CSS Modules to UnoCSS Migration
 * @description Main gallery view using UnoCSS atomic classes
 * @module @features/gallery/components/vertical-gallery-view
 *
 * Features:
 * - Vertical media layout with smooth scrolling
 * - Toolbar with auto-hide on scroll
 * - Image fit modes (original, fitWidth, fitHeight, fitContainer)
 * - Keyboard navigation support
 * - UnoCSS atomic classes for optimal styling
 *
 * @example
 * ```tsx
 * import { VerticalGalleryView } from './VerticalGalleryView.uno';
 *
 * <VerticalGalleryView onClose={handleClose} />
 * ```
 */

import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { getLanguageService } from '@shared/container/service-accessors';
import { getSetting, setSetting } from '@shared/container/settings-access';
import { createEffect, createMemo, createSignal, For } from '@shared/external/vendors/solid-hooks';
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
import { createClassName } from '@shared/utils/text/formatting';
import { stringWithDefault } from '@shared/utils/types/safety';
import type { JSX } from 'solid-js';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryLifecycle } from './hooks/useGalleryLifecycle';
import { useGalleryNavigation } from './hooks/useGalleryNavigation';
import { useToolbarAutoHide } from './hooks/useToolbarAutoHide';
import { VerticalImageItem } from './VerticalImageItem';

// ============================================================================
// Type Definitions
// ============================================================================

export interface VerticalGalleryViewProps {
  onClose?: () => void;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownloadCurrent?: () => void;
  onDownloadAll?: () => void;
}

// ============================================================================
// Vertical Gallery View Component
// ============================================================================

/**
 * UnoCSS Vertical Gallery View Component
 *
 * Main gallery view with vertical scrolling media items.
 * Uses atomic CSS classes for optimal bundle size.
 */
function VerticalGalleryViewCore({
  onClose,
  className = '',
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
}: VerticalGalleryViewProps): JSX.Element {
  // State selectors
  const mediaItems = useSelector<GalleryState, readonly MediaInfo[]>(
    galleryState,
    state => state.mediaItems,
    { dependencies: state => [state.mediaItems] }
  );

  const currentIndex = useSelector<GalleryState, number>(
    galleryState,
    state => state.currentIndex,
    {
      dependencies: state => [state.currentIndex],
    }
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

  // Forward declaration for focus sync
  const [focusSyncCallback, setFocusSyncCallback] = createSignal<(() => void) | null>(null);

  // Scroll tracking
  const { isScrolling } = useGalleryScroll({
    container: () => containerEl(),
    scrollTarget: () => itemsContainerEl(),
    enabled: isVisible,
    programmaticScrollTimestamp: () => navigationState.programmaticScrollTimestamp(),
    onScrollEnd: () => focusSyncCallback()?.(),
  });

  // Item scroll handling
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

  // Navigation handling
  const navigationState = useGalleryNavigation({
    isVisible,
    scrollToItem,
  });

  // Focus tracking
  const {
    focusedIndex,
    registerItem: registerFocusItem,
    handleItemFocus,
    forceSync: focusTrackerForceSync,
  } = useGalleryFocusTracker({
    container: () => containerEl(),
    isEnabled: isVisible,
    isScrolling,
    lastNavigationTrigger: navigationState.lastNavigationTrigger,
  });

  // Register focus sync callback
  createEffect(() => setFocusSyncCallback(() => focusTrackerForceSync));

  // Gallery lifecycle
  useGalleryLifecycle({
    containerEl: () => containerEl(),
    toolbarWrapperEl: () => toolbarWrapperEl(),
    isVisible,
  });

  // Hide toolbar on scroll
  createEffect(() => {
    if (isScrolling()) {
      setIsInitialToolbarVisible(false);
    }
  });

  // Keyboard handling
  useGalleryKeyboard({
    onClose: onClose || (() => {}),
  });

  // Initial focus
  createEffect(() => {
    if (!isVisible() || navigationState.lastNavigationTrigger()) return;
    navigateToItem(currentIndex(), 'click');
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

    if (
      target.closest('[data-role="toolbar"]') ||
      target.closest('[data-role="toolbar-hover-zone"]') ||
      target.closest('[data-gallery-element="toolbar"]') ||
      target.closest('[data-gallery-element]')
    ) {
      return;
    }

    if (target.closest('[data-xeg-role="gallery-item"]')) return;
    if (target.closest('[data-xeg-role="scroll-spacer"]')) return;

    onClose?.();
  };

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();
    const current = currentIndex();

    if (index >= 0 && index < items.length && index !== current) {
      navigateToItem(index, 'click');
    }
  };

  const handleContainerWheel = (event: WheelEvent) => {
    const itemsContainer = itemsContainerEl();
    if (!itemsContainer) return;

    const target = event.target as HTMLElement;
    if (itemsContainer.contains(target)) return;

    event.preventDefault();
    event.stopPropagation();
    itemsContainer.scrollTop += event.deltaY;
  };

  // UnoCSS class builders
  const containerClass = () =>
    createClassName(
      'xeg-gallery-container',
      isInitialToolbarVisible() ? 'xeg-gallery-initial-toolbar-visible' : undefined,
      isScrolling() ? 'xeg-gallery-is-scrolling' : undefined,
      stringWithDefault(className, '')
    );

  const emptyContainerClass = () =>
    createClassName(
      'xeg-gallery-container',
      'xeg-gallery-container-empty',
      stringWithDefault(className, '')
    );

  const galleryItemClass = (index: number) =>
    createClassName(
      'xeg-gallery-item',
      index === currentIndex() ? 'xeg-gallery-item-active' : undefined
    );

  // Empty state
  if (!isVisible() || mediaItems().length === 0) {
    const languageService = getLanguageService();
    const emptyTitle = languageService.translate('messages.gallery.emptyTitle');
    const emptyDesc = languageService.translate('messages.gallery.emptyDescription');

    return (
      <div class={emptyContainerClass()}>
        <div class="xeg-gallery-empty-message">
          <h3 class="xeg-gallery-empty-title">{emptyTitle}</h3>
          <p class="xeg-gallery-empty-desc">{emptyDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={el => setContainerEl(el ?? null)}
      class={containerClass()}
      onClick={handleBackgroundClick}
      onWheel={handleContainerWheel}
      data-xeg-gallery="true"
      data-xeg-role="gallery"
    >
      {/* Toolbar Hover Zone */}
      <div class="xeg-gallery-toolbar-hover-zone" data-role="toolbar-hover-zone" />

      {/* Toolbar Wrapper */}
      <div
        class="xeg-gallery-toolbar-wrapper xeg-gallery-toolbar-wrapper-hover xeg-gallery-toolbar-wrapper-focus"
        data-role="toolbar"
        ref={el => setToolbarWrapperEl(el ?? null)}
      >
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
        />
      </div>

      {/* Items Container */}
      <div
        class="xeg-gallery-items-container"
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
                className={galleryItemClass(actualIndex)}
                data-index={actualIndex}
                data-xeg-role="gallery-item"
                registerContainer={(element: HTMLElement | null) =>
                  registerFocusItem(actualIndex, element)
                }
                {...(onDownloadCurrent ? { onDownload: handleDownloadCurrent } : {})}
                onFocus={() => handleItemFocus(actualIndex)}
              />
            );
          }}
        </For>
        <div class="xeg-gallery-scroll-spacer" aria-hidden="true" data-xeg-role="scroll-spacer" />
      </div>
    </div>
  );
}

export const VerticalGalleryView = VerticalGalleryViewCore;

export default VerticalGalleryView;
