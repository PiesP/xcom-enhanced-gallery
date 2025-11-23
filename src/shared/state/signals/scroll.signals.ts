/**
 * Scroll state types and constants
 * ScrollState signal is created locally in useGalleryScroll hook, not globally.
 */

export type ScrollDirection = "up" | "down" | "idle";

export interface ScrollState {
  isScrolling: boolean;
  lastScrollTime: number;
  direction: ScrollDirection;
  lastDelta: number;
}

export const INITIAL_SCROLL_STATE: ScrollState = {
  isScrolling: false,
  lastScrollTime: 0,
  direction: "idle",
  lastDelta: 0,
};
