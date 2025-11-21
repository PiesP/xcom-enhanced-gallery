/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 통합된 갤러리 아이템 스크롤 훅
 * @description Solid.js 기반으로 갤러리 아이템 간 스크롤을 안정적으로 관리하는 훅
 */

import { getSolid } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { toAccessor } from '@shared/utils/solid-helpers';
import { globalTimerManager } from '@shared/utils/timer-management';
import { createItemScrollStateSignal, updateStateSignal } from '@shared/state/item-scroll';

const { onCleanup, createEffect } = getSolid();

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

const INDEX_WATCH_INTERVAL = 32; // ~30fps 폴링으로 signal 비연동 환경에서도 안정 지원

export interface UseGalleryItemScrollOptions {
  /** 스크롤 활성화 여부 */
  enabled?: MaybeAccessor<boolean>;
  /** 스크롤 동작 방식 */
  behavior?: MaybeAccessor<ScrollBehavior>;
  /** 스크롤 블록 위치 */
  block?: MaybeAccessor<ScrollLogicalPosition>;
  /** 스크롤 오프셋 (px) */
  offset?: MaybeAccessor<number>;
  /** 중앙 정렬 여부 */
  alignToCenter?: MaybeAccessor<boolean>;
  /** motion 선호도 고려 여부 */
  respectReducedMotion?: MaybeAccessor<boolean>;
}

export interface UseGalleryItemScrollReturn {
  /** 특정 인덱스로 스크롤 */
  scrollToItem: (index: number) => Promise<void>;
  /** 현재 인덱스로 스크롤 (자동 호출용) */
  scrollToCurrentItem: () => Promise<void>;
}

