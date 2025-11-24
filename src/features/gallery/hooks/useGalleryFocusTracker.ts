import { FocusCoordinator } from "@features/gallery/logic/focus-coordinator";
import { getSolid } from "@shared/external/vendors";
import {
  navigateToItem,
  setFocusedIndex,
} from "@shared/state/signals/gallery.signals";
import { toAccessor } from "@shared/utils/solid/solid-helpers";
import type { Accessor } from "solid-js";

type MaybeAccessor<T> = T | Accessor<T>;

type FocusNavigationTrigger =
  | "button"
  | "click"
  | "keyboard"
  | "init"
  | "scroll";

export interface UseGalleryFocusTrackerOptions {
  container: MaybeAccessor<HTMLElement | null>;
  isEnabled: MaybeAccessor<boolean>;
  getCurrentIndex: Accessor<number>;
  isScrolling?: MaybeAccessor<boolean>;
  threshold?: number | number[];
  rootMargin?: string;
  minimumVisibleRatio?: number;
  shouldAutoFocus?: MaybeAccessor<boolean>;
  autoFocusDebounce?: MaybeAccessor<number>;
}

export interface UseGalleryFocusTrackerReturn {
  focusedIndex: Accessor<number | null>;
  registerItem: (index: number, element: HTMLElement | null) => void;
  handleItemFocus: (index: number) => void;
  handleItemBlur: (index: number) => void;
  forceSync: () => void;
  setManualFocus: (index: number | null) => void;
  applyFocusAfterNavigation: (
    index: number,
    trigger: FocusNavigationTrigger,
    options?: { force?: boolean },
  ) => void;
}

const solid = getSolid();
const { createSignal, onCleanup, batch } = solid;

export function useGalleryFocusTracker(
  options: UseGalleryFocusTrackerOptions,
): UseGalleryFocusTrackerReturn {
  const [focusedIndex, setLocalFocusedIndex] = createSignal<number | null>(
    null,
  );
  const [manualFocusIndex, setManualFocusIndex] = createSignal<number | null>(
    null,
  );

  const isEnabled = toAccessor(options.isEnabled);
  const container = toAccessor(options.container);
  const autoFocusDebounce = toAccessor(options.autoFocusDebounce ?? 50);

  const coordinator = new FocusCoordinator({
    isEnabled: () => isEnabled() && manualFocusIndex() === null,
    container,
    threshold: options.threshold ?? 0,
    rootMargin: options.rootMargin ?? "0px",
    ...(options.minimumVisibleRatio !== undefined
      ? { minimumVisibleRatio: options.minimumVisibleRatio }
      : {}),
    debounceTime: autoFocusDebounce(),
    onFocusChange: (index, source) => {
      if (source === "auto" && manualFocusIndex() === null) {
        batch(() => {
          setLocalFocusedIndex(index);
          if (index !== null) {
            navigateToItem(index, "scroll", "auto-focus");
          }
        });
      }
    },
  });

  onCleanup(() => coordinator.cleanup());

  const registerItem = (index: number, element: HTMLElement | null) => {
    coordinator.registerItem(index, element);
  };

  const handleItemFocus = (index: number) => {
    setManualFocusIndex(index);
    setLocalFocusedIndex(index);
    setFocusedIndex(index);
  };

  const handleItemBlur = (index: number) => {
    if (manualFocusIndex() === index) {
      setManualFocusIndex(null);
    }
  };

  const setManualFocus = (index: number | null) => {
    setManualFocusIndex(index);
    if (index !== null) {
      setLocalFocusedIndex(index);
      setFocusedIndex(index);
    }
  };

  const applyFocusAfterNavigation = (
    index: number,
    _trigger: FocusNavigationTrigger,
    _opts?: { force?: boolean },
  ) => {
    setManualFocus(index);
  };

  const forceSync = () => {
    coordinator.recompute();
  };

  return {
    focusedIndex,
    registerItem,
    handleItemFocus,
    handleItemBlur,
    forceSync,
    setManualFocus,
    applyFocusAfterNavigation,
  };
}
