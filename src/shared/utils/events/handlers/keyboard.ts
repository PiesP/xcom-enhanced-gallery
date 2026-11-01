// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Keyboard event handler for gallery navigation and video control
 * PC-only policy: Handles keyboard events only
 */

import { shouldHandleGlobalShortcut } from '@piesp/browser-core/design';
import { isGalleryRecoveryActive } from '@shared/dom/utils';
import { logger } from '@shared/logging/logger';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import {
  gallerySignals,
  getDisplayedMediaIndex,
  navigateNext,
  navigatePrevious,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';

import { executeVideoControl } from '@shared/utils/events/handlers/video-control-helper';
import { KEYBOARD_HELP_REQUEST } from '@shared/utils/events/handlers/keyboard-help-event';

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
    if (disposed) {
      return false;
    }
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

const OWNED_CONTROL_SELECTOR =
  'a[href], input, select, textarea, summary, [role="menuitem"], [role="slider"], [data-gallery-element="settings-panel"], [data-gallery-element="tweet-panel"], [data-gallery-element="keyboard-help-panel"]';
const ACTIVATION_CONTROL_SELECTOR = 'button, [role="button"]';

function eventPath(event: KeyboardEvent): readonly EventTarget[] {
  try {
    return event.composedPath();
  } catch {
    return event.target ? [event.target] : [];
  }
}

function nativeControlOwnsKey(event: KeyboardEvent): boolean {
  // Buttons own activation; gallery Left/Right still work after a toolbar click.
  const selector =
    event.key === ' ' || event.key === 'Enter'
      ? `${OWNED_CONTROL_SELECTOR}, ${ACTIVATION_CONTROL_SELECTOR}`
      : OWNED_CONTROL_SELECTOR;
  const path = eventPath(event);
  if (path.some((target) => target instanceof Element && target.matches(selector))) {
    return true;
  }
  return event.target instanceof Element && event.target.closest(selector) !== null;
}

function expandedToolbarPanelOwnsEscape(event: KeyboardEvent): boolean {
  const toolbar = eventPath(event).find(
    (target): target is HTMLElement =>
      target instanceof HTMLElement && target.matches('[data-gallery-element="toolbar"]')
  );
  return (
    (toolbar?.querySelector('#settings-button[aria-expanded="true"]') ?? null) !== null ||
    (toolbar?.querySelector('#keyboard-help-button[aria-expanded="true"]') ?? null) !== null
  );
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
  if (!options.enableKeyboard) {
    return;
  }

  try {
    // Recovery is modeless: leave every key available to the host and recovery controls.
    if (isGalleryRecoveryActive()) {
      return;
    }

    const key = event.key;
    const isGalleryOpen = gallerySignals.isOpen;
    if (!shouldHandleGlobalShortcut(event)) {
      return;
    }

    // Expanded toolbar panels own Escape and restore focus to their entry buttons.
    if (key === 'Escape' && isGalleryOpen) {
      if (expandedToolbarPanelOwnsEscape(event)) {
        return;
      }
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

    if (
      nativeControlOwnsKey(event) ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      (event.shiftKey && key !== '?')
    ) {
      return;
    }

    // isNavKey/isVideoKey: space bar included in both to pass the reject guard
    // below, then routed to video control (play/pause) before navigation check.
    // KeyboardEvent.key for space is ' ' (single space), not 'Space'.
    const isNavKey = NAVIGATION_KEYS.has(key) || key === ' ';
    const isVideoKey = VIDEO_CONTROL_KEYS.has(key) || key === ' ';

    if (!isNavKey && !isVideoKey) {
      handlers.onKeyboardEvent?.(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (key === '?') {
      requestKeyboardHelp();
    } else if (key === ' ') {
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
  const displayed = getDisplayedMediaIndex();
  const total = gallerySignals.mediaItems.length;
  if (displayed === null) {
    return;
  }

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
      navigateToItem(Math.max(0, displayed - 5), 'keyboard');
      break;
    case 'PageDown':
      navigateToItem(Math.min(total - 1, displayed + 5), 'keyboard');
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
      if (keyboardDebouncer.shouldExecute(' ', 150)) {
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
 * Opens the gallery toolbar's persistent help without repeating a platform notification.
 * @internal
 */
function requestKeyboardHelp(): void {
  if (!keyboardDebouncer.shouldExecute('?', 500)) {
    return;
  }

  document.body.dispatchEvent(new Event(KEYBOARD_HELP_REQUEST));
}
