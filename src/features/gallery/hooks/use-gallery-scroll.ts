// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Tracks user scroll activity and reports scroll state for focus tracking.
 */

import { PROGRAMMATIC_SCROLL_WINDOW_MS, SCROLL_IDLE_TIMEOUT_MS } from '@constants/performance';
import { isGalleryInternalElement } from '@shared/dom/utils';
import { createTimeout } from '@shared/hooks/use-timer';
import { logger } from '@shared/logging/logger';
import { getEventManager } from '@shared/services/event-manager';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { createPrefixedId } from '@shared/utils/id';
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
  /** Callback when displacement ends, or bounded wheel input has no displacement */
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

/** Bounds wheel activity when no scroll position changes and scrollend cannot fire. */
const WHEEL_IDLE_TIMEOUT = SCROLL_IDLE_TIMEOUT_MS;

/** Window to ignore programmatic scroll events (ms) */
const PROGRAMMATIC_SCROLL_WINDOW = PROGRAMMATIC_SCROLL_WINDOW_MS;

/** Listener context prefix used for managed EventManager entries */
const LISTENER_CONTEXT_PREFIX = 'useGalleryScroll';

/**
 * Hook for tracking user scroll activity on the gallery container.
 *
 * Uses native scrollend for displaced scrolling. A short timer owns only
 * wheel activity that cannot produce scrollend at a scroll boundary.
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
  const wheelIdleTimer = createTimeout();
  let wheelAwaitingMovement = false;
  let userScrollObserved = false;

  const markScrolling = (): void => {
    setIsScrolling(true);
    setLastScrollTime(performance.now());
  };

  const settleScroll = (): void => {
    wheelIdleTimer.clear();
    wheelAwaitingMovement = false;
    userScrollObserved = false;
    setIsScrolling(false);
    if (__DEV__) {
      logger.debug('useGalleryScroll: Scroll ended');
    }
    onScrollEnd?.();
  };

  const shouldIgnoreScroll = (): boolean => {
    const programmaticAt = programmaticTimestampAccessor();
    return programmaticAt > 0 && performance.now() - programmaticAt < PROGRAMMATIC_SCROLL_WINDOW;
  };

  /**
   * Check if wheel event originated from toolbar or its panels
   * Toolbar scroll should not trigger gallery scroll state
   */
  const isToolbarScroll = (event: WheelEvent): boolean => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    // Check for toolbar-related data attributes
    return !!(
      target.closest('[data-gallery-element="toolbar"]') ||
      target.closest('[data-gallery-element="settings-panel"]') ||
      target.closest('[data-gallery-element="tweet-panel"]') ||
      target.closest('[data-role="toolbar"]')
    );
  };

  const handleWheel = (event: WheelEvent): void => {
    if (!isGalleryOpen()) {
      return;
    }

    // Check if the event originated from a gallery-internal element.
    // Uses composedPath() for robustness with Shadow DOM and nested components.
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    const isInternal =
      Array.isArray(path) &&
      path.some((el) => el instanceof HTMLElement && isGalleryInternalElement(el));
    if (!isInternal) {
      return;
    }

    // Ignore wheel events from toolbar and its panels
    if (isToolbarScroll(event)) {
      return;
    }

    markScrolling();
    if (userScrollObserved) {
      // A displaced scroll already has a native completion event. Boundary
      // wheel input must not replace that ownership with an idle deadline.
      return;
    }
    wheelAwaitingMovement = true;
    wheelIdleTimer.set(() => {
      if (wheelAwaitingMovement) {
        settleScroll();
      }
    }, WHEEL_IDLE_TIMEOUT);
  };

  const handleScroll = (): void => {
    if (!isGalleryOpen() || (shouldIgnoreScroll() && !wheelAwaitingMovement)) {
      return;
    }
    wheelAwaitingMovement = false;
    wheelIdleTimer.clear();
    userScrollObserved = true;
    markScrolling();
  };

  const handleScrollEnd = (): void => {
    if (isGalleryOpen() && userScrollObserved) {
      settleScroll();
    }
  };

  createEffect(() => {
    const isEnabled = enabledAccessor();
    const containerElement = containerAccessor();
    const scrollElement = scrollTargetAccessor();
    const eventTarget = scrollElement ?? containerElement;

    if (!isEnabled || !eventTarget) {
      setIsScrolling(false);
      wheelIdleTimer.clear();
      wheelAwaitingMovement = false;
      userScrollObserved = false;
      return;
    }

    const eventManager = getEventManager();
    const listenerContext = createPrefixedId(LISTENER_CONTEXT_PREFIX, ':');

    const registerListener = (type: string, handler: EventListener): void => {
      eventManager.addEventListener(eventTarget, type, handler, {
        passive: true,
        context: listenerContext,
      });
    };

    registerListener('wheel', handleWheel as EventListener);
    registerListener('scroll', handleScroll as EventListener);
    registerListener('scrollend', handleScrollEnd as EventListener);

    if (__DEV__) {
      logger.debug('useGalleryScroll: Listeners registered', { context: listenerContext });
    }

    onCleanup(() => {
      eventManager.removeByContext(listenerContext);
      wheelIdleTimer.clear();
      wheelAwaitingMovement = false;
      userScrollObserved = false;
      setIsScrolling(false);
    });

    // wheelIdleTimer auto-cleans up via createTimeout's onCleanup.
  });

  return { isScrolling, lastScrollTime };
}
