/**
 * @fileoverview Fit mode state hook — manages image fit mode signal,
 * persistence to settings, and fit mode toggle handlers.
 */

import { getTypedSettingOr, setTypedSetting } from '@shared/container/container';
import { logger } from '@shared/logging/logger';
import { navigateToItem } from '@shared/state/signals/gallery.signals';
import type { ImageFitMode } from '@shared/types/settings.types';
import { createSignal } from 'solid-js';

/**
 * Parameters for useGalleryFitMode hook
 */
interface UseGalleryFitModeOptions {
  /** Scroll the container to the current active item */
  readonly scrollToCurrentItem: () => void;
  /** Current active media index (used for auto-focus after fit mode change) */
  readonly currentIndex: () => number;
}

/**
 * Return value for useGalleryFitMode hook
 */
interface UseGalleryFitModeResult {
  /** Current image fit mode signal */
  readonly imageFitMode: () => ImageFitMode;
  /** Switch to original size fit mode */
  readonly handleFitOriginal: (event?: Event) => void;
  /** Switch to fit-width mode */
  readonly handleFitWidth: (event?: Event) => void;
  /** Switch to fit-height mode */
  readonly handleFitHeight: (event?: Event) => void;
  /** Switch to container-fit mode */
  readonly handleFitContainer: (event?: Event) => void;
}

/**
 * Manages image fit mode state with persistence to gallery settings.
 * Provides toggle handlers for each fit mode: original, fitWidth,
 * fitHeight, and fitContainer.
 *
 * @param options - Hook configuration with scroll handler and index accessor
 * @returns Fit mode signal and toggle handler functions
 */
export function useGalleryFitMode(options: UseGalleryFitModeOptions): UseGalleryFitModeResult {
  const { scrollToCurrentItem, currentIndex } = options;

  const getInitialFitMode = (): ImageFitMode => {
    return getTypedSettingOr('gallery.imageFitMode', 'fitWidth');
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

  const persistFitMode = (mode: ImageFitMode): Promise<void> =>
    setTypedSetting('gallery.imageFitMode', mode).catch((error) => {
      if (__DEV__) {
        logger.warn('Failed to save fit mode', { error, mode });
      }
    });

  const applyFitMode = (mode: ImageFitMode, event?: Event): void => {
    event?.preventDefault();
    event?.stopPropagation();
    setImageFitMode(mode);
    void persistFitMode(mode);
    scrollToCurrentItem();
    navigateToItem(currentIndex(), 'auto-focus');
  };

  const handleFitOriginal = (event?: Event) => applyFitMode('original', event);
  const handleFitWidth = (event?: Event) => applyFitMode('fitWidth', event);
  const handleFitHeight = (event?: Event) => applyFitMode('fitHeight', event);
  const handleFitContainer = (event?: Event) => applyFitMode('fitContainer', event);

  return {
    imageFitMode,
    handleFitOriginal,
    handleFitWidth,
    handleFitHeight,
    handleFitContainer,
  };
}
