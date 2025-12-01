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

import { isGalleryInternalEvent } from '@/shared/dom/utils';
import { createEffect, createSignal, onCleanup } from '@/shared/external/vendors/solid-hooks';
import { logger } from '@/shared/logging';
import { EventManager } from '@/shared/services/event-manager';
import type { GalleryState } from '@/shared/state/signals/gallery.signals';
import { galleryState } from '@/shared/state/signals/gallery.signals';
import { useSelector } from '@/shared/state/signals/signal-selector';
import { toAccessor } from '@/shared/utils/solid/solid-helpers';
import { globalTimerManager } from '@/shared/utils/time/timer-management';

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

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
export interface UseGalleryScrollReturn {
  isScrolling: Accessor<boolean>;
  lastScrollTime: Accessor<number>;
}

/** Idle timeout after scroll ends (ms) */
export const SCROLL_IDLE_TIMEOUT = 250;

/** Window to ignore programmatic scroll events (ms) */
const PROGRAMMATIC_SCROLL_WINDOW = 100;

/**
 * Track scroll state for focus tracking integration.
 * Does NOT trigger auto-scroll - tracking only.
 */
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

  const isGalleryOpen = useSelector<GalleryState, boolean>(galleryState, state => state.isOpen, {
    dependencies: state => [state.isOpen],
  });

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
      logger.debug('useGalleryScroll: Scroll ended');
      onScrollEnd?.();
    }, SCROLL_IDLE_TIMEOUT);
  };

  const shouldIgnoreScroll = (): boolean =>
    Date.now() - programmaticTimestampAccessor() < PROGRAMMATIC_SCROLL_WINDOW;

  const handleWheel = (event: WheelEvent): void => {
    if (!isGalleryOpen() || !isGalleryInternalEvent(event)) return;
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
    const listenerContext = `useGalleryScroll:${Date.now().toString(36)}:${Math.random()
      .toString(36)
      .slice(2)}`;

    const registerListener = (type: string, handler: EventListener): string =>
      eventManager.addListener(eventTarget, type, handler, { passive: true }, listenerContext);

    registerListener('wheel', handleWheel as EventListener);
    registerListener('scroll', handleScroll as EventListener);

    logger.debug('useGalleryScroll: Listeners registered');

    onCleanup(() => {
      eventManager.removeByContext(listenerContext);
      clearScrollIdleTimer();
      setIsScrolling(false);
    });
  });

  onCleanup(clearScrollIdleTimer);

  return { isScrolling, lastScrollTime };
}
