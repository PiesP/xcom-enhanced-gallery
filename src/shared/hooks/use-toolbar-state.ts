// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Toolbar state management hook with download debouncing
 */

import { DOWNLOAD_MIN_DISPLAY_TIME_MS } from '@constants/performance';
import { createTimeout } from '@shared/hooks/use-timer';
import type { ToolbarActions, ToolbarState } from '@shared/types/toolbar.types';
import { batch, createSignal } from 'solid-js';

export function useToolbarState(): [ToolbarState, ToolbarActions] {
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);
  const [lastDownloadToggle, setLastDownloadToggle] = createSignal(0);
  const timer = createTimeout();

  const setDownloading = (downloading: boolean): void => {
    const now = performance.now();

    if (downloading) {
      batch(() => {
        setLastDownloadToggle(now);
        timer.clear();
        setIsDownloading(true);
        setHasError(false);
      });
      return;
    }

    const timeSinceStart = now - lastDownloadToggle();

    if (timeSinceStart < DOWNLOAD_MIN_DISPLAY_TIME_MS) {
      timer.set(() => {
        setIsDownloading(false);
      }, DOWNLOAD_MIN_DISPLAY_TIME_MS - timeSinceStart);
      return;
    }

    setIsDownloading(false);
  };

  const setLoading = (loading: boolean): void => {
    setIsLoading(loading);
    if (loading) setHasError(false);
  };

  const setError = (errorState: boolean): void => {
    batch(() => {
      setHasError(errorState);
      if (errorState) {
        setIsLoading(false);
        setIsDownloading(false);
      }
    });
  };

  const resetState = (): void => {
    timer.clear();
    batch(() => {
      setLastDownloadToggle(0);
      setIsDownloading(false);
      setIsLoading(false);
      setHasError(false);
    });
  };

  const actions: ToolbarActions = {
    setDownloading,
    setLoading,
    setError,
    resetState,
  };

  return [
    {
      isDownloading,
      isLoading,
      hasError,
    },
    actions,
  ];
}
