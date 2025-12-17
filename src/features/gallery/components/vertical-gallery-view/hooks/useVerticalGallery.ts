/**
 * @fileoverview Composed hook for VerticalGalleryView
 * @description Combines multiple gallery hooks into a single unified interface.
 * This reduces hook call complexity and centralizes state management.
 *
 * **Consolidated hooks**:
 * - useToolbarAutoHide - Toolbar visibility management
 * - useGalleryScroll - Scroll state tracking
 * - useGalleryItemScroll - Item scroll functions
 * - useGalleryNavigation - Navigation event handling
 * - useGalleryFocusTracker - Focus tracking
 * - useGalleryLifecycle - Lifecycle animations and cleanup
 * - useGalleryKeyboard - Keyboard event handling
 *
 * @module features/gallery/components/vertical-gallery-view/hooks/useVerticalGallery
 * @version 1.0.0
 */

import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';
import type { NavigationTrigger } from '@shared/state/signals/navigation.state';
import { type Accessor, createEffect } from 'solid-js';
import { useGalleryKeyboard } from './useGalleryKeyboard';
import { useGalleryLifecycle } from './useGalleryLifecycle';
import { useGalleryNavigation } from './useGalleryNavigation';
import { useToolbarAutoHide } from './useToolbarAutoHide';

/**
 * Options for the composed VerticalGallery hook
 */
export interface UseVerticalGalleryOptions {
  /** Whether gallery is visible (has media items) */
  readonly isVisible: Accessor<boolean>;
  /** Current gallery index */
  readonly currentIndex: Accessor<number>;
  /** Total media items count */
  readonly mediaItemsCount: Accessor<number>;
  /** Container element accessor */
  readonly containerEl: Accessor<HTMLDivElement | null>;
  /** Toolbar wrapper element accessor */
  readonly toolbarWrapperEl: Accessor<HTMLDivElement | null>;
  /** Items container element accessor */
  readonly itemsContainerEl: Accessor<HTMLDivElement | null>;
  /** Handler for closing the gallery */
  readonly onClose?: (() => void) | undefined;
}

/**
 * Scroll state and handlers
 */
export interface ScrollState {
  /** Whether user is currently scrolling */
  readonly isScrolling: Accessor<boolean>;
  /** Scroll to specific item by index */
  readonly scrollToItem: (index: number) => void;
  /** Scroll to current active item */
  readonly scrollToCurrentItem: () => void;
}

/**
 * Navigation state and handlers
 */
export interface NavigationState {
  /** Last navigation trigger type */
  readonly lastNavigationTrigger: Accessor<NavigationTrigger | null>;
  /** Set navigation trigger */
  readonly setLastNavigationTrigger: (trigger: NavigationTrigger | null) => void;
  /** Programmatic scroll timestamp */
  readonly programmaticScrollTimestamp: Accessor<number>;
  /** Set programmatic scroll timestamp */
  readonly setProgrammaticScrollTimestamp: (timestamp: number) => void;
}

/**
 * Focus tracking state and handlers
 */
export interface FocusState {
  /** Currently focused item index */
  readonly focusedIndex: Accessor<number | null>;
  /** Register item element for focus tracking */
  readonly registerItem: (index: number, element: HTMLElement | null) => void;
  /** Handle item focus event */
  readonly handleItemFocus: (index: number) => void;
  /** Force sync focus state */
  readonly forceSync: () => void;
}

/**
 * Toolbar visibility state
 */
export interface ToolbarState {
  /** Whether toolbar should be initially visible */
  readonly isInitialToolbarVisible: Accessor<boolean>;
  /** Set initial toolbar visibility */
  readonly setIsInitialToolbarVisible: (value: boolean) => void;
}

/**
 * Result of the composed VerticalGallery hook
 */
export interface UseVerticalGalleryResult {
  /** Scroll-related state and handlers */
  readonly scroll: ScrollState;
  /** Navigation-related state and handlers */
  readonly navigation: NavigationState;
  /** Focus-related state and handlers */
  readonly focus: FocusState;
  /** Toolbar visibility state */
  readonly toolbar: ToolbarState;
}

