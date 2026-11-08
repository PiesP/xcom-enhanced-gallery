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
  /** Callback when displacement ends, or bounded scroll input has no displacement */
  readonly onScrollEnd?: () => void;
  /** Whether scroll handling is enabled */
  readonly enabled?: MaybeAccessor<boolean>;
  /** Timestamp used to recognize the start of a programmatic scroll sequence */
  readonly programmaticScrollTimestamp?: Accessor<number>;
}

/** Return type for useGalleryScroll. */
interface UseGalleryScrollReturn {
  readonly isScrolling: Accessor<boolean>;
  readonly lastScrollTime: Accessor<number>;
  /** Explicit navigation supersedes earlier user scroll activity. */
  readonly beginProgrammaticScroll: () => void;
  /** Gallery-background wheel is redirected before reaching the scrollport. */
  readonly claimRedirectedWheel: () => void;
}

/** Bounds user input when no scroll position changes and scrollend cannot fire. */
const INPUT_IDLE_TIMEOUT = SCROLL_IDLE_TIMEOUT_MS;

/** Window to recognize the first event in a programmatic scroll sequence. */
const PROGRAMMATIC_SCROLL_WINDOW = PROGRAMMATIC_SCROLL_WINDOW_MS;

/** Listener context prefix used for managed EventManager entries */
const LISTENER_CONTEXT_PREFIX = 'useGalleryScroll';

/**
 * Hook for tracking user scroll activity on the gallery container.
 *
 * Uses native scrollend for displaced scrolling. A short timer owns only
 * input without displacement, for which no scrollend is emitted.
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
  const inputIdleTimer = createTimeout();
  let inputAwaitingMovement = false;
  let userScrollObserved = false;
  let programmaticScrollActive = false;

  const markScrolling = (): void => {
    setIsScrolling(true);
    setLastScrollTime(performance.now());
  };

  const settleScroll = (): void => {
    inputIdleTimer.clear();
    inputAwaitingMovement = false;
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

  const claimScrollInput = (): void => {
    markScrolling();
    programmaticScrollActive = false;
    if (userScrollObserved) {
      // A displaced scroll already has a native completion event. Boundary
      // input must not replace that ownership with an idle deadline.
      return;
    }
    inputAwaitingMovement = true;
    inputIdleTimer.set(() => {
      if (inputAwaitingMovement) {
        settleScroll();
      }
    }, INPUT_IDLE_TIMEOUT);
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
    if (!isInternal || isToolbarScroll(event)) {
      return;
    }
    claimScrollInput();
  };

  const handlePointerDown = (event: PointerEvent, scrollElement: HTMLElement): void => {
    if (
      !isGalleryOpen() ||
      event.target !== scrollElement ||
      !event.isPrimary ||
      event.pointerType !== 'mouse' ||
      event.button !== 0 ||
      scrollElement.scrollHeight <= scrollElement.clientHeight
    ) {
      return;
    }

    // A native scrollbar press targets the scrollport itself. Detect its real
    // vertical gutter, excluding borders, content, and nested native controls.
    const rect = scrollElement.getBoundingClientRect();
    const scale = rect.width / scrollElement.offsetWidth;
    if (
      !Number.isFinite(scale) ||
      scale <= 0 ||
      event.clientY < rect.top + scrollElement.clientTop * scale ||
      event.clientY >= rect.top + (scrollElement.clientTop + scrollElement.clientHeight) * scale
    ) {
      return;
    }
    const style = getComputedStyle(scrollElement);
    const innerLeft = rect.left + parseFloat(style.borderLeftWidth) * scale;
    const innerRight = rect.right - parseFloat(style.borderRightWidth) * scale;
    const contentLeft = rect.left + scrollElement.clientLeft * scale;
    const contentRight = contentLeft + scrollElement.clientWidth * scale;
    const inLeftGutter = event.clientX >= innerLeft && event.clientX < contentLeft;
    const inRightGutter = event.clientX >= contentRight && event.clientX < innerRight;
    if (!inLeftGutter && !inRightGutter) {
      return;
    }

    const interruptingProgrammaticScroll = programmaticScrollActive || shouldIgnoreScroll();
    claimScrollInput();
    if (interruptingProgrammaticScroll) {
      // A native drag can arrive while smooth scrolling is still active. Stop
      // that animation before it can overwrite the position selected by drag.
      scrollElement.scrollTo({
        left: scrollElement.scrollLeft,
        top: scrollElement.scrollTop,
        behavior: 'instant',
      });
    }
  };

  const beginProgrammaticScroll = (): void => {
    inputIdleTimer.clear();
    inputAwaitingMovement = false;
    userScrollObserved = false;
    programmaticScrollActive = false;
    setIsScrolling(false);
  };

  const handleScroll = (): void => {
    if (!isGalleryOpen()) {
      return;
    }
    if (
      !inputAwaitingMovement &&
      !userScrollObserved &&
      (programmaticScrollActive || shouldIgnoreScroll())
    ) {
      // Smooth programmatic scrolling can outlive the timestamp window.
      // Its native completion, or later user input, releases this ownership.
      programmaticScrollActive = true;
      return;
    }
    inputAwaitingMovement = false;
    inputIdleTimer.clear();
    userScrollObserved = true;
    markScrolling();
  };

  const handleScrollEnd = (): void => {
    if (programmaticScrollActive) {
      programmaticScrollActive = false;
      return;
    }
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
      inputIdleTimer.clear();
      inputAwaitingMovement = false;
      userScrollObserved = false;
      programmaticScrollActive = false;
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
    registerListener('pointerdown', ((event: PointerEvent) =>
      handlePointerDown(event, eventTarget)) as EventListener);
    registerListener('scroll', handleScroll as EventListener);
    registerListener('scrollend', handleScrollEnd as EventListener);

    if (__DEV__) {
      logger.debug('useGalleryScroll: Listeners registered', { context: listenerContext });
    }

    onCleanup(() => {
      eventManager.removeByContext(listenerContext);
      inputIdleTimer.clear();
      inputAwaitingMovement = false;
      userScrollObserved = false;
      programmaticScrollActive = false;
      setIsScrolling(false);
    });

    // inputIdleTimer auto-cleans up via createTimeout's onCleanup.
  });

  return {
    isScrolling,
    lastScrollTime,
    beginProgrammaticScroll,
    claimRedirectedWheel: () => {
      if (isGalleryOpen()) {
        claimScrollInput();
      }
    },
  };
}
