/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Solid.js primitive for gallery scroll management
 * @description Provides stable scroll handling without relying on mouse movements
 */

import { createEffect, onCleanup } from 'solid-js';

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/EventManager';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { findTwitterScrollContainer } from '@shared/utils/core-utils';
import { globalTimerManager } from '@shared/utils/timer-management';

/**
 * Options for createGalleryScroll primitive
 */
export interface CreateGalleryScrollOptions {
  /** Gallery container reference */
  container: HTMLElement | null;
  /** Scroll callback function */
  onScroll?: (delta: number) => void;
  /** Enable scroll handling */
  enabled?: boolean;
  /** Block Twitter page scroll */
  blockTwitterScroll?: boolean;
  /** Enable scroll direction detection */
  enableScrollDirection?: boolean;
  /** Scroll direction change callback */
  onScrollDirectionChange?: (direction: 'up' | 'down' | 'idle') => void;
}

/**
 * Return value from createGalleryScroll primitive
 */
export interface CreateGalleryScrollReturn {
  /** Last scroll time accessor */
  lastScrollTime: () => number;
  /** Is scrolling accessor */
  isScrolling: () => boolean;
  /** Current scroll direction accessor (optional) */
  scrollDirection?: () => 'up' | 'down' | 'idle';
}

/**
 * Creates a Solid.js primitive for gallery scroll management
 *
 * @description
 * - Gallery open state based scroll detection (removes event.target dependency)
 * - Stable response to virtual scrolling and DOM rearrangement
 * - Prevents event conflicts with Twitter page
 * - Stable event listener management
 * - Prevents memory leaks
 *
 * @version 2.0.0 - Improved DOM rearrangement handling (converted to Solid primitive)
 *
 * @param options - Configuration options
 * @returns Reactive scroll state accessors
 */
export function createGalleryScroll({
  container,
  onScroll,
  enabled = true,
  blockTwitterScroll = true,
  enableScrollDirection = false,
  onScrollDirectionChange,
}: CreateGalleryScrollOptions): CreateGalleryScrollReturn {
  // State management with let variables (no refs)
  const eventManager = new EventManager();
  let isScrolling = false;
  let lastScrollTime = 0;
  let scrollTimeout: number | null = null;
  let scrollDirection: 'up' | 'down' | 'idle' = 'idle';
  let directionTimeout: number | null = null;

  // Constants
  const SCROLL_END_DELAY = 150;
  const DIRECTION_RESET_DELAY = 200;

  /**
   * Update scroll state
   */
  const updateScrollState = (time: number, scrolling: boolean) => {
    lastScrollTime = time;
    isScrolling = scrolling;
  };

  /**
   * Update scroll direction
   */
  const updateScrollDirection = (delta: number) => {
    if (!enableScrollDirection) return;

    const newDirection = delta > 0 ? 'down' : 'up';
    if (scrollDirection !== newDirection) {
      scrollDirection = newDirection;
      onScrollDirectionChange?.(scrollDirection);
      logger.debug(`[useGalleryScroll] Direction changed: ${scrollDirection}`);
    }

    // Reset direction to idle after delay
    if (directionTimeout !== null) {
      globalTimerManager.clearTimeout(directionTimeout);
    }
    directionTimeout = globalTimerManager.setTimeout(() => {
      scrollDirection = 'idle';
      onScrollDirectionChange?.('idle');
      directionTimeout = null;
    }, DIRECTION_RESET_DELAY);
  };

  /**
   * Handle scroll end
   */
  const handleScrollEnd = () => {
    if (scrollTimeout !== null) {
      globalTimerManager.clearTimeout(scrollTimeout);
    }
    scrollTimeout = globalTimerManager.setTimeout(() => {
      updateScrollState(Date.now(), false);
      scrollTimeout = null;
      logger.debug('[useGalleryScroll] Scroll ended');
    }, SCROLL_END_DELAY);
  };

  /**
   * Prevent Twitter page scroll
   */
  const preventTwitterScroll = (_e: WheelEvent) => {
    if (!blockTwitterScroll) return;

    const twitterScroller = findTwitterScrollContainer();
    if (!twitterScroller) return;

    // Disable Twitter scroller temporarily
    const originalOverflow = twitterScroller.style.overflow;
    const originalPointerEvents = twitterScroller.style.pointerEvents;

    twitterScroller.style.overflow = 'hidden';
    twitterScroller.style.pointerEvents = 'none';

    globalTimerManager.requestAnimationFrame(() => {
      twitterScroller.style.overflow = originalOverflow;
      twitterScroller.style.pointerEvents = originalPointerEvents;
    });
  };

  /**
   * Handle gallery wheel event
   */
  const handleGalleryWheel = (e: WheelEvent) => {
    // Direct signal access
    const isGalleryOpen = galleryState.value.isOpen;

    if (!isGalleryOpen || !enabled || !container) {
      return;
    }

    const delta = e.deltaY;

    // Prevent default scroll behavior
    e.preventDefault();
    e.stopPropagation();

    // Update scroll state
    const now = Date.now();
    updateScrollState(now, true);

    // Update direction if enabled
    updateScrollDirection(delta);

    // Handle scroll end
    handleScrollEnd();

    // Prevent Twitter page scroll
    preventTwitterScroll(e);

    // Call onScroll callback
    onScroll?.(delta);

    logger.debug(`[useGalleryScroll] Wheel: delta=${delta}, time=${now}`);
  };

  // Effect management with createEffect
  createEffect(() => {
    if (!enabled || !container) {
      logger.debug('[useGalleryScroll] Disabled or no container');
      return;
    }

    logger.debug('[useGalleryScroll] Setting up wheel listener');

    // Register event listener
    eventManager.addEventListener(container, 'wheel', handleGalleryWheel, {
      passive: false, // Must be non-passive to preventDefault
    });

    // Cleanup logic with onCleanup
    onCleanup(() => {
      logger.debug('[useGalleryScroll] Cleanup: removing listeners and timers');

      // Clear timers
      if (scrollTimeout !== null) {
        globalTimerManager.clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
      if (directionTimeout !== null) {
        globalTimerManager.clearTimeout(directionTimeout);
        directionTimeout = null;
      }

      // Cleanup event manager
      eventManager.cleanup();

      // Reset state
      isScrolling = false;
      scrollDirection = 'idle';
    });
  });

  // Return reactive accessors
  return {
    lastScrollTime: () => lastScrollTime,
    isScrolling: () => isScrolling,
    ...(enableScrollDirection && {
      scrollDirection: () => scrollDirection,
    }),
  };
}
