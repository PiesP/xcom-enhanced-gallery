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
 * **Dependencies**:
 * - Solid.js signals for reactive state management
 * - Gallery signals (@shared/state/signals/gallery.signals)
 * - Multiple custom hooks for scroll, focus, and keyboard handling
 * - Toolbar and KeyboardHelpOverlay components
 * - Language service for i18n
 *
 * **API**:
 * - Props: {@link VerticalGalleryViewProps}
 * - Emits gallery close, previous/next navigation, download events via callbacks
 *
 * **Architecture**:
 * - Follows PC-only event policy (click, keydown/keyup, wheel, mouse*)
 * - Uses design tokens for all colors and sizes (no hardcoding)
 * - Vendor APIs accessed via getSolid() getter pattern
 * - Component-level hooks for keyboard handling
 *
 * @module features/gallery/components/vertical-gallery-view
 * @version 6.0 - Integrated toolbar state management system
 */

import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { getLanguageService } from '@shared/container/service-accessors';
import { getSetting, setSetting } from '@shared/container/settings-access';
import { ensureGalleryScrollAvailable } from '@shared/dom/utils';
import { observeViewportCssVars } from '@shared/dom/viewport';
import { getSolid } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { DownloadState } from '@shared/state/signals/download.signals';
import { downloadState } from '@shared/state/signals/download.signals';
import type { GalleryState } from '@shared/state/signals/gallery.signals';
import {
  galleryIndexEvents,
  galleryState,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import { useSelector } from '@shared/state/signals/signal-selector';
import { isDownloadUiBusy } from '@shared/state/ui/download-ui-state';
import type { ImageFitMode, MediaInfo } from '@shared/types';
import { animateGalleryEnter, animateGalleryExit } from '@shared/utils/css/css-animations';
import { safeEventPrevent } from '@shared/utils/events/utils';
import { computePreloadIndices } from '@shared/utils/performance';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { stringWithDefault } from '@shared/utils/types/safety';
import type { JSX } from 'solid-js';
import { useGalleryInitialScroll } from './hooks/useGalleryInitialScroll';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
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
  const { createSignal, createMemo, createEffect, onCleanup, on } = solidAPI;

  const mediaItems = useSelector<GalleryState, readonly MediaInfo[]>(
    galleryState,
    state => state.mediaItems,
    { dependencies: state => [state.mediaItems] },
  );

  const currentIndex = useSelector<GalleryState, number>(
    galleryState,
    state => state.currentIndex,
    { dependencies: state => [state.currentIndex] },
  );

  const isDownloading = useSelector(
    downloadState,
    (download: DownloadState) =>
      isDownloadUiBusy({
        downloadProcessing: download.isProcessing,
      }),
    { dependencies: (download: DownloadState) => [download.isProcessing] },
  );

  const [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
  const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal<HTMLDivElement | null>(null);
  const [itemsContainerEl, setItemsContainerEl] = createSignal<HTMLDivElement | null>(null);

  // Phase 21.4 → Phase 376: memoized visibility accessor for toolbar sync
  const isVisible = createMemo(() => mediaItems().length > 0);

  // Phase 146: 툴바 초기 표시 및 자동 숨김
  const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(true);

  // Phase 430: Track last navigation trigger to prevent snap-back after manual scroll
  const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal<string | null>(null);

  // Phase 430: 프로그램적 스크롤 타임스탬프 (스크롤바 드래그와 구분)
  const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);

  createEffect(() => {
    const unsubscribe = galleryIndexEvents.on('navigate:complete', ({ trigger }) => {
      setLastNavigationTrigger(trigger);
    });
    onCleanup(() => unsubscribe());
  });

  // 툴바 자동 숨김 타이머 effect
  createEffect(() => {
    if (!isVisible() || mediaItems().length === 0) {
      // 갤러리가 보이지 않으면 초기 표시 상태도 false
      setIsInitialToolbarVisible(false);
      return;
    }

    // 갤러리가 열리면 툴바를 초기에 표시
    setIsInitialToolbarVisible(true);

    // 자동 숨김 시간 가져오기 (기본 3초)
    const autoHideDelay = getSetting<number>('toolbar.autoHideDelay', 3000);

    // autoHideDelay가 0이면 즉시 숨김
    if (autoHideDelay === 0) {
      setIsInitialToolbarVisible(false);
      return;
    }

    // Timer setup
    const timer = globalTimerManager.setTimeout(() => {
      setIsInitialToolbarVisible(false);
    }, autoHideDelay);

    // cleanup for timer
    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
    });
  });

  const getInitialFitMode = (): ImageFitMode => {
    const saved = getSetting<ImageFitMode>('gallery.imageFitMode', 'fitWidth');
    return saved ?? 'fitWidth';
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

  const activeMedia = createMemo(() => {
    const items = mediaItems();
    const index = currentIndex();
    return items[index] ?? null;
  });

  const preloadIndices = createMemo(() => {
    const count = getSetting<number>('gallery.preloadCount', 0);
    return computePreloadIndices(currentIndex(), mediaItems().length, count);
  });

  createEffect(
    on(containerEl, element => {
      if (element) {
        ensureGalleryScrollAvailable(element);
      }
    }),
  );

  // Phase 20.2: 애니메이션 effect에 명시적 의존성 추가
  createEffect(
    on(
      [containerEl, isVisible],
      ([container, visible]) => {
        if (!container) return;

        if (visible) {
          animateGalleryEnter(container);
        } else {
          animateGalleryExit(container);
        }
      },
      { defer: true },
    ),
  );

  createEffect(
    on([isVisible, containerEl], ([visible, container]) => {
      if (visible || !container) {
        return;
      }

      const videos = container.querySelectorAll('video');
      videos.forEach(video => {
        try {
          video.pause();
          video.currentTime = 0;
        } catch (error) {
          logger.warn('video cleanup failed', { error });
        }
      });
    }),
  );

  // Note: Media prefetching is handled by MediaService.prefetchNextMedia()
  // which provides more sophisticated caching with blob storage

  createEffect(() => {
    const container = containerEl();
    const wrapper = toolbarWrapperEl();
    if (!container || !wrapper) return;

    const cleanup = observeViewportCssVars(container, () => {
      const toolbarHeight = wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0;
      return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
    });

    onCleanup(() => {
      cleanup?.();
    });
  });

  // Ref to break circular dependency between scroll and focus tracker
  let forceSyncRef: (() => void) | undefined;

  // Track scroll state - fires forceSync on each scroll for focus updates
  const { isScrolling } = useGalleryScroll({
    container: () => containerEl(),
    scrollTarget: () => itemsContainerEl(),
    enabled: isVisible,
    programmaticScrollTimestamp,
    onScroll: () => forceSyncRef?.(),
  });

  // Track focused item based on scroll position (IntersectionObserver)
  const {
    focusedIndex,
    registerItem: registerFocusItem,
    handleItemFocus,
    handleItemBlur,
    applyFocusAfterNavigation,
    setManualFocus,
    forceSync,
  } = useGalleryFocusTracker({
    container: () => containerEl(),
    isEnabled: isVisible,
    autoFocusDebounce: 0,
  });

  forceSyncRef = forceSync;

  // Handle auto-scroll to item on navigation (disabled during user scroll)
  const { scrollToItem } = useGalleryItemScroll(
    () => containerEl(),
    currentIndex,
    () => mediaItems().length,
    {
      enabled: () => !isScrolling() && lastNavigationTrigger() !== 'scroll',
      block: 'start',
      isScrolling,
      onScrollStart: () => setProgrammaticScrollTimestamp(Date.now()),
    },
  );

  // Sync focusedIndex -> currentIndex when user scrolls (not programmatic)
  createEffect(() => {
    const focused = focusedIndex();
    const current = currentIndex();
    const isProgrammatic = Date.now() - programmaticScrollTimestamp() < 100;

    if (!isProgrammatic && focused !== null && focused !== current) {
      navigateToItem(focused, 'scroll', 'scroll');
    }
  });

  // Clear manual focus when user starts scrolling to enable auto-focus
  createEffect(() => {
    if (isScrolling()) {
      setManualFocus(null);
      setIsInitialToolbarVisible(false);
    }
  });

  // Initial scroll on gallery open
  const { autoScrollToCurrentItem } = useGalleryInitialScroll({
    isVisible,
    containerEl: () => containerEl(),
    mediaItems,
    currentIndex,
    scrollToItem,
    applyFocusAfterNavigation,
  });

  // Handle navigation events (keyboard, button clicks)
  createEffect(() => {
    if (!isVisible()) return;

    const unsubscribe = galleryIndexEvents.on('navigate:complete', ({ index, trigger }) => {
      scrollToItem(index);
      applyFocusAfterNavigation(index, trigger);
    });

    onCleanup(() => unsubscribe());
  });

  useGalleryKeyboard({
    onClose: onClose || (() => {}),
  });

  const handleDownloadCurrent = () => {
    onDownloadCurrent?.();
  };

  const handleDownloadAll = () => {
    onDownloadAll?.();
  };

  const persistFitMode = (mode: ImageFitMode) =>
    setSetting('gallery.imageFitMode', mode).catch(error => {
      logger.warn('Failed to save fit mode', { error, mode });
    });

  const applyFitMode = (mode: ImageFitMode, event?: Event) => {
    safeEventPrevent(event);
    setImageFitMode(mode);
    void persistFitMode(mode);
    void autoScrollToCurrentItem();
  };

  const handleFitOriginal = (event?: Event) => {
    applyFitMode('original', event);
  };

  const handleFitWidth = (event?: Event) => {
    applyFitMode('fitWidth', event);
  };

  const handleFitHeight = (event?: Event) => {
    applyFitMode('fitHeight', event);
  };

  const handleFitContainer = (event?: Event) => {
    applyFitMode('fitContainer', event);
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
      class={`${styles.container} ${isInitialToolbarVisible() ? styles.initialToolbarVisible : ''} ${isScrolling() ? styles.isScrolling : ''} ${stringWithDefault(className, '')}`}
      onClick={handleBackgroundClick}
      data-xeg-gallery="true"
      data-xeg-role="gallery"
    >
      <div class={styles.toolbarHoverZone} data-role="toolbar-hover-zone" />

      <div class={styles.toolbarWrapper} ref={el => setToolbarWrapperEl(el ?? null)}>
        <Toolbar
          onClose={onClose || (() => {})}
          onPrevious={onPrevious || (() => {})}
          onNext={onNext || (() => {})}
          currentIndex={currentIndex}
          focusedIndex={focusedIndex}
          totalCount={() => mediaItems().length}
          // Phase 415: Two separate props for different purposes
          // isDownloading: Internal state tracking for download button visual feedback
          // disabled: External control to disable all toolbar buttons during operations
          isDownloading={isDownloading}
          onDownloadCurrent={handleDownloadCurrent}
          onDownloadAll={handleDownloadAll}
          onOpenSettings={() => {
            logger.debug('[VerticalGalleryView] Settings opened');
          }}
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
        {/* Phase 328: Fixed - Simplified For loop without transformation */}
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
                {...(onDownloadCurrent
                  ? {
                      onDownload: handleDownloadCurrent,
                    }
                  : {})}
                onFocus={() => handleItemFocus(actualIndex)}
                onBlur={() => handleItemBlur(actualIndex)}
              />
            );
          }}
        </For>
        {/* Phase 328: Transparent spacer for last item top-align scrolling */}
        <div class={styles.scrollSpacer} aria-hidden="true" data-xeg-role="scroll-spacer" />
      </div>
    </div>
  );
}

export const VerticalGalleryView = VerticalGalleryViewCore;