/**
 * Composed hook that combines all VerticalGalleryView hooks
 *
 * This hook encapsulates the complex inter-dependencies between gallery hooks:
 * - useGalleryScroll depends on navigationState.programmaticScrollTimestamp
 * - useGalleryItemScroll depends on isScrolling and navigationState.lastNavigationTrigger
 * - useGalleryNavigation depends on scrollToItem
 * - useGalleryFocusTracker depends on isScrolling and navigationState.lastNavigationTrigger
 *
 * By composing these hooks together, we:
 * 1. Reduce hook call count in the component from 7+ to 1
 * 2. Centralize state management and inter-hook communication
 * 3. Simplify the component's logic
 * 4. Make testing easier by mocking a single composed interface
 *
 * @param options - Hook configuration
 * @returns Composed state and handlers organized by domain
 */
export function useVerticalGallery(options: UseVerticalGalleryOptions): UseVerticalGalleryResult {
  const {
    isVisible,
    currentIndex,
    mediaItemsCount,
    containerEl,
    toolbarWrapperEl,
    itemsContainerEl,
    onClose,
  } = options;

  // Forward declaration for focus sync callback (breaks circular dependency)
  // A simple local variable is sufficient here because the callback is assigned once.
  let focusSyncCallback: (() => void) | null = null;

  // 1. Toolbar auto-hide
  const { isInitialToolbarVisible, setIsInitialToolbarVisible } = useToolbarAutoHide({
    isVisible,
    hasItems: () => mediaItemsCount() > 0,
  });

  // 2. Navigation state (needs to be declared before scroll for programmaticScrollTimestamp)
  //    But also needs scrollToItem... Use a forward reference pattern
  let scrollToItemRef: ((index: number) => void) | null = null;

  const navigationState = useGalleryNavigation({
    isVisible,
    scrollToItem: (index: number) => scrollToItemRef?.(index),
  });

  // 3. Scroll tracking
  const { isScrolling } = useGalleryScroll({
    container: containerEl,
    scrollTarget: itemsContainerEl,
    enabled: isVisible,
    programmaticScrollTimestamp: () => navigationState.programmaticScrollTimestamp(),
    onScrollEnd: () => focusSyncCallback?.(),
  });

  // 4. Item scroll handling
  const { scrollToItem, scrollToCurrentItem } = useGalleryItemScroll(
    containerEl,
    currentIndex,
    mediaItemsCount,
    {
      enabled: () => !isScrolling() && navigationState.lastNavigationTrigger() !== 'scroll',
      block: 'start',
      isScrolling,
      onScrollStart: () => navigationState.setProgrammaticScrollTimestamp(Date.now()),
    }
  );

  // Connect the forward reference
  scrollToItemRef = scrollToItem;

  // 5. Focus tracking
  const {
    focusedIndex,
    registerItem: registerFocusItem,
    handleItemFocus,
    forceSync: focusTrackerForceSync,
  } = useGalleryFocusTracker({
    container: containerEl,
    isEnabled: isVisible,
    isScrolling,
    lastNavigationTrigger: navigationState.lastNavigationTrigger,
  });

  // Register focus sync callback (stable function)
  focusSyncCallback = focusTrackerForceSync;

  // 6. Gallery lifecycle (animations, video cleanup, viewport CSS vars)
  useGalleryLifecycle({
    containerEl,
    toolbarWrapperEl,
    isVisible,
  });

  // 7. Hide toolbar when user scrolls
  createEffect(() => {
    if (isScrolling()) {
      setIsInitialToolbarVisible(false);
    }
  });

  // 8. Keyboard handling
  useGalleryKeyboard({
    onClose: onClose ?? (() => {}),
  });

  return {
    scroll: {
      isScrolling,
      scrollToItem,
      scrollToCurrentItem,
    },
    navigation: {
      lastNavigationTrigger: navigationState.lastNavigationTrigger,
      setLastNavigationTrigger: navigationState.setLastNavigationTrigger,
      programmaticScrollTimestamp: navigationState.programmaticScrollTimestamp,
      setProgrammaticScrollTimestamp: navigationState.setProgrammaticScrollTimestamp,
    },
    focus: {
      focusedIndex,
      registerItem: registerFocusItem,
      handleItemFocus,
      forceSync: focusTrackerForceSync,
    },
    toolbar: {
      isInitialToolbarVisible,
      setIsInitialToolbarVisible,
    },
  };
}
