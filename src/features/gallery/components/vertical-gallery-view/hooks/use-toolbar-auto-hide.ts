/** @fileoverview Toolbar auto-hide with configurable delay. */

import { getTypedSettingOr } from '@shared/container/container';
import type { Accessor, Setter } from 'solid-js';
import { createEffect, createSignal, onCleanup } from 'solid-js';

interface UseToolbarAutoHideOptions {
  readonly isVisible: () => boolean;
  readonly hasItems: () => boolean;
}

interface UseToolbarAutoHideResult {
  readonly isInitialToolbarVisible: Accessor<boolean>;
  readonly setIsInitialToolbarVisible: Setter<boolean>;
}

export function useToolbarAutoHide(options: UseToolbarAutoHideOptions): UseToolbarAutoHideResult {
  const { isVisible, hasItems } = options;

  const computeInitialVisibility = (): boolean => !!(isVisible() && hasItems());
  const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal<boolean>(
    computeInitialVisibility()
  );
  const [activeTimer, setActiveTimer] = createSignal<number | null>(null);

  const clearActiveTimer = (): void => {
    const timer = activeTimer();
    if (timer === null) return;
    clearTimeout(timer);
    setActiveTimer(null);
  };

  createEffect(() => {
    onCleanup(clearActiveTimer);

    if (!computeInitialVisibility()) {
      setIsInitialToolbarVisible(false);
      return;
    }

    setIsInitialToolbarVisible(true);

    const rawAutoHideDelay = getTypedSettingOr('toolbar.autoHideDelay', 3000);
    const autoHideDelay = Math.max(0, typeof rawAutoHideDelay === 'number' ? rawAutoHideDelay : 0);

    if (autoHideDelay === 0) {
      setIsInitialToolbarVisible(false);
      return;
    }

    setActiveTimer(
      setTimeout(() => {
        setIsInitialToolbarVisible(false);
        setActiveTimer(null);
      }, autoHideDelay)
    );
  });

  return { isInitialToolbarVisible, setIsInitialToolbarVisible };
}
