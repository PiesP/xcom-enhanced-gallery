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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      let handled = false;

      if (event.key === 'Escape') {
        onClose();
        handled = true;
      } else if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        onOpenHelp?.();
        handled = true;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown, true);
    });
  });
}
