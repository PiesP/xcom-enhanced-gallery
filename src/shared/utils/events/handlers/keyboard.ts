/**
 * @fileoverview Keyboard event handler
 * PC-only policy: Handles keyboard events only
 * Supported keys: Space (play/pause), arrow keys (navigation), M (mute)
 */

import { logger } from '@shared/logging';
import {
  gallerySignals,
  navigateNext,
  navigatePrevious,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import type { EventHandlers, GalleryEventOptions } from '@shared/utils/events/core/event-context';
import {
  shouldExecutePlayPauseKey,
  shouldExecuteVideoControlKey,
} from '@shared/utils/events/keyboard-debounce';
import { executeVideoControl } from './video-control-helper';

/**
 * Check if gallery is open
 */
function checkGalleryOpen(): boolean {
  return gallerySignals.isOpen.value;
}

/**
 * Handle keyboard events
 * Space: play/pause, arrow keys: navigation, M: mute
 */
export function handleKeyboardEvent(
  event: KeyboardEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): void {
  if (!options.enableKeyboard) return;

  try {
    // When gallery is open, prevent default scroll on navigation keys to avoid conflicts
    if (checkGalleryOpen()) {
      const key = event.key;
      const isNavKey =
        key === 'Home' ||
        key === 'End' ||
        key === 'PageDown' ||
        key === 'PageUp' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === ' ' ||
        key === 'Space';

      // Video control keys: Space(play/pause), ArrowUp/Down(volume), M/m(mute)
      const isVideoKey =
        key === ' ' ||
        key === 'Space' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown' ||
        key === 'm' ||
        key === 'M';

      if (isNavKey || isVideoKey) {
        // Prevent default scroll/page transitions
        event.preventDefault();
        event.stopPropagation();

        switch (key) {
          case ' ':
          case 'Space':
            // Keyboard debounce: Prevent duplicate play/pause calls on repeated Space input (150ms interval)
            if (shouldExecutePlayPauseKey(event.key)) {
              executeVideoControl('togglePlayPause');
            }
            break;
          case 'ArrowLeft':
            navigatePrevious('keyboard');
            break;
          case 'ArrowRight':
            navigateNext('keyboard');
            break;
          case 'Home':
            navigateToItem(0, 'keyboard');
            break;
          case 'End': {
            const lastIndex = Math.max(0, gallerySignals.mediaItems.value.length - 1);
            navigateToItem(lastIndex, 'keyboard');
            break;
          }
          case 'PageDown': {
            // Page Down: +5 items
            navigateToItem(
              Math.min(
                gallerySignals.mediaItems.value.length - 1,
                gallerySignals.currentIndex.value + 5
              ),
              'keyboard'
            );
            break;
          }
          case 'PageUp': {
            // Page Up: -5 items
            navigateToItem(Math.max(0, gallerySignals.currentIndex.value - 5), 'keyboard');
            break;
          }
          case 'ArrowUp':
            // Keyboard debounce: Prevent excessive volume control on repeated ArrowUp input (100ms interval)
            if (shouldExecuteVideoControlKey(event.key)) {
              executeVideoControl('volumeUp');
            }
            break;
          case 'ArrowDown':
            // Keyboard debounce: Prevent excessive volume control on repeated ArrowDown input (100ms interval)
            if (shouldExecuteVideoControlKey(event.key)) {
              executeVideoControl('volumeDown');
            }
            break;
          case 'm':
          case 'M':
            // Keyboard debounce: Prevent duplicate mute toggle calls on repeated M key input (100ms interval)
            if (shouldExecuteVideoControlKey(event.key)) {
              executeVideoControl('toggleMute');
            }
            break;
        }

        // Delegate to custom handler
        if (handlers.onKeyboardEvent) {
          handlers.onKeyboardEvent(event);
        }
        return;
      }
    }

    // Close gallery on ESC key
    if (event.key === 'Escape' && checkGalleryOpen()) {
      handlers.onGalleryClose();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Call custom keyboard handler
    if (handlers.onKeyboardEvent) {
      handlers.onKeyboardEvent(event);
    }
  } catch (error) {
    logger.error('Error handling keyboard event:', error);
  }
}
