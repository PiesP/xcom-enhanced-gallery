/**
 * @fileoverview Composed hook combining all gallery functionality into a single interface
 *
 * Integrates toolbar auto-hide, scroll state, navigation, focus tracking, lifecycle, and keyboard handling.
 */

import { useGalleryFocusTracker } from '@features/gallery/hooks/use-gallery-focus-tracker';
import { useGalleryItemScroll } from '@features/gallery/hooks/use-gallery-item-scroll';
import { useGalleryScroll } from '@features/gallery/hooks/use-gallery-scroll';
import type { NavigationTrigger } from '@shared/state/signals/navigation.state';
import type { Accessor } from 'solid-js';
import { createEffect } from 'solid-js';
import { useGalleryKeyboard } from './use-gallery-keyboard';
import { useGalleryLifecycle } from './use-gallery-lifecycle';
import { useGalleryNavigation } from './use-gallery-navigation';
import { useToolbarAutoHide } from './use-toolbar-auto-hide';

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
 */
interface ToolbarState {
  /** Whether toolbar should be initially visible */
  readonly isInitialToolbarVisible: Accessor<boolean>;
  /** Set initial toolbar visibility state */
  readonly setIsInitialToolbarVisible: (value: boolean) => void;
}

/**
 * Return value of the composed VerticalGallery hook
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
 * Composed hook combining all gallery sub-hooks into a unified interface
 *
 * Manages dependencies between toolbar, navigation, scroll, focus, lifecycle, and keyboard hooks.
 *
 * @param options - Hook configuration with element refs and state accessors
 * @returns Composed state and handlers organized by functional domain
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
