/**
 * @fileoverview Composed hook for VerticalGalleryView component
 * @description Combines multiple gallery hooks into a single unified interface
 * @module features/gallery/components/vertical-gallery-view/hooks/useVerticalGallery
 *
 * This composition hook reduces hook call complexity and centralizes state management
 * by combining the following specialized hooks:
 *
 * - useToolbarAutoHide - Manages toolbar visibility with auto-hide timer
 * - useGalleryScroll - Tracks scroll state and programmatic scroll timing
 * - useGalleryItemScroll - Provides scroll-to-item functionality
 * - useGalleryNavigation - Handles navigation state and triggers
 * - useGalleryFocusTracker - Tracks focused item for keyboard navigation
 * - useGalleryLifecycle - Manages animations, cleanup, and CSS variables
 * - useGalleryKeyboard - Handles keyboard events (Escape, etc.)
 */

import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';
import type { NavigationTrigger } from '@shared/state/signals/navigation.state';
import type { Accessor } from 'solid-js';
import { createEffect } from 'solid-js';
import { useGalleryKeyboard } from './useGalleryKeyboard';
import { useGalleryLifecycle } from './useGalleryLifecycle';
import { useGalleryNavigation } from './useGalleryNavigation';
import { useToolbarAutoHide } from './useToolbarAutoHide';

/**
 * Configuration options for the composed VerticalGallery hook
 *
 * @property isVisible - Accessor indicating whether the gallery is currently visible
 * @property currentIndex - Accessor for the current active media item index
 * @property mediaItemsCount - Accessor for the total number of media items
 * @property containerEl - Accessor for the main gallery container element
 * @property toolbarWrapperEl - Accessor for the toolbar wrapper element
 * @property itemsContainerEl - Accessor for the scrollable items container element
 * @property onClose - Optional callback invoked when the gallery should close
 */
interface UseVerticalGalleryOptions {
  /** Whether gallery is currently visible */
  readonly isVisible: Accessor<boolean>;
  /** Current active media item index */
  readonly currentIndex: Accessor<number>;
  /** Total number of media items in the gallery */
  readonly mediaItemsCount: Accessor<number>;
  /** Main gallery container element */
  readonly containerEl: Accessor<HTMLDivElement | null>;
  /** Toolbar wrapper element for toolbar positioning */
  readonly toolbarWrapperEl: Accessor<HTMLDivElement | null>;
  /** Scrollable items container element */
  readonly itemsContainerEl: Accessor<HTMLDivElement | null>;
  /** Callback invoked when gallery should close (e.g., Escape key) */
  readonly onClose?: (() => void) | undefined;
}

/**
 * Scroll state and handlers for gallery scrolling behavior
 *
 * @property isScrolling - Accessor that returns true when user is actively scrolling
 * @property scrollToItem - Function to scroll to a specific item by index
 * @property scrollToCurrentItem - Function to scroll to the currently active item
 */
interface ScrollState {
  /** Whether user is currently scrolling */
  readonly isScrolling: Accessor<boolean>;
  /** Scroll to specific item by zero-based index */
  readonly scrollToItem: (index: number) => void;
  /** Scroll to the current active item */
  readonly scrollToCurrentItem: () => void;
}

/**
 * Navigation state and handlers for tracking navigation triggers
 *
 * @property lastNavigationTrigger - Accessor for the most recent navigation trigger type
 * @property setLastNavigationTrigger - Function to update the navigation trigger
 * @property programmaticScrollTimestamp - Accessor for programmatic scroll timing
 * @property setProgrammaticScrollTimestamp - Function to update programmatic scroll timestamp
 */
interface NavigationState {
  /** Last navigation trigger type (keyboard, scroll, etc.) */
  readonly lastNavigationTrigger: Accessor<NavigationTrigger | null>;
  /** Set the navigation trigger type */
  readonly setLastNavigationTrigger: (trigger: NavigationTrigger | null) => void;
  /** Timestamp of the last programmatic scroll */
  readonly programmaticScrollTimestamp: Accessor<number>;
  /** Set the programmatic scroll timestamp */
  readonly setProgrammaticScrollTimestamp: (timestamp: number) => void;
}

/**
 * Focus tracking state and handlers for keyboard navigation
 *
 * @property focusedIndex - Accessor for the currently focused item index (null if none)
 * @property registerItem - Function to register an item element for focus tracking
 * @property handleItemFocus - Function to handle focus events on items
 * @property forceSync - Function to force synchronization of focus state
 */
interface FocusState {
  /** Currently focused item index (null if no item focused) */
  readonly focusedIndex: Accessor<number | null>;
  /** Register item element for focus tracking by index */
  readonly registerItem: (index: number, element: HTMLElement | null) => void;
  /** Handle focus event on an item */
  readonly handleItemFocus: (index: number) => void;
  /** Force synchronization of focus state */
  readonly forceSync: () => void;
}

/**
 * Toolbar visibility state and controls
 *
 * @property isInitialToolbarVisible - Accessor for toolbar visibility state
 * @property setIsInitialToolbarVisible - Function to control toolbar visibility
 */
