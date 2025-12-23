/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Keyboard Event Hook
 * @description Manages keyboard navigation for the gallery view (Escape to close)
 * @module features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard
 *
 * **Responsibilities**:
 * - Subscribe to keyboard events (Escape)
 * - Execute callbacks (onClose)
 * - Clean up subscriptions on component unmount
 *
 * **API**:
 * - {@link UseGalleryKeyboardOptions} for configuration
 * - No return value (side-effect hook)
 *
 * @version 1.1.0 - Path optimization (Phase 354+)
 */

import { EventManager } from '@shared/services/event-manager';
import { createEffect, onCleanup } from 'solid-js';

/**
 * Gallery keyboard event options
 * @interface UseGalleryKeyboardOptions
 */
interface UseGalleryKeyboardOptions {
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
 * - Auto-cleanup on component unmount
 *
 * **Usage**:
 * ```tsx
 * useGalleryKeyboard({
 *   onClose: () => setGalleryVisible(false),
 * });
 * ```
 *
 * @param options - Configuration options
 */
export function useGalleryKeyboard({ onClose }: UseGalleryKeyboardOptions): void {
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

      return !!element.isContentEditable;
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
