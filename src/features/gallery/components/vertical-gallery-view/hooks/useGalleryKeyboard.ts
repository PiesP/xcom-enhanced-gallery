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

import { getSolid } from '@shared/external/vendors';
import { EventManager } from '@shared/services';

/**
 * Gallery keyboard event options
 * @interface UseGalleryKeyboardOptions
 */
export interface UseGalleryKeyboardOptions {
  /**
   * Callback triggered when Escape key is pressed
   */
  onClose: () => void;
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
export function useGalleryKeyboard({ onClose }: UseGalleryKeyboardOptions): void {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const isEditableTarget = (target: EventTarget | null | undefined): boolean => {
      const element = target as HTMLElement | null;
      if (!element) {
        return false;
      }

      const tag = element.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return true;
      }

      return Boolean(element.isContentEditable);
    };

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;

      if (isEditableTarget(keyboardEvent.target)) {
        return;
      }

      let handled = false;

      if (keyboardEvent.key === 'Escape') {
        onClose();
        handled = true;
      }

      if (handled) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
      }
    };

    const eventManager = EventManager.getInstance();
    const listenerId = eventManager.addListener(
      document,
      'keydown',
      handleKeyDown,
      { capture: true },
      'gallery-keyboard-navigation'
    );

    onCleanup(() => {
      if (listenerId) {
        eventManager.removeListener(listenerId);
      }
    });
  });
}
