/**
 * @fileoverview Keyboard event handler
 * PC-only policy: Handles keyboard events only
 * Supported keys: Space (play/pause), arrow keys (navigation), M (mute)
 */

import { getLanguageService } from '@shared/container/service-accessors';
import { logger } from '@shared/logging/logger';
import { NotificationService } from '@shared/services/notification-service';
import {
  gallerySignals,
  navigateNext,
  navigatePrevious,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import type {
  EventHandlers,
  GalleryEventOptions,
} from '@shared/utils/events/core/dom-listener-context';
import { executeVideoControl } from '@shared/utils/events/handlers/video-control-helper';
import { shouldExecuteKeyboardAction } from '@shared/utils/events/keyboard-debounce';

/** Navigation and help keys that require preventDefault */
const NAVIGATION_KEYS = [
  'Home',
  'End',
  'PageDown',
  'PageUp',
  'ArrowLeft',
  'ArrowRight',
  '?',
] as const;

/** Video control keys (Space, volume, mute) */
const VIDEO_CONTROL_KEYS = ['ArrowUp', 'ArrowDown', 'm', 'M'] as const;

/**
 * Check if gallery is open
 */
function checkGalleryOpen(): boolean {
  return gallerySignals.isOpen.value;
}

/**
 * Check if key is a navigation or help key
 */
function isNavigationOrHelpKey(key: string): boolean {
  return NAVIGATION_KEYS.includes(key as never) || key === ' ' || key === 'Space';
}

/**
 * Check if key is a video control key
 */
function isVideoControlKey(key: string): boolean {
  return VIDEO_CONTROL_KEYS.includes(key as never) || key === ' ' || key === 'Space';
}

/**
 * Handle navigation key press
 */
function handleNavigationKey(key: string): void {
  switch (key) {
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
      navigateToItem(
        Math.min(gallerySignals.mediaItems.value.length - 1, gallerySignals.currentIndex.value + 5),
        'keyboard'
      );
      break;
    }
    case 'PageUp': {
      navigateToItem(Math.max(0, gallerySignals.currentIndex.value - 5), 'keyboard');
      break;
    }
  }
}

/**
 * Handle help key (?) - shows keyboard help
 */
function handleHelpKey(): void {
  // Keyboard debounce: Prevent notification spam when holding the key
  if (!shouldExecuteKeyboardAction('?', 500)) return;

  try {
    const languageService = getLanguageService();
    const title = languageService.translate('msg.kb.t');
    const text = [
      languageService.translate('msg.kb.prev'),
      languageService.translate('msg.kb.next'),
      languageService.translate('msg.kb.cls'),
      languageService.translate('msg.kb.toggle'),
    ].join('\n');

    void NotificationService.getInstance().show({
      title,
      text,
      timeout: 6000,
    });
  } catch {
    // Help UI must never break keyboard navigation
  }
}

/**
 * Handle video control key press
 */
function handleVideoControlKey(key: string): void {
  switch (key) {
    case ' ':
    case 'Space':
      // Keyboard debounce: Prevent duplicate play/pause calls on repeated Space input (150ms interval)
      if (shouldExecuteKeyboardAction('Space', 150)) {
        executeVideoControl('togglePlayPause');
      }
      break;
    case 'ArrowUp':
      // Keyboard debounce: Prevent excessive volume control on repeated input (100ms interval)
      if (shouldExecuteKeyboardAction('ArrowUp', 100)) {
        executeVideoControl('volumeUp');
      }
      break;
    case 'ArrowDown':
      // Keyboard debounce: Prevent excessive volume control on repeated input (100ms interval)
      if (shouldExecuteKeyboardAction('ArrowDown', 100)) {
        executeVideoControl('volumeDown');
      }
      break;
    case 'm':
    case 'M':
      // Keyboard debounce: Prevent duplicate mute toggle calls on repeated M key input (100ms interval)
      if (shouldExecuteKeyboardAction('M', 100)) {
        executeVideoControl('toggleMute');
      }
      break;
  }
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
    const key = event.key;

    // When gallery is open, handle special keys
    if (checkGalleryOpen()) {
      const isNavKey = isNavigationOrHelpKey(key);
      const isVideoKey = isVideoControlKey(key);

      if (isNavKey || isVideoKey) {
        // Prevent default scroll/page transitions
        event.preventDefault();
        event.stopPropagation();

        // Route to appropriate handler
        if (key === '?') {
          handleHelpKey();
        } else if (isNavKey) {
          handleNavigationKey(key);
        } else {
          handleVideoControlKey(key);
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
    if (__DEV__) {
      logger.error('Error handling keyboard event:', error);
    }
  }
}
