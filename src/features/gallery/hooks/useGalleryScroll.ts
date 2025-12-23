/**
 * @fileoverview Gallery Scroll State Hook
 * @description Tracks user scroll activity for focus tracking integration.
 *
 * Key behaviors:
 * - Detects user scroll events (wheel, scrollbar drag)
 * - Filters programmatic scrolls (within 100ms window)
 * - Reports scroll state (isScrolling, lastScrollTime)
 * - Triggers callbacks for focus recomputation
 *
 * Note: Does NOT trigger auto-scroll - tracking only.
 */

import { isGalleryInternalEvent } from '@shared/dom/utils';
import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { createPrefixedId } from '@shared/utils/id/create-id';
import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';
import { toAccessor } from '@shared/utils/solid/accessor-utils';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import type { Accessor } from 'solid-js';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

/** Hook configuration */
interface UseGalleryScrollOptions {
  /** Gallery container element */
  container: MaybeAccessor<HTMLElement | null>;
  /** Scroll target (defaults to container) */
  scrollTarget?: MaybeAccessor<HTMLElement | null>;
  /** Callback on scroll events */
  onScroll?: () => void;
  /** Callback when scrolling ends (after idle timeout) */
  onScrollEnd?: () => void;
  /** Whether scroll handling is enabled */
  enabled?: MaybeAccessor<boolean>;
  /** Timestamp of last programmatic scroll (events within 100ms ignored) */
  programmaticScrollTimestamp?: Accessor<number>;
}

/** Hook return type */
interface UseGalleryScrollReturn {
  isScrolling: Accessor<boolean>;
  lastScrollTime: Accessor<number>;
}

/** Idle timeout after scroll ends (ms) */
const SCROLL_IDLE_TIMEOUT = 250;

/** Window to ignore programmatic scroll events (ms) */
const PROGRAMMATIC_SCROLL_WINDOW = 100;

/** Listener context prefix used for managed EventManager entries */
const LISTENER_CONTEXT_PREFIX = 'useGalleryScroll';

export function useGalleryScroll({
  container,
  scrollTarget,
  onScroll,
  onScrollEnd,
  enabled = true,
  programmaticScrollTimestamp,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const containerAccessor = toAccessor(container);
  const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
  const enabledAccessor = toAccessor(enabled);
  const programmaticTimestampAccessor = toAccessor(programmaticScrollTimestamp ?? 0);

  // Access gallery open state via galleryState
  const isGalleryOpen = createMemo(() => galleryState.value.isOpen);

  const [isScrolling, setIsScrolling] = createSignal(false);
  const [lastScrollTime, setLastScrollTime] = createSignal(0);
  let scrollIdleTimerId: number | null = null;

  const clearScrollIdleTimer = (): void => {
    if (scrollIdleTimerId !== null) {
      globalTimerManager.clearTimeout(scrollIdleTimerId);
      scrollIdleTimerId = null;
    }
  };

  const markScrolling = (): void => {
    setIsScrolling(true);
    setLastScrollTime(Date.now());
  };

  const scheduleScrollEnd = (): void => {
    clearScrollIdleTimer();
    scrollIdleTimerId = globalTimerManager.setTimeout(() => {
      setIsScrolling(false);
      if (__DEV__) {
        logger.debug('useGalleryScroll: Scroll ended');
      }
      onScrollEnd?.();
    }, SCROLL_IDLE_TIMEOUT);
  };

  const shouldIgnoreScroll = (): boolean =>
    Date.now() - programmaticTimestampAccessor() < PROGRAMMATIC_SCROLL_WINDOW;

  /**
   * Check if wheel event originated from toolbar or its panels
   * Toolbar scroll should not trigger gallery scroll state
   */
  const isToolbarScroll = (event: WheelEvent): boolean => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return false;

    // Check for toolbar-related data attributes
    return Boolean(
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
    onScroll?.();
    scheduleScrollEnd();
  };

  const handleScroll = (): void => {
    if (!isGalleryOpen() || shouldIgnoreScroll()) return;
    markScrolling();
    onScroll?.();
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
      const id = eventManager.addListener(
        eventTarget,
        type,
        handler,
        { passive: true },
        listenerContext
      );
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
  });

  onCleanup(clearScrollIdleTimer);

  return { isScrolling, lastScrollTime };
}
