// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Keyboard event handler for gallery navigation and video control
 * PC-only policy: Handles keyboard events only
 */

import { getNotificationAdapter } from '@platform/index';
import { getLanguageService } from '@shared/services/language-service';
import { logger } from '@shared/logging/logger';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import {
  gallerySignals,
  navigateNext,
  navigatePrevious,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';

import { executeVideoControl } from '@shared/utils/events/handlers/video-control-helper';

// ============================================================================
// Keyboard Debounce State (closure-encapsulated to avoid module-level mutable state)
// ============================================================================

interface KeyboardDebounceState {
  readonly lastExecutionTime: number;
  readonly lastKey: string;
}

function createKeyboardDebouncer() {
  let state: KeyboardDebounceState = {
    lastExecutionTime: 0,
    lastKey: '',
  };
  let disposed = false;

  function shouldExecute(key: string, minIntervalMs: number): boolean {
    if (disposed) return false;
    const now = performance.now();
    const timeSinceLastExecution = now - state.lastExecutionTime;

    if (key === state.lastKey && timeSinceLastExecution < minIntervalMs) {
      return false;
    }

    state = {
      lastExecutionTime: now,
      lastKey: key,
    };
    return true;
  }

  function reset(): void {
    state = {
      lastExecutionTime: 0,
      lastKey: '',
    };
    disposed = false;
  }

  function dispose(): void {
    reset();
    disposed = true;
  }

  return { shouldExecute, reset, dispose };
}

const keyboardDebouncer = createKeyboardDebouncer();

export const resetKeyboardDebounceState = keyboardDebouncer.reset;

/**
 * Disposes the keyboard debouncer, clearing internal state and rejecting
 * subsequent calls to shouldExecute(). Called during permanent teardown
 * (BUG-01: module-level debouncer now has a destroy/dispose path).
 */
export const disposeKeyboardDebouncer = keyboardDebouncer.dispose;

/** Navigation and help keys: Home, End, PageUp/Down, Arrows, ? */
const NAVIGATION_KEYS = new Set([
  'Home',
  'End',
  'PageDown',
  'PageUp',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  '?',
]);
/** Video control keys: ArrowUp/Down, M (mute) */
const VIDEO_CONTROL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'm', 'M']);

function isEditableTarget(target: EventTarget | null | undefined): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!element.isContentEditable;
}

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
    const isGalleryOpen = gallerySignals.isOpen;

    // ESC closes gallery regardless of other state, but not when editing form fields
    if (key === 'Escape' && isGalleryOpen) {
      if (isEditableTarget(event.target)) return;
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

    // isNavKey/isVideoKey: Space included in both to pass the reject guard
    // below, then routed to video control (play/pause) before navigation check.
    const isNavKey = NAVIGATION_KEYS.has(key) || key === 'Space';
    const isVideoKey = VIDEO_CONTROL_KEYS.has(key) || key === 'Space';

    if (!isNavKey && !isVideoKey) {
      handlers.onKeyboardEvent?.(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (key === '?') {
      showKeyboardHelp();
    } else if (key === 'Space') {
      handleVideoControl(key);
    } else if (
      // B3: ArrowUp/Down should control video volume when a video is active,
      // otherwise fall through to navigation (scroll between gallery items)
      (key === 'ArrowUp' || key === 'ArrowDown') &&
      gallerySignals.currentVideoElement
    ) {
      handleVideoControl(key);
    } else if (NAVIGATION_KEYS.has(key)) {
      // Covers: Home, End, PageDown, PageUp, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Space
      handleNavigation(key);
    } else if (isVideoKey) {
      // m/M mute key (video control without active video — harmless no-op)
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
  const current = gallerySignals.currentIndex;
  const total = gallerySignals.mediaItems.length;

  switch (key) {
    case 'ArrowLeft':
      navigatePrevious('keyboard');
      break;
    case 'ArrowRight':
      navigateNext('keyboard');
      break;
    case 'ArrowUp':
      navigatePrevious('keyboard');
      break;
    case 'ArrowDown':
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
    case 'Space':
      if (keyboardDebouncer.shouldExecute('Space', 150)) {
        executeVideoControl('togglePlayPause');
      }
      break;
    case 'ArrowUp':
      if (keyboardDebouncer.shouldExecute('ArrowUp', 100)) {
        executeVideoControl('volumeUp');
      }
      break;
    case 'ArrowDown':
      if (keyboardDebouncer.shouldExecute('ArrowDown', 100)) {
        executeVideoControl('volumeDown');
      }
      break;
    case 'm':
    case 'M':
      if (keyboardDebouncer.shouldExecute('M', 100)) {
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
  if (!keyboardDebouncer.shouldExecute('?', 500)) return;

  try {
    const lang = getLanguageService();
    getNotificationAdapter().notify(
      lang.translate('msg.kb.t'),
      [
        lang.translate('msg.kb.prev'),
        lang.translate('msg.kb.next'),
        lang.translate('msg.kb.cls'),
        lang.translate('msg.kb.toggle'),
      ].join('\n')
    );
  } catch {
    // Notification failure must not break keyboard navigation
  }
}
