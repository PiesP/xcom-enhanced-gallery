// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Toolbar auto-hide with configurable delay. */

import { getTypedSettingOr } from '@shared/container/settings-registry';
import { createTimeout } from '@shared/hooks/use-timer';
import type { Accessor, Setter } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';

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
  const timer = createTimeout();

  createEffect(() => {
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

    timer.set(() => {
      setIsInitialToolbarVisible(false);
    }, autoHideDelay);
  });

  return { isInitialToolbarVisible, setIsInitialToolbarVisible };
}