interface ToolbarState {
  /** Whether toolbar should be initially visible */
  readonly isInitialToolbarVisible: Accessor<boolean>;
  /** Set initial toolbar visibility state */
  readonly setIsInitialToolbarVisible: (value: boolean) => void;
}

/**
 * Return value of the composed VerticalGallery hook
 *
 * Organizes all gallery functionality into logical domain groups for easier
 * consumption and clearer intent at call sites.
 *
 * @property scroll - Scroll-related state and handlers
 * @property navigation - Navigation-related state and handlers
 * @property focus - Focus-related state and handlers for keyboard navigation
 * @property toolbar - Toolbar visibility state and controls
 */
interface UseVerticalGalleryResult {
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
 * Composed hook that combines all VerticalGalleryView sub-hooks into a unified interface
 *
 * This composition hook encapsulates the complex inter-dependencies between gallery hooks:
 *
 * **Dependencies:**
 * - useGalleryScroll depends on navigationState.programmaticScrollTimestamp
 * - useGalleryItemScroll depends on isScrolling and navigationState.lastNavigationTrigger
 * - useGalleryNavigation depends on scrollToItem function
 * - useGalleryFocusTracker depends on isScrolling and navigationState.lastNavigationTrigger
 *
 * **Benefits of composition:**
 * 1. Reduces hook call count in component from 7+ individual hooks to 1 composed hook
 * 2. Centralizes state management and inter-hook communication
 * 3. Simplifies component logic by providing organized domain-specific interfaces
 * 4. Improves testability by allowing single mock point for all gallery behavior
 * 5. Manages circular dependencies through forward references
 *
 * **Hook execution order:**
 * 1. Toolbar auto-hide initialization
 * 2. Navigation state setup (with forward reference to scrollToItem)
 * 3. Scroll tracking with programmatic scroll detection
 * 4. Item scroll handling with conditional enabling
 * 5. Focus tracking with scroll awareness
 * 6. Lifecycle management (animations, cleanup, CSS variables)
 * 7. Effect for hiding toolbar on scroll
 * 8. Keyboard event handling
 *
 * @param options - Hook configuration with element refs and state accessors
 * @returns Composed state and handlers organized by functional domain
 *
 * @example
 * ```typescript
 * const gallery = useVerticalGallery({
 *   isVisible: () => isOpen(),
 *   currentIndex: () => activeIndex(),
 *   mediaItemsCount: () => items().length,
 *   containerEl: () => containerRef(),
 *   toolbarWrapperEl: () => toolbarRef(),
 *   itemsContainerEl: () => itemsRef(),
 *   onClose: handleClose,
 * });
 *
 * // Access organized functionality
 * gallery.scroll.scrollToItem(5);
 * gallery.focus.handleItemFocus(3);
 * gallery.toolbar.setIsInitialToolbarVisible(true);
 * ```
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

  // Forward declaration for focus sync callback to break circular dependency
  // This pattern allows useGalleryScroll to call focus sync without direct coupling
  let focusSyncCallback: (() => void) | null = null;

  // 1. Toolbar auto-hide - Manages initial visibility and auto-hide timer
  const { isInitialToolbarVisible, setIsInitialToolbarVisible } = useToolbarAutoHide({
    isVisible,
    hasItems: () => mediaItemsCount() > 0,
  });

  // 2. Navigation state - Forward reference pattern to handle circular dependency
  //    Navigation needs scrollToItem, but scrollToItem needs navigation state
  let scrollToItemRef: ((index: number) => void) | null = null;

  const navigationState = useGalleryNavigation({
    isVisible,
    scrollToItem: (index: number): void => scrollToItemRef?.(index),
  });

  // 3. Scroll tracking - Detects user scrolling and programmatic scroll timing
  const { isScrolling } = useGalleryScroll({
    container: containerEl,
    scrollTarget: itemsContainerEl,
    enabled: isVisible,
    programmaticScrollTimestamp: () => navigationState.programmaticScrollTimestamp(),
    onScrollEnd: (): void => focusSyncCallback?.(),
  });

  // 4. Item scroll handling - Provides scroll-to-item functionality
  const { scrollToItem, scrollToCurrentItem } = useGalleryItemScroll(
    containerEl,
    currentIndex,
    mediaItemsCount,
    {
      enabled: () => !isScrolling() && navigationState.lastNavigationTrigger() !== 'scroll',
      block: 'start',
      isScrolling,
      onScrollStart: (): void => navigationState.setProgrammaticScrollTimestamp(Date.now()),
    }
  );

  // Connect forward reference now that scrollToItem is available
  scrollToItemRef = scrollToItem;

  // 5. Focus tracking - Tracks focused item for keyboard navigation
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

  // Register focus sync callback (stable function reference)
  focusSyncCallback = focusTrackerForceSync;

  // 6. Gallery lifecycle - Manages animations, video cleanup, and CSS viewport variables
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

  // 8. Keyboard handling - Escape key to close gallery
  useGalleryKeyboard({
    onClose: onClose ?? ((): void => {}),
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
