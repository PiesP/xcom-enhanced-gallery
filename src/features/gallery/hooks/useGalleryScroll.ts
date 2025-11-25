/**
 * @fileoverview Gallery Scroll Management Hook
 * @description Manages scroll state and events for the gallery.
 * Detects user scroll activity (wheel, scrollbar drag) and tracks scroll direction.
 *
 * Key responsibilities:
 * - Track scroll state (isScrolling, direction, lastScrollTime)
 * - Handle wheel and scroll events on gallery container
 * - Filter out programmatic scroll events (auto-scroll)
 * - Provide scroll callbacks for focus tracking integration
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

/** Configuration options for useGalleryScroll */
interface UseGalleryScrollOptions {
  /** Gallery container element reference */
  container: HTMLElement | null | Accessor<HTMLElement | null>;
  /** Actual scroll target (defaults to container) */
  scrollTarget?: HTMLElement | null | Accessor<HTMLElement | null>;
  /** Callback fired on scroll with delta and target element */
  onScroll?: (delta: number, target: HTMLElement | null) => void;
  /** Whether scroll handling is enabled */
  enabled?: MaybeAccessor<boolean>;
  /** Whether to track scroll direction */
  enableScrollDirection?: MaybeAccessor<boolean>;
  /** Callback when scroll direction changes */
  onScrollDirectionChange?: (direction: ScrollDirection) => void;
  /** Timestamp of last programmatic scroll (events within 100ms are ignored) */
  programmaticScrollTimestamp?: Accessor<number>;
}

/** Return type for useGalleryScroll */
export interface UseGalleryScrollReturn {
  /** Timestamp of last scroll activity */
  lastScrollTime: Accessor<number>;
  /** Whether currently scrolling */
  isScrolling: Accessor<boolean>;
  /** Current scroll direction */
  scrollDirection: Accessor<ScrollDirection>;
  /** Full scroll state snapshot */
  state: Accessor<ScrollState>;
}

/**
 * Time to wait after last scroll event before marking scroll as ended (ms).
 * 250ms provides good balance between responsiveness and stability.
 */
export const SCROLL_IDLE_TIMEOUT = 250;

/** Window to ignore scroll events after programmatic scroll (ms) */
const PROGRAMMATIC_SCROLL_WINDOW = 100;

/** Extract deltaY from wheel event */
const extractWheelDelta = (event: WheelEvent): number => event.deltaY ?? 0;

/**
 * Hook for managing gallery scroll state and events.
 * Provides scroll tracking without triggering auto-scroll.
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

  /** Clear scroll idle timeout */
  const clearScrollIdleTimer = (): void => {
    if (scrollIdleTimerId !== null) {
      globalTimerManager.clearTimeout(scrollIdleTimerId);
      scrollIdleTimerId = null;
    }
  };

  /** Clear direction idle timeout */
  const clearDirectionIdleTimer = (): void => {
    if (directionIdleTimerId !== null) {
      globalTimerManager.clearTimeout(directionIdleTimerId);
      directionIdleTimerId = null;
    }
  };

  /** Update scroll state with new values */
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

  /** Update scroll direction based on delta */
  const updateScrollDirection = (delta: number): void => {
    if (!enableScrollDirectionAccessor()) {
      return;
    }

    const newDirection: ScrollDirection = delta > 0 ? 'down' : 'up';
    const currentDirection = scrollState().direction;

    if (currentDirection !== newDirection) {
      setScrollState(prev => ({ ...prev, direction: newDirection }));
      onScrollDirectionChange?.(newDirection);
      logger.debug('useGalleryScroll: Direction changed', { direction: newDirection });
    }

    // Reset direction to idle after timeout
    clearDirectionIdleTimer();
    directionIdleTimerId = globalTimerManager.setTimeout(() => {
      if (scrollState().direction !== 'idle') {
        setScrollState(prev => ({ ...prev, direction: 'idle' }));
        onScrollDirectionChange?.('idle');
      }
    }, SCROLL_IDLE_TIMEOUT);
  };

  /** Schedule scroll end detection */
  const scheduleScrollEnd = (): void => {
    clearScrollIdleTimer();
    scrollIdleTimerId = globalTimerManager.setTimeout(() => {
      updateScrollState(false);
      logger.debug('useGalleryScroll: Scroll ended');
    }, SCROLL_IDLE_TIMEOUT);
  };

  /** Check if scroll event should be ignored (programmatic scroll) */
  const shouldIgnoreScroll = (): boolean => {
    const lastProgrammatic = programmaticTimestampAccessor();
    return Date.now() - lastProgrammatic < PROGRAMMATIC_SCROLL_WINDOW;
  };

  /** Handle wheel events on gallery */
  const handleWheel = (event: WheelEvent): void => {
    if (!isGalleryOpen() || !isGalleryInternalEvent(event)) {
      return;
    }

    const delta = extractWheelDelta(event);
    const targetElement = scrollTargetAccessor();

    updateScrollState(true, delta);
    updateScrollDirection(delta);
    onScroll?.(delta, targetElement);
    scheduleScrollEnd();
  };

  /** Handle scroll events (scrollbar drag, etc.) */
  const handleScroll = (): void => {
    if (!isGalleryOpen() || shouldIgnoreScroll()) {
      return;
    }

    updateScrollState(true);
    scheduleScrollEnd();
  };

  // Setup event listeners
  createEffect(() => {
    const isEnabled = enabledAccessor();
    const containerElement = containerAccessor();
    const scrollElement = scrollTargetAccessor();
    const eventTarget = scrollElement ?? containerElement;

    if (!isEnabled || !eventTarget) {
      // Reset state when disabled
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
