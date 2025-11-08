/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Keyboard Event Hook
 * @description Manages keyboard navigation for gallery view (Esc key to close, Help overlay toggle)
 * @module features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard
 *
 * **Responsibilities**:
 * - Subscribe to keyboard events (Escape, Help)
 * - Execute callbacks (onClose, onOpenHelp)
 * - Clean up subscriptions on component unmount
 *
 * **API**:
 * - {@link UseGalleryKeyboardOptions} for configuration
 * - No return value (side-effect hook)
 *
 * @version 1.1.0 - Path optimization (Phase 354+)
 */

import { logger } from '@shared/logging';
import { getSolid } from '@shared/external/vendors';
import { keyboardNavigator } from '@shared/services/input/keyboard-navigator';

/**
 * Gallery keyboard event options
 * @interface UseGalleryKeyboardOptions
 */
export interface UseGalleryKeyboardOptions {
  /**
   * Callback triggered when Escape key is pressed
   */
  onClose: () => void;

  /**
   * Callback triggered when Help key is pressed (Shift+? or ?)
   * Only active within gallery context
   */
  onOpenHelp?: () => void;
}

/**
 * Custom hook for gallery keyboard navigation
 *
 * **Features**:
 * - Handles Escape key (close gallery)
 * - Handles Help key (show keyboard shortcuts overlay)
 * - Auto-cleanup on component unmount
 *
 * **Usage**:
 * ```tsx
 * useGalleryKeyboard({
 *   onClose: () => setGalleryVisible(false),
 *   onOpenHelp: () => setHelpVisible(true),
 * });
 * ```
 *
 * @param options - Configuration options
 */
export function useGalleryKeyboard({ onClose, onOpenHelp }: UseGalleryKeyboardOptions): void {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
    const unsubscribe = keyboardNavigator.subscribe(
      {
        onEscape: () => {
          logger.debug('Gallery: Esc key pressed, closing gallery');
          onClose();
        },
        onHelp: () => {
          logger.debug('Gallery: Help key pressed, opening help overlay');
          onOpenHelp?.();
        },
      },
      { context: 'use-gallery-keyboard', capture: true }
    );

    onCleanup(() => {
      logger.debug('Gallery keyboard hook: cleanup');
      unsubscribe();
    });
  });
}
