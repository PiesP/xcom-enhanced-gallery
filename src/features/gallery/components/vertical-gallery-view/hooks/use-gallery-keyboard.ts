/**
 * @fileoverview Escape key handler for gallery overlay close.
 * Respects editable form fields (INPUT, TEXTAREA, contenteditable).
 */

import { EventManager } from '@shared/services/event-manager';
import { createEffect, onCleanup } from 'solid-js';

interface UseGalleryKeyboardOptions {
  readonly onClose: () => void;
}

function isEditableTarget(target: EventTarget | null | undefined): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!element.isContentEditable;
}

export function useGalleryKeyboard({ onClose }: UseGalleryKeyboardOptions): void {
  createEffect(() => {
    const handleKeyDown = (event: Event): void => {
      const keyboardEvent = event as KeyboardEvent;
      if (isEditableTarget(keyboardEvent.target)) return;

      if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        onClose();
      }
    };

    const eventManager = EventManager.getInstance();
    const listenerId = eventManager.addEventListener(document, 'keydown', handleKeyDown, {
      capture: true,
      context: 'gallery-keyboard-navigation',
    });

    onCleanup(() => {
      if (listenerId) {
        eventManager.removeListener(listenerId);
      }
    });
  });
}
