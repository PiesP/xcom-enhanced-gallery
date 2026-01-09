/**
 * @fileoverview Keyboard event handler for gallery navigation and video control
 * PC-only policy: Handles keyboard events only
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

/** Navigation and help keys: Home, End, PageUp/Down, Arrows, ? */
const NAVIGATION_KEYS = new Set([
  'Home',
  'End',
  'PageDown',
  'PageUp',
  'ArrowLeft',
  'ArrowRight',
  '?',
]);
/** Video control keys: ArrowUp/Down, M (mute) */
const VIDEO_CONTROL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'm', 'M']);

/**
 * Handles keyboard events for gallery navigation and video control.
 * Routes keys to appropriate handlers based on gallery state.
 *
 * @param event - KeyboardEvent to process
 * @param handlers - Callbacks for custom handlers
 * @param options - Configuration options
 */
export function handleKeyboardEvent(
  event: KeyboardEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): void {
  if (!options.enableKeyboard) return;

  try {
    const key = event.key;
    const isGalleryOpen = gallerySignals.isOpen.value;

    // ESC closes gallery regardless of other state
    if (key === 'Escape' && isGalleryOpen) {
      handlers.onGalleryClose();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!isGalleryOpen) {
      // Pass to custom handler if gallery is closed
      handlers.onKeyboardEvent?.(event);
      return;
    }

    const isNavKey = NAVIGATION_KEYS.has(key) || key === ' ' || key === 'Space';
    const isVideoKey = VIDEO_CONTROL_KEYS.has(key) || key === ' ' || key === 'Space';

    if (!isNavKey && !isVideoKey) {
      handlers.onKeyboardEvent?.(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (key === '?') {
      showKeyboardHelp();
    } else if (NAVIGATION_KEYS.has(key) || key === ' ' || key === 'Space') {
      handleNavigation(key);
    } else {
      handleVideoControl(key);
    }

    handlers.onKeyboardEvent?.(event);
  } catch (error) {
    if (__DEV__) {
      logger.error('Keyboard event handler error:', error);
    }
  }
}

/**
 * Handles navigation keys (arrows, Home, End, PageUp/Down).
 * @internal
 */
function handleNavigation(key: string): void {
  const current = gallerySignals.currentIndex.value;
  const total = gallerySignals.mediaItems.value.length;

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
    case 'End':
      navigateToItem(Math.max(0, total - 1), 'keyboard');
      break;
    case 'PageUp':
      navigateToItem(Math.max(0, current - 5), 'keyboard');
      break;
    case 'PageDown':
      navigateToItem(Math.min(total - 1, current + 5), 'keyboard');
      break;
  }
}

/**
 * Handles video control keys (Space, Arrow Up/Down, M).
 * @internal
 */
function handleVideoControl(key: string): void {
  switch (key) {
    case ' ':
    case 'Space':
      if (shouldExecuteKeyboardAction('Space', 150)) {
        executeVideoControl('togglePlayPause');
      }
      break;
    case 'ArrowUp':
      if (shouldExecuteKeyboardAction('ArrowUp', 100)) {
        executeVideoControl('volumeUp');
      }
      break;
    case 'ArrowDown':
      if (shouldExecuteKeyboardAction('ArrowDown', 100)) {
        executeVideoControl('volumeDown');
      }
      break;
    case 'm':
    case 'M':
      if (shouldExecuteKeyboardAction('M', 100)) {
        executeVideoControl('toggleMute');
      }
      break;
  }
}

/**
 * Shows keyboard help notification with debouncing to prevent spam.
 * @internal
 */
function showKeyboardHelp(): void {
  if (!shouldExecuteKeyboardAction('?', 500)) return;

  try {
    const lang = getLanguageService();
    void NotificationService.getInstance().show({
      title: lang.translate('msg.kb.t'),
      text: [
        lang.translate('msg.kb.prev'),
        lang.translate('msg.kb.next'),
        lang.translate('msg.kb.cls'),
        lang.translate('msg.kb.toggle'),
      ].join('\n'),
      timeout: 6000,
    });
  } catch {
    // Notification failure must not break keyboard navigation
  }
}
