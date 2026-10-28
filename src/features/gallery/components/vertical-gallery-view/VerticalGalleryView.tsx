// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Vertical Gallery View Component (Solid.js)
 * @description Main gallery component rendering media items with vertical scrolling, state management,
 * toolbar visibility, keyboard navigation, and fit mode support via useVerticalGallery hook.
 */

import { useGalleryFitMode } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-fit-mode';
import { dismissBulkDownloadOutcome } from '@features/gallery/hooks/dismiss-bulk-download-outcome';
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
  gallerySignals,
  getDisplayedMediaIndex,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import {
  type BulkDownloadOutcome,
  downloadState,
} from '@shared/state/signals/gallery-download-signals';
import { computePreloadIndices } from '@shared/utils/performance/preload';
import { withTrustedEvent } from '@shared/utils/events/trusted-event';
import { cx } from '@shared/utils/text/formatting';
import type { Accessor, JSXElement } from 'solid-js';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  splitProps,
  untrack,
} from 'solid-js';

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
  /** Retry only failed entries into a supplementary ZIP. */
  readonly onRecoverFailed?: () => void;
  readonly onDismissBulkOutcome?: () => void;
}

export function VerticalGalleryView(props: VerticalGalleryViewProps): JSXElement {
  const [local] = splitProps(props, [
    'onClose',
    'className',
    'onPrevious',
    'onNext',
    'onDownloadCurrent',
    'onDownloadAll',
    'onRecoverFailed',
    'onDismissBulkOutcome',
  ]);

  const handleClose = local.onClose ?? (() => {});

  // State accessors - using gallerySignals with createMemo for fine-grained reactivity
  const mediaItems = createMemo(() => gallerySignals.mediaItems);
  const currentIndex = createMemo(() => gallerySignals.currentIndex);
  const isDownloading = createMemo(() => downloadState.isProcessing);
  const downloadStatus = createMemo(() => downloadState.status);
  const bulkOutcome = createMemo(() => downloadState.bulkOutcome);
  const toolbarDownloadStatus = createMemo(() =>
    bulkOutcome() && downloadStatus() !== 'working' ? 'idle' : downloadStatus()
  );

  // Element refs
  const [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
  const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal<HTMLDivElement | null>(null);
  const [itemsContainerEl, setItemsContainerEl] = createSignal<HTMLUListElement | null>(null);
  const [itemsContainerHeight, setItemsContainerHeight] = createSignal(0);

  createEffect(() => {
    const root = itemsContainerEl();
    if (!root) {
      return;
    }
    const updateHeight = (): void => {
      setItemsContainerHeight(root.clientHeight);
    };
    updateHeight();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(root);
    onCleanup(() => observer.disconnect());
  });

  // Derived state — trivially computed from already-memoized values; plain getters suffice
  const isVisible = createMemo(() => mediaItems().length > 0);

  const activeMedia = createMemo(() => {
    const items = mediaItems();
    const index = currentIndex();
    return items[index] ?? null;
  });

  const displayedMedia = createMemo(() => {
    const index = getDisplayedMediaIndex();
    return index === null ? null : (mediaItems()[index] ?? null);
  });
  const tweetText = () => displayedMedia()?.tweetText ?? null;
  const tweetTextContent = () => displayedMedia()?.tweetTextContent ?? null;
  const tweetUrl = () => displayedMedia()?.tweetUrl ?? null;

  const preloadCount = createMemo(() => getTypedSettingOr('gallery.preloadCount', 3));
  const preloadIndices = createMemo(() =>
    computePreloadIndices(currentIndex(), mediaItems().length, preloadCount())
  );

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
  const sourceFetchReason = (statuses: readonly number[]): string =>
    translate('msg.dl.bulkOutcome.sourceFetchFailed', { statuses: statuses.join(', ') });
  const outcomeReason = (outcome: BulkDownloadOutcome): string => {
    if (outcome.reason === 'none') {
      return '';
    }
    if (outcome.reason === 'sourceFetchFailed') {
      return sourceFetchReason(outcome.sourceFetchStatuses ?? []);
    }
    return translate(`msg.dl.bulkOutcome.${outcome.reason}`);
  };

  // Debounced scroll correction — adjusts scroll position after media loads
  const { debouncedScrollCorrection } = useGalleryScrollCorrection({
    isVisible,
    currentIndex,
    activeMedia,
    lastUserScrollTime: scroll.lastUserScrollTime,
    lastProgrammaticScrollTime: navigation.programmaticScrollTimestamp,
    scrollToItem: scroll.scrollToItem,
  });

  // Ensure initial focus is applied before any navigation events fire
  createEffect(() => {
    if (!isVisible() || navigation.lastNavigationTrigger()) {
      return;
    }

    // Initial focus is treated as keyboard/manual navigation
    const requestedIndex = currentIndex();
    // The navigation call reads viewport focus; that observation must not
    // subscribe this initial-focus effect and snap a later manual scroll back.
    untrack(() => navigateToItem(requestedIndex, 'auto-focus'));
  });

  // Fit mode state — managed via useGalleryFitMode hook with persistence
  const { imageFitMode, handleFitOriginal, handleFitWidth, handleFitHeight, handleFitContainer } =
    useGalleryFitMode({
      scrollToCurrentItem: scroll.scrollToCurrentItem,
    });

  // Event handlers
  const handleDownloadCurrent = () => local.onDownloadCurrent?.();
  const handleDownloadAll = () => local.onDownloadAll?.();

  // Stable callback for media load — verifies mediaId to guard against stale indices
  const handleMediaLoad = (mediaId: string, indexValue: number): void => {
    const items = mediaItems();
    const item = items[indexValue];
    if (item?.id !== mediaId) {
      return;
    }
    debouncedScrollCorrection(indexValue, mediaId);
  };

  // Memoized callback factories for per-item refs
  // Avoids recreating closures on every parent render
  const createRegisterContainer =
    (index: Accessor<number>) =>
    (element: HTMLElement | null): void =>
      focus.registerItem(index(), element);
  const createHandleFocus = (index: Accessor<number>) => (): void => focus.handleItemFocus(index());

  // Navigation handlers — previous/next, background click, media item click
  const { handlePrevious, handleNext, handleBackgroundClick, handleMediaItemClick } =
    useGalleryNavigationHandlers({
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
    // Pointer backdrop dismissal has the Escape-key and close-button equivalents managed by the gallery dialog.
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
      <div
        class={styles.toolbarHoverZone}
        data-gallery-element="toolbar-hover-zone"
        aria-hidden="true"
      />

      <div class={styles.toolbarWrapper} ref={(el) => setToolbarWrapperEl(el ?? null)}>
        <Toolbar
          currentIndex={currentIndex}
          focusedIndex={focus.focusedIndex}
          totalCount={() => mediaItems().length}
          isDownloading={isDownloading}
          downloadStatus={toolbarDownloadStatus}
          currentFitMode={imageFitMode}
          tweetText={tweetText}
          tweetTextContent={tweetTextContent}
          tweetUrl={tweetUrl}
          className={styles.toolbar}
          handlers={toolbarHandlers()}
        />
      </div>

      <ul
        class={styles.itemsContainer}
        data-gallery-element="items"
        ref={(el) => setItemsContainerEl(el ?? null)}
      >
        <For each={mediaItems()}>
          {(item, index) => (
            <VerticalImageItem
              scrollRoot={itemsContainerEl}
              scrollRootHeight={itemsContainerHeight}
              media={item}
              index={index()}
              isActive={index() === currentIndex()}
              isFocused={index() === focus.focusedIndex()}
              forceVisible={preloadIndices().includes(index())}
              fitMode={imageFitMode}
              onClick={() => handleMediaItemClick(index())}
              onMediaLoad={handleMediaLoad}
              onMediaError={handleMediaLoad}
              className={cx(styles.galleryItem, index() === currentIndex() && styles.itemActive)}
              registerContainer={createRegisterContainer(index)}
              onFocus={createHandleFocus(index)}
            />
          )}
        </For>
      </ul>
      <Show when={bulkOutcome()}>
        {(outcome) => (
          // Keyboard users interact with the native dismissal button; pointer propagation only protects the backdrop close handler.
          <section
            class={styles.bulkOutcome}
            data-gallery-element="bulk-download-outcome"
            role="status"
            aria-live={downloadStatus() === 'working' ? 'off' : 'polite'}
            aria-atomic="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div class={styles.bulkOutcomeHeading}>
              <strong>
                {downloadStatus() === 'working' && `${translate('msg.dl.bulkOutcome.previous')}: `}
                {translate(
                  outcome().handedOff
                    ? 'msg.dl.bulkOutcome.titleHandedOff'
                    : 'msg.dl.bulkOutcome.titleFailed'
                )}
              </strong>
              <button
                type="button"
                onClick={() => {
                  if (local.onDismissBulkOutcome) {
                    local.onDismissBulkOutcome();
                  } else {
                    dismissBulkDownloadOutcome();
                  }
                }}
              >
                {translate('msg.dl.bulkOutcome.dismiss')}
              </button>
            </div>
            <p>
              {translate(
                outcome().supplementary
                  ? 'msg.dl.bulkOutcome.scopeSupplementary'
                  : 'msg.dl.bulkOutcome.scope',
                { total: outcome().total }
              )}
            </p>
            <p>
              {translate('msg.dl.bulkOutcome.counts', {
                included: outcome().included,
                omitted: outcome().omitted,
              })}
            </p>
            <p>
              {translate(
                outcome().handedOff
                  ? 'msg.dl.bulkOutcome.browserHandoff'
                  : 'msg.dl.bulkOutcome.noZip'
              )}
            </p>
            {outcome().reason !== 'none' && <p>{outcomeReason(outcome())}</p>}
            {outcome().sourceUnavailable && outcome().reason !== 'sourceUnavailable' && (
              <p>{translate('msg.dl.bulkOutcome.sourceUnavailable')}</p>
            )}
            {(outcome().sourceFetchStatuses?.length ?? 0) > 0 &&
              outcome().reason !== 'sourceFetchFailed' && (
                <p>{sourceFetchReason(outcome().sourceFetchStatuses ?? [])}</p>
              )}
            <p>
              {translate(
                outcome().supplementary
                  ? 'msg.dl.bulkOutcome.nextActionSupplementary'
                  : 'msg.dl.bulkOutcome.nextAction'
              )}
            </p>
            <Show when={(outcome().recoverableCount ?? 0) > 0 && local.onRecoverFailed}>
              <button
                type="button"
                disabled={isDownloading()}
                onClick={withTrustedEvent(() => local.onRecoverFailed?.())}
              >
                {translate('msg.dl.bulkOutcome.recoverMissing', {
                  count: outcome().recoverableCount ?? 0,
                })}
              </button>
            </Show>
          </section>
        )}
      </Show>
    </div>
  );
}
