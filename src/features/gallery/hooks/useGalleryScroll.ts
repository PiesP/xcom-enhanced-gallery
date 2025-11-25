/**
 * @fileoverview Gallery Scroll Management Hook
 * @description Tracks scroll state and events for focus tracking integration.
 * Detects user scroll activity (wheel, scrollbar drag) and filters programmatic scrolls.
 *
 * Key behaviors:
 * - Tracks isScrolling, direction, lastScrollTime
 * - Handles wheel and scroll events on gallery container
 * - Ignores programmatic scroll events (within 100ms window)
 * - Does NOT trigger auto-scroll
 */

import { isGalleryInternalEvent } from '@shared/dom/utils';
import { getSolid } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import type { GalleryState } from '@shared/state/signals/gallery.signals';
import { galleryState } from '@shared/state/signals/gallery.signals';
import type { ScrollDirection, ScrollState } from '@shared/state/signals/scroll.signals';
import { INITIAL_SCROLL_STATE } from '@shared/state/signals/scroll.signals';
import { useSelector } from '@shared/state/signals/signal-selector';
import { toAccessor } from '@shared/utils/solid/solid-helpers';
import { globalTimerManager } from '@shared/utils/time/timer-management';

const { createSignal, createEffect, batch, onCleanup } = getSolid();

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

/** Hook configuration */
interface UseGalleryScrollOptions {
  /** Gallery container element */
  container: HTMLElement | null | Accessor<HTMLElement | null>;
  /** Scroll target (defaults to container) */
  scrollTarget?: HTMLElement | null | Accessor<HTMLElement | null>;
  /** Callback on scroll with delta and target */
  onScroll?: (delta: number, target: HTMLElement | null) => void;
  /** Whether scroll handling is enabled */
  enabled?: MaybeAccessor<boolean>;
  /** Whether to track scroll direction */
  enableScrollDirection?: MaybeAccessor<boolean>;
  /** Callback on direction change */
  onScrollDirectionChange?: (direction: ScrollDirection) => void;
  /** Timestamp of last programmatic scroll (events within 100ms ignored) */
  programmaticScrollTimestamp?: Accessor<number>;
}

/** Hook return type */
export interface UseGalleryScrollReturn {
  lastScrollTime: Accessor<number>;
  isScrolling: Accessor<boolean>;
  scrollDirection: Accessor<ScrollDirection>;
  state: Accessor<ScrollState>;
}

/** Idle timeout after scroll ends (ms) */
export const SCROLL_IDLE_TIMEOUT = 250;

/** Window to ignore programmatic scroll events (ms) */
const PROGRAMMATIC_SCROLL_WINDOW = 100;

/**
 * Track scroll state and events for focus tracking integration.
 * Does NOT trigger auto-scroll - tracking only.
 */
export function useGalleryScroll({
  container,
  scrollTarget,
  onScroll,
  enabled = true,
  enableScrollDirection = false,
  onScrollDirectionChange,
  programmaticScrollTimestamp,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const containerAccessor = toAccessor(container);
  const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
  const enabledAccessor = toAccessor(enabled);
  const enableScrollDirectionAccessor = toAccessor(enableScrollDirection);
  const programmaticTimestampAccessor = toAccessor(programmaticScrollTimestamp ?? 0);

  const isGalleryOpen = useSelector<GalleryState, boolean>(galleryState, state => state.isOpen, {
    dependencies: state => [state.isOpen],
  });

  const [scrollState, setScrollState] = createSignal<ScrollState>(INITIAL_SCROLL_STATE);

  let scrollIdleTimerId: number | null = null;
  let directionIdleTimerId: number | null = null;

  const clearScrollIdleTimer = (): void => {
    if (scrollIdleTimerId !== null) {
      globalTimerManager.clearTimeout(scrollIdleTimerId);
      scrollIdleTimerId = null;
    }
  };

  const clearDirectionIdleTimer = (): void => {
    if (directionIdleTimerId !== null) {
      globalTimerManager.clearTimeout(directionIdleTimerId);
      directionIdleTimerId = null;
    }
  };

  const updateScrollState = (isScrolling: boolean, delta?: number): void => {
    batch(() => {
      setScrollState(prev => ({
        ...prev,
        isScrolling,
        lastScrollTime: isScrolling ? Date.now() : prev.lastScrollTime,
        lastDelta: delta ?? prev.lastDelta,
      }));
    });
  };

  const updateScrollDirection = (delta: number): void => {
    if (!enableScrollDirectionAccessor()) return;

    const newDirection: ScrollDirection = delta > 0 ? 'down' : 'up';
    if (scrollState().direction !== newDirection) {
      setScrollState(prev => ({ ...prev, direction: newDirection }));
      onScrollDirectionChange?.(newDirection);
      logger.debug('useGalleryScroll: Direction changed', { direction: newDirection });
    }

    clearDirectionIdleTimer();
    directionIdleTimerId = globalTimerManager.setTimeout(() => {
      if (scrollState().direction !== 'idle') {
        setScrollState(prev => ({ ...prev, direction: 'idle' }));
        onScrollDirectionChange?.('idle');
      }
    }, SCROLL_IDLE_TIMEOUT);
  };

  const scheduleScrollEnd = (): void => {
    clearScrollIdleTimer();
    scrollIdleTimerId = globalTimerManager.setTimeout(() => {
      updateScrollState(false);
      logger.debug('useGalleryScroll: Scroll ended');
    }, SCROLL_IDLE_TIMEOUT);
  };

  const shouldIgnoreScroll = (): boolean =>
    Date.now() - programmaticTimestampAccessor() < PROGRAMMATIC_SCROLL_WINDOW;

  const handleWheel = (event: WheelEvent): void => {
    if (!isGalleryOpen() || !isGalleryInternalEvent(event)) return;

    const delta = event.deltaY ?? 0;
    updateScrollState(true, delta);
    updateScrollDirection(delta);
    onScroll?.(delta, scrollTargetAccessor());
    scheduleScrollEnd();
  };

  const handleScroll = (): void => {
    if (!isGalleryOpen() || shouldIgnoreScroll()) return;
    updateScrollState(true);
    scheduleScrollEnd();
  };

  createEffect(() => {
    const isEnabled = enabledAccessor();
    const containerElement = containerAccessor();
    const scrollElement = scrollTargetAccessor();
    const eventTarget = scrollElement ?? containerElement;

    if (!isEnabled || !eventTarget) {
      updateScrollState(false);
      clearScrollIdleTimer();
      clearDirectionIdleTimer();
      setScrollState(prev => ({ ...prev, direction: 'idle' }));
      return;
    }

    const eventManager = new EventManager();
    eventManager.addEventListener(eventTarget, 'wheel', handleWheel, { passive: true });
    eventManager.addEventListener(eventTarget, 'scroll', handleScroll, { passive: true });

    logger.debug('useGalleryScroll: Listeners registered', {
      hasContainer: !!containerElement,
      hasScrollTarget: !!scrollElement,
    });

    onCleanup(() => {
      eventManager.cleanup();
      clearScrollIdleTimer();
      clearDirectionIdleTimer();
      setScrollState(() => INITIAL_SCROLL_STATE);
    });
  });

  onCleanup(() => {
    clearScrollIdleTimer();
    clearDirectionIdleTimer();
  });

  return {
    lastScrollTime: () => scrollState().lastScrollTime,
    isScrolling: () => scrollState().isScrolling,
    scrollDirection: () => scrollState().direction,
    state: () => scrollState(),
  };
}
