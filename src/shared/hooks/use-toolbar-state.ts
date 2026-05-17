/**
 * @fileoverview Toolbar state management hook with download debouncing
 */

import type { ToolbarActions, ToolbarState } from '@shared/types/toolbar.types';
import { createSignal, onCleanup } from 'solid-js';

const DOWNLOAD_MIN_DISPLAY_TIME = 300;

export function useToolbarState(): [ToolbarState, ToolbarActions] {
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);
  const [lastDownloadToggle, setLastDownloadToggle] = createSignal(0);
  const [downloadTimeoutRef, setDownloadTimeoutRef] = createSignal<number | null>(null);

  const clearDownloadTimeout = (): void => {
    const timer = downloadTimeoutRef();
    if (timer !== null) {
      clearTimeout(timer);
      setDownloadTimeoutRef(null);
    }
  };

  const setDownloading = (downloading: boolean): void => {
    const now = performance.now();

    if (downloading) {
      setLastDownloadToggle(now);
      clearDownloadTimeout();
      setIsDownloading(true);
      setHasError(false);
      return;
    }

    const timeSinceStart = now - lastDownloadToggle();

    if (timeSinceStart < DOWNLOAD_MIN_DISPLAY_TIME) {
      clearDownloadTimeout();
      setDownloadTimeoutRef(
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadTimeoutRef(null);
        }, DOWNLOAD_MIN_DISPLAY_TIME - timeSinceStart)
      );
      return;
    }

    setIsDownloading(false);
  };

  const setLoading = (loading: boolean): void => {
    setIsLoading(loading);
    if (loading) setHasError(false);
  };

  const setError = (errorState: boolean): void => {
    setHasError(errorState);
    if (errorState) {
      setIsLoading(false);
      setIsDownloading(false);
    }
  };

  const resetState = (): void => {
    clearDownloadTimeout();
    setLastDownloadToggle(0);
    setIsDownloading(false);
    setIsLoading(false);
    setHasError(false);
  };

  onCleanup(() => {
    clearDownloadTimeout();
  });

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