export function useGalleryItemScroll(
  containerRef: { current: HTMLElement | null } | Accessor<HTMLElement | null>,
  currentIndex: MaybeAccessor<number>,
  totalItems: MaybeAccessor<number>,
  options: UseGalleryItemScrollOptions = {}
): UseGalleryItemScrollReturn {
  // Convert containerRef to accessor for consistent handling
  const containerAccessor: Accessor<HTMLElement | null> =
    typeof containerRef === 'function' ? containerRef : () => containerRef.current;

  const enabled = toAccessor(options.enabled ?? true);
  // Phase 264: Default scroll behavior is 'auto' (no motion)
  // Manual scroll can still choose 'smooth' via options
  const behavior = toAccessor(options.behavior ?? 'auto');
  const block = toAccessor(options.block ?? 'start');
  // Phase 266: Debounce removed (always immediate 0ms execution)
  const offset = toAccessor(options.offset ?? 0);
  const alignToCenter = toAccessor(options.alignToCenter ?? false);
  const respectReducedMotion = toAccessor(options.respectReducedMotion ?? true);

  const currentIndexAccessor = toAccessor(currentIndex);
  const totalItemsAccessor = toAccessor(totalItems);

  // Manage scroll state (pendingIndex, lastScrolledIndex, auto-scroll flag, etc.)
  const stateSignal = createItemScrollStateSignal();
  const getState = stateSignal.getState;
  const setState = stateSignal.setState;

  let retryCount = 0;
  let renderMutationObserver: MutationObserver | null = null; // Phase 263: Solution 1 - Initial render detection
  // Phase 266: Removed hasPerformedInitialScroll - always use immediate (0ms) debounce

  const clearScrollTimeout = () => {
    const state = getState();
    if (state.scrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(state.scrollTimeoutId);
      updateStateSignal(setState, { scrollTimeoutId: null });
    }
  };

  const stopIndexWatcher = () => {
    const state = getState();
    if (state.indexWatcherId !== null) {
      globalTimerManager.clearInterval(state.indexWatcherId);
      updateStateSignal(setState, { indexWatcherId: null });
    }
  };

  // Clear user scroll timeout
  const clearUserScrollTimeout = () => {
    const state = getState();
    if (state.userScrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(state.userScrollTimeoutId);
      updateStateSignal(setState, { userScrollTimeoutId: null });
    }
  };

  // Detect user scroll activity
  const handleUserScroll = () => {
    const state = getState();
    // Ignore scroll events during auto-scroll
    if (state.isAutoScrolling) {
      return;
    }

    updateStateSignal(setState, { userScrollDetected: true });
    logger.debug('useGalleryItemScroll: User scroll detected', {
      timestamp: Date.now(),
    });

    // Clean up existing timers
    clearUserScrollTimeout();
    clearScrollTimeout();

    // Clear user scroll flag after 150ms (reduced from 500ms to fix scroll skip bug)
    const timeoutId = globalTimerManager.setTimeout(() => {
      updateStateSignal(setState, { userScrollDetected: false });
      logger.debug('useGalleryItemScroll: User scroll ended, auto-scroll resumed', {
        timestamp: Date.now(),
      });
    }, 150);

    updateStateSignal(setState, { userScrollTimeoutId: timeoutId });
  };

  const resolveBehavior = (): ScrollBehavior => {
    if (!respectReducedMotion()) {
      return behavior();
    }

    try {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
          return 'auto';
        }
      }
    } catch {
      // matchMedia 미지원 환경에서는 기본 동작을 유지
    }

    return behavior();
  };

  const scrollToItem = async (index: number): Promise<void> => {
    const container = containerAccessor();
    const isEnabled = enabled();
    const total = totalItemsAccessor();

    if (!isEnabled || !container || index < 0 || index >= total) {
      logger.debug('useGalleryItemScroll: Scroll conditions not met', {
        enabled: isEnabled,
        hasContainer: !!container,
        index,
        totalItems: total,
      });
      updateStateSignal(setState, { pendingIndex: null });
      return;
    }

    try {
      // Set auto-scroll flag to ignore user scroll events
      updateStateSignal(setState, { isAutoScrolling: true });

      const itemsRoot = container.querySelector(
        '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
      ) as HTMLElement | null;

      if (!itemsRoot) {
        logger.warn('useGalleryItemScroll: Items container not found', {
          selectors: '[data-xeg-role="items-list"], [data-xeg-role="items-container"]',
        });
        updateStateSignal(setState, { pendingIndex: null, isAutoScrolling: false });
        return;
      }

      // Phase 328: Use querySelectorAll to exclude spacer element (data-xeg-role='scroll-spacer')
      const galleryItems = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
      const targetElement = galleryItems[index] as HTMLElement | undefined;
      if (!targetElement) {
        logger.warn('useGalleryItemScroll: Target element not found', {
          index,
          totalItems: total,
          galleryItemsCount: galleryItems.length,
        });
        updateStateSignal(setState, { pendingIndex: null, isAutoScrolling: false });
        return;
      }

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        await new Promise<void>(resolve => {
          window.requestAnimationFrame(() => resolve());
        });
      }

      // Phase 328: Removed Phase 327 special logic for last item
      // All items now use consistent scrollIntoView behavior
      // Last item can scroll to top via transparent spacer element
      const actualBehavior = resolveBehavior();

      targetElement.scrollIntoView({
        behavior: actualBehavior,
        block: alignToCenter() ? 'center' : block(),
        inline: 'nearest',
      });

      const offsetValue = offset();
      if (offsetValue !== 0) {
        container.scrollTo({
          top: container.scrollTop - offsetValue,
          behavior: actualBehavior,
        });
      }

      updateStateSignal(setState, {
        lastScrolledIndex: index,
        pendingIndex: null,
      });
      retryCount = 0;

      logger.debug('useGalleryItemScroll: Scroll completed', {
        index,
        behavior: actualBehavior,
        block: alignToCenter() ? 'center' : block(),
        offset: offsetValue,
        timestamp: Date.now(),
      });

      if (actualBehavior === 'smooth') {
        await new Promise<void>(resolve => {
          globalTimerManager.setTimeout(resolve, 300);
        });
      }

      // Clear auto-scroll flag on next tick to allow scroll event processing
      globalTimerManager.setTimeout(() => {
        updateStateSignal(setState, { isAutoScrolling: false });
      }, 50);
    } catch (error) {
      logger.error('useGalleryItemScroll: Scroll failed', { index, error });
      updateStateSignal(setState, { pendingIndex: null, isAutoScrolling: false });

      // Exponential backoff retry: 50ms, 100ms, 150ms
      if (retryCount < 3) {
        retryCount += 1;
        const delayMs = 50 * retryCount;

        logger.debug('useGalleryItemScroll: Retry scheduled', {
          index,
          retryCount,
          delayMs,
          timestamp: Date.now(),
        });

        globalTimerManager.setTimeout(() => {
          void scrollToItem(index);
        }, delayMs);
        return;
      }

      // Polling fallback: wait for element to render (slow network, etc.)
      logger.warn('useGalleryItemScroll: Starting polling fallback', {
        index,
        timestamp: Date.now(),
      });

      let pollingAttempts = 0;
      const maxPollingAttempts = 20; // ~1 second (50ms * 20)

      const pollForElement = () => {
        if (pollingAttempts >= maxPollingAttempts) {
          logger.warn('useGalleryItemScroll: Polling timeout exceeded', {
            index,
            pollingAttempts,
            timestamp: Date.now(),
          });
          return;
        }

        const container = containerAccessor();
        if (!container) {
          globalTimerManager.setTimeout(pollForElement, 50);
          pollingAttempts += 1;
          return;
        }

        const itemsRoot = container.querySelector(
          '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
        ) as HTMLElement | null;

        if (!itemsRoot) {
          globalTimerManager.setTimeout(pollForElement, 50);
          pollingAttempts += 1;
          return;
        }

        // Phase 328: Use querySelectorAll to exclude spacer
        const galleryItems = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
        const targetElement = galleryItems[index] as HTMLElement | undefined;
        if (targetElement) {
          // Element found, proceed with scroll
          logger.debug('useGalleryItemScroll: Element found, proceeding with scroll', {
            index,
            pollingAttempts,
            timestamp: Date.now(),
          });

          const executeAutoScroll = () => {
            try {
              updateStateSignal(setState, { isAutoScrolling: true });
              const actualBehavior = resolveBehavior();

              targetElement.scrollIntoView({
                behavior: actualBehavior,
                block: alignToCenter() ? 'center' : block(),
                inline: 'nearest',
              });

              const offsetValue = offset();
              if (offsetValue !== 0) {
                container.scrollTo({
                  top: container.scrollTop - offsetValue,
                  behavior: actualBehavior,
                });
              }

              updateStateSignal(setState, {
                lastScrolledIndex: index,
                pendingIndex: null,
              });
              retryCount = 0;

              globalTimerManager.setTimeout(() => {
                updateStateSignal(setState, { isAutoScrolling: false });
              }, 50);
            } catch (err) {
              logger.error('useGalleryItemScroll: Scroll failed after polling', {
                index,
                error: err,
              });
              updateStateSignal(setState, { isAutoScrolling: false });
            }
          };

          if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => executeAutoScroll());
          } else {
            executeAutoScroll();
          }
          return;
        }

        // 아직 없음, 다시 폴링
        globalTimerManager.setTimeout(pollForElement, 50);
        pollingAttempts += 1;
      };

      pollForElement();
    }
  };

  // Phase 263: Solution 1 - Monitor initial DOM rendering to trigger scroll immediately
  const setupInitialRenderMonitor = (targetIndex: number): void => {
    // Clean up any existing observer
    if (renderMutationObserver) {
      renderMutationObserver.disconnect();
      renderMutationObserver = null;
    }

    const container = containerAccessor();
    if (!container) return;

    const itemsRoot = container.querySelector(
      '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
    ) as HTMLElement | null;

    if (!itemsRoot) return;

    // Phase 328: Use querySelectorAll to exclude spacer
    const galleryItems = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
    const targetElement = galleryItems[targetIndex] as HTMLElement | undefined;
    if (targetElement) {
      logger.debug(
        'useGalleryItemScroll: Target element already rendered, skipping MutationObserver',
        {
          targetIndex,
        }
      );
      return;
    }

    // Phase 263: Solution 1 - Watch for DOM mutations (additions) to detect rendering
    renderMutationObserver = new MutationObserver(() => {
      const updatedGalleryItems = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
      const currentTargetElement = updatedGalleryItems[targetIndex] as HTMLElement | undefined;
      if (currentTargetElement) {
        logger.debug('useGalleryItemScroll: Target element detected by MutationObserver', {
          targetIndex,
          delay: 'immediate (~0ms)',
        });

        // Disconnect observer before scrolling
        if (renderMutationObserver) {
          renderMutationObserver.disconnect();
          renderMutationObserver = null;
        }

        // Trigger scroll immediately (bypass scheduled timeout if still pending)
        globalTimerManager.setTimeout(() => {
          void scrollToItem(targetIndex);
        }, 0);
      }
    });

    try {
      renderMutationObserver.observe(itemsRoot, {
        childList: true, // Watch for added/removed nodes
        subtree: false, // Only direct children
      });

      logger.debug('useGalleryItemScroll: MutationObserver activated for initial render', {
        targetIndex,
      });
    } catch (err) {
      logger.debug('useGalleryItemScroll: MutationObserver setup failed, falling back to polling', {
        error: err,
      });
      renderMutationObserver = null;
    }
  };

  const scheduleScrollToIndex = (index: number): void => {
    clearScrollTimeout();

    // Phase 266: Always use immediate (0ms) debounce for responsive scrolling
    // This is safe because checkIndexChanges() ensures no duplicate scheduling
    // via pendingIndex check and userScrollDetected suppression
    const delay = 0;

    logger.debug('useGalleryItemScroll: Auto-scroll scheduled (Phase 266: Immediate execution)', {
      currentIndex: index,
      delay,
    });

    // Phase 263: Solution 1 - Setup MutationObserver to detect initial render
    setupInitialRenderMonitor(index);

    updateStateSignal(setState, { pendingIndex: index });

    const timeoutId = globalTimerManager.setTimeout(() => {
      const currentState = getState();
      logger.debug('useGalleryItemScroll: Auto-scroll executing', {
        currentIndex: index,
        lastScrolledIndex: currentState.lastScrolledIndex,
      });
      void scrollToItem(index);
    }, delay);

    updateStateSignal(setState, { scrollTimeoutId: timeoutId });
  };

  const checkIndexChanges = () => {
    const container = containerAccessor();
    const isEnabled = enabled();

    if (!isEnabled || !container) {
      updateStateSignal(setState, {
        lastScrolledIndex: -1,
        pendingIndex: null,
      });
      clearScrollTimeout();
      return;
    }

    const index = currentIndexAccessor();
    const total = totalItemsAccessor();
    const state = getState();

    if (index < 0 || index >= total) {
      updateStateSignal(setState, { pendingIndex: null });
      clearScrollTimeout();
      return;
    }

    if (index === state.lastScrolledIndex || index === state.pendingIndex) {
      return;
    }

    // Suppress auto-scroll if user is actively scrolling
    if (state.userScrollDetected) {
      logger.debug('useGalleryItemScroll: User scroll detected - suppressing auto-scroll', {
        currentIndex: index,
        userScrollDetected: state.userScrollDetected,
      });
      return;
    }

    scheduleScrollToIndex(index);
  };

  // Start polling index changes and store watcher ID
  const indexWatcherId = globalTimerManager.setInterval(checkIndexChanges, INDEX_WATCH_INTERVAL);
  updateStateSignal(setState, { indexWatcherId });

  // Listen for container scroll events
  createEffect(() => {
    const container = containerAccessor();
    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleUserScroll, { passive: true });

    onCleanup(() => {
      container.removeEventListener('scroll', handleUserScroll);
    });
  });

  const scrollToCurrentItem = (): Promise<void> => {
    return scrollToItem(currentIndexAccessor());
  };

  onCleanup(() => {
    clearScrollTimeout();
    stopIndexWatcher();
    clearUserScrollTimeout();
    // Phase 263: Solution 1 - Clean up MutationObserver
    if (renderMutationObserver) {
      renderMutationObserver.disconnect();
      renderMutationObserver = null;
    }
    stateSignal.reset();
  });

  return {
    scrollToItem,
    scrollToCurrentItem,
  };
}
