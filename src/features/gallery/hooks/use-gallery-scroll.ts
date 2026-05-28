// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Tracks user scroll activity and reports scroll state for focus tracking.
 */

import { isGalleryInternalEvent } from '@shared/dom/utils';
import { logger } from '@shared/logging/logger';
import { createPrefixedId, EventManager } from '@shared/services/event-manager';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';
import { toAccessor } from '@shared/utils/solid/accessor-utils';
import type { Accessor } from 'solid-js';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

/** Configuration for scroll tracking. */
interface UseGalleryScrollOptions {
  /** Gallery container element */
  readonly container: MaybeAccessor<HTMLElement | null>;
  /** Scroll target (defaults to container) */
  readonly scrollTarget?: MaybeAccessor<HTMLElement | null>;
  /** Callback when scrolling ends (after idle timeout) */
  readonly onScrollEnd?: () => void;
  /** Whether scroll handling is enabled */
  readonly enabled?: MaybeAccessor<boolean>;
  /** Timestamp of last programmatic scroll (events within 100ms ignored) */
  readonly programmaticScrollTimestamp?: Accessor<number>;
}

/** Return type for useGalleryScroll. */
interface UseGalleryScrollReturn {
  readonly isScrolling: Accessor<boolean>;
  readonly lastScrollTime: Accessor<number>;
}

/** Idle timeout after scroll ends (ms) */
const SCROLL_IDLE_TIMEOUT = 250;

/** Window to ignore programmatic scroll events (ms) */
const PROGRAMMATIC_SCROLL_WINDOW = 100;

/** Listener context prefix used for managed EventManager entries */
const LISTENER_CONTEXT_PREFIX = 'useGalleryScroll';

/**
 * Hook for tracking user scroll activity on the gallery container.
 *
 * Monitors scroll events with idle detection — after scrolling stops for
 * a configurable timeout, the `isScrolling` signal flips to false and
 * the `onScrollEnd` callback fires.
 *
 * @param options - Container, scroll target, and end-of-scroll callback
 * @returns Reactive isScrolling signal and lastScrollTime timestamp
 */
export function useGalleryScroll({
  container,
  scrollTarget,
  onScrollEnd,
  enabled = true,
  programmaticScrollTimestamp,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const containerAccessor = toAccessor(container);
  const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
  const enabledAccessor = toAccessor(enabled);
  const programmaticTimestampAccessor = toAccessor(programmaticScrollTimestamp ?? 0);

  // Access gallery open state via gallerySignals
  const isGalleryOpen = createMemo(() => gallerySignals.isOpen);

  const [isScrolling, setIsScrolling] = createSignal(false);
  const [lastScrollTime, setLastScrollTime] = createSignal(0);
  let scrollIdleTimerId: number | null = null;

  const clearScrollIdleTimer = (): void => {
    if (scrollIdleTimerId !== null) {
      clearTimeout(scrollIdleTimerId);
      scrollIdleTimerId = null;
    }
  };

  const markScrolling = (): void => {
    setIsScrolling(true);
    setLastScrollTime(performance.now());
  };

  const scheduleScrollEnd = (): void => {
    clearScrollIdleTimer();
    scrollIdleTimerId = setTimeout(() => {
      setIsScrolling(false);
      if (__DEV__) {
        logger.debug('useGalleryScroll: Scroll ended');
      }
      onScrollEnd?.();
    }, SCROLL_IDLE_TIMEOUT);
  };

  const shouldIgnoreScroll = (): boolean =>
    performance.now() - programmaticTimestampAccessor() < PROGRAMMATIC_SCROLL_WINDOW;

  /**
   * Check if wheel event originated from toolbar or its panels
   * Toolbar scroll should not trigger gallery scroll state
   */
  const isToolbarScroll = (event: WheelEvent): boolean => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return false;

    // Check for toolbar-related data attributes
    return !!(
      target.closest('[data-gallery-element="toolbar"]') ||
      target.closest('[data-gallery-element="settings-panel"]') ||
      target.closest('[data-gallery-element="tweet-panel"]') ||
      target.closest('[data-role="toolbar"]')
    );
  };

  const handleWheel = (event: WheelEvent): void => {
    if (!isGalleryOpen() || !isGalleryInternalEvent(event)) return;

    // Ignore wheel events from toolbar and its panels
    if (isToolbarScroll(event)) return;

    markScrolling();
    scheduleScrollEnd();
  };

  const handleScroll = (): void => {
    if (!isGalleryOpen() || shouldIgnoreScroll()) return;
    markScrolling();
    scheduleScrollEnd();
  };

  createEffect(() => {
    const isEnabled = enabledAccessor();
    const containerElement = containerAccessor();
    const scrollElement = scrollTargetAccessor();
    const eventTarget = scrollElement ?? containerElement;

    if (!isEnabled || !eventTarget) {
      setIsScrolling(false);
      clearScrollIdleTimer();
      return;
    }

    const eventManager = EventManager.getInstance();
    const listenerContext = createPrefixedId(LISTENER_CONTEXT_PREFIX, ':');
    const listenerIds: string[] = [];

    const registerListener = (type: string, handler: EventListener): void => {
      const id = eventManager.addEventListener(eventTarget, type, handler, {
        passive: true,
        context: listenerContext,
      });
      if (id) {
        listenerIds.push(id);
        if (__DEV__) {
          logger.debug('useGalleryScroll: listener registered', {
            type,
            id,
            context: listenerContext,
          });
        }
      }
    };

    registerListener('wheel', handleWheel as EventListener);
    registerListener('scroll', handleScroll as EventListener);

    if (__DEV__) {
      logger.debug('useGalleryScroll: Listeners registered');
    }

    onCleanup(() => {
      for (const id of listenerIds) {
        eventManager.removeListener(id);
        if (__DEV__) {
          logger.debug('useGalleryScroll: listener removed', { id, context: listenerContext });
        }
      }
      clearScrollIdleTimer();
      setIsScrolling(false);
    });

    // clearScrollIdleTimer already registered above; no need to duplicate.
  });

  return { isScrolling, lastScrollTime };
}
