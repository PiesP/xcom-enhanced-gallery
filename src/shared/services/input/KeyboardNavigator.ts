/**
 * KeyboardNavigator Service
 * - Centralizes document-level keydown handling via EventManager
 * - PC-only scope; ignores editable contexts (INPUT/TEXTAREA/contentEditable)
 */

// Internal imports use relative paths to avoid alias issues in Vitest
import { logger } from '../../logging/logger';
import { EventManager } from '../EventManager';

export interface KeyboardNavigatorHandlers {
  onEscape?: () => void;
  onHelp?: () => void; // Shift+'/' or '?'
  onLeft?: () => void;
  onRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  // Fallback for any key (after specific handlers)
  onAny?: (event: KeyboardEvent) => void;
}

export interface KeyboardNavigatorOptions {
  context?: string; // EventManager context tag
  capture?: boolean; // default true
  preventDefault?: boolean; // default true for handled keys
  stopPropagation?: boolean; // default true for handled keys
  guardEditable?: boolean; // default true
}

export class KeyboardNavigator {
  private static instance: KeyboardNavigator | null = null;

  public static getInstance(): KeyboardNavigator {
    if (!this.instance) this.instance = new KeyboardNavigator();
    return this.instance;
  }

  /** Subscribe to document keydown. Returns unsubscribe function. */
  public subscribe(
    handlers: KeyboardNavigatorHandlers,
    options: KeyboardNavigatorOptions = {}
  ): () => void {
    const {
      context = 'keyboard-navigator',
      capture = true,
      preventDefault = true,
      stopPropagation = true,
      guardEditable = true,
    } = options;

    const isEditable = (target: EventTarget | null | undefined) => {
      try {
        const el = target as HTMLElement | null;
        if (!el) return false;
        const tag = (el.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
        if ((el as HTMLElement).isContentEditable) return true;
      } catch {
        /* no-op */
      }
      return false;
    };

    const handleKeyDown = (evt: Event) => {
      const event = evt as KeyboardEvent;
      if (guardEditable && isEditable(event.target)) {
        handlers.onAny?.(event);
        return;
      }

      let handled = false;
      switch (event.key) {
        case 'Escape':
          handlers.onEscape?.();
          handled = !!handlers.onEscape;
          break;
        case '?':
          handlers.onHelp?.();
          handled = !!handlers.onHelp;
          break;
        case '/':
          if (event.shiftKey) {
            handlers.onHelp?.();
            handled = !!handlers.onHelp;
          }
          break;
        case 'ArrowLeft':
          handlers.onLeft?.();
          handled = !!handlers.onLeft;
          break;
        case 'ArrowRight':
          handlers.onRight?.();
          handled = !!handlers.onRight;
          break;
        case 'Home':
          handlers.onHome?.();
          handled = !!handlers.onHome;
          break;
        case 'End':
          handlers.onEnd?.();
          handled = !!handlers.onEnd;
          break;
        case 'Enter':
          handlers.onEnter?.();
          handled = !!handlers.onEnter;
          break;
        case ' ': // Space
        case 'Space':
          handlers.onSpace?.();
          handled = !!handlers.onSpace;
          break;
        default:
          break;
      }

      try {
        handlers.onAny?.(event);
      } catch (err) {
        logger.debug('KeyboardNavigator onAny handler error', err);
      }

      if (handled) {
        if (preventDefault) {
          try {
            event.preventDefault();
          } catch {
            /* no-op */
          }
        }
        if (stopPropagation) {
          try {
            event.stopPropagation();
          } catch {
            /* no-op */
          }
        }
      }
    };

    const id = EventManager.getInstance().addListener(
      document,
      'keydown',
      handleKeyDown as unknown as EventListener,
      { capture },
      context
    );

    return () => {
      try {
        EventManager.getInstance().removeListener(id);
      } catch {
        /* no-op */
      }
    };
  }
}

export const keyboardNavigator = KeyboardNavigator.getInstance();
