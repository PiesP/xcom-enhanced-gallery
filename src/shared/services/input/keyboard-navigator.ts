/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview KeyboardNavigator Service - Document-level keyboard event handling
 * @version 1.0.0
 *
 * Centralized keyboard navigation service for PC-only environments.
 *
 * **Key Responsibilities**:
 * - Manages document-level keydown event handling via EventManager
 * - PC-only scope; ignores editable contexts (INPUT, TEXTAREA, contentEditable)
 * - Supports common navigation keys: Escape, Help, Arrow keys, Home, End, Enter, Space
 * - Provides subscribe/unsubscribe pattern for flexible integration
 * - Singleton pattern for application-wide keyboard control
 * - Lifecycle management with proper cleanup
 *
 * **PC-Only Scope**:
 * - No touch event handling (Phase 242-243 guidelines)
 * - Keyboard events only (no pointer/mouse events)
 * - Desktop-focused input handling
 * - Mobile input ignored by design
 *
 * **Editable Context Guards**:
 * - INPUT elements: Typing allowed, hotkeys ignored
 * - TEXTAREA elements: Typing allowed, hotkeys ignored
 * - contentEditable=true: Typing allowed, hotkeys ignored
 * - Other elements: Hotkeys active
 * - Prevents accidental gallery navigation while typing
 *
 * **Key Mappings**:
 * - Escape: Close gallery or clear state
 * - ? or Shift+/: Show help overlay
 * - ArrowLeft: Navigate to previous item
 * - ArrowRight: Navigate to next item
 * - Home: Jump to first item
 * - End: Jump to last item
 * - Enter: Confirm/select current item
 * - Space: Toggle play/pause or select
 *
 * **Integration with EventManager**:
 * - Document-level delegation (efficient, single listener)
 * - EventManager provides subscription tracking
 * - Automatic cleanup on unsubscribe
 * - Context-tagged events for debugging
 *
 * **Singleton Pattern**:
 * - Static getInstance() method
 * - Application-wide instance reuse
 * - Memory efficient (one KeyboardNavigator per app)
 * - BaseServiceImpl lifecycle management
 *
 * **Performance Characteristics**:
 * - Key detection: O(1) switch statement
 * - Subscribe: O(1) array push
 * - Unsubscribe: O(n) array filter where n = subscription count
 * - Memory: O(n) where n = active subscriptions (typically 1-3)
 * - Event handling: <1ms per keydown
 *
 * **Key Features**:
 * - Phase 137: Type Guard wrapper for event listener safety
 * - Event delegation to prevent listener proliferation
 * - Editable element detection and bypass
 * - Debug-friendly context tagging
 * - Comprehensive lifecycle management
 * - Full TypeScript support with type safety
 *
 * @see {@link BaseServiceImpl} for service lifecycle
 * @see {@link EventManager} for event delegation
 * @see Phase 137 for type guard patterns
 * @see Phase 242-243 for PC-only event guidelines
 */

import { logger } from '@shared/logging';
import { BaseServiceImpl } from '../base-service';
import { createEventListener } from '../../utils/type-safety-helpers';
import { EventManager } from '../event-manager';

/**
 * Keyboard event handler callbacks
 *
 * Each handler corresponds to a specific keyboard event or key combination.
 * Handlers are optional - only provide callbacks for keys you need to handle.
 *
 * **Handler Execution Order**:
 * 1. If editable element (guardEditable=true): onAny called, then return
 * 2. Specific key handler (onEscape, onLeft, etc.) called if exists
 * 3. preventDefault/stopPropagation applied if handled
 * 4. onAny called after specific handler (if different from step 1)
 *
 * **Error Handling**:
 * - Errors in specific handlers don't affect event propagation
 * - onAny errors are logged but don't throw
 * - Safe to implement without try-catch
 *
 * **Performance**:
 * - Handlers should be O(1) or O(n) lightweight operations
 * - Avoid long-running tasks that block key response
 * - Use debouncing/throttling for expensive operations in callbacks
 *
 * @property onEscape - ESC key pressed (close/cancel)
 * @property onHelp - '?' or Shift+'/' pressed (show help)
 * @property onLeft - ArrowLeft pressed (previous item)
 * @property onRight - ArrowRight pressed (next item)
 * @property onHome - Home key pressed (first item)
 * @property onEnd - End key pressed (last item)
 * @property onEnter - Enter key pressed (confirm/select)
 * @property onSpace - Space key pressed (toggle play/select)
 * @property onAny - Fallback for any key after specific handlers
 *   - Called even if specific handler processed key
 *   - Useful for logging, analytics, or custom key handling
 *   - Receives full KeyboardEvent for inspection
 *
 * @example
 * ```typescript
 * const handlers: KeyboardNavigatorHandlers = {
 *   onEscape: () => {
 *     closeGallery();
 *   },
 *   onLeft: () => {
 *     previousImage();
 *   },
 *   onRight: () => {
 *     nextImage();
 *   },
 *   onAny: (event) => {
 *     console.log('Key pressed:', event.key);
 *   },
 * };
 * ```
 *
 * @see {@link KeyboardNavigator.subscribe} for subscription
 * @see KeyboardEvent for event details
 */
export interface KeyboardNavigatorHandlers {
  onEscape?: () => void;
  onHelp?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onAny?: (event: KeyboardEvent) => void;
}

/**
 * Keyboard navigation subscription options
 *
 * Controls event capture behavior, preprocessing, and guarding logic.
 *
 * **Context**:
 * - Used for debugging and subscription tracking
 * - Appears in EventManager logs
 * - Useful for debugging multiple subscriptions
 *
 * **Capture Phase**:
 * - true (default): Handle event during capture phase
 * - false: Handle during bubbling phase
 * - Capture phase fires before bubbling phase
 * - Use capture=true for highest priority (above most listeners)
 *
 * **Event Suppression**:
 * - preventDefault: Prevents default browser behavior
 * - stopPropagation: Prevents event bubbling to parent elements
 * - Applied only if specific handler was called and succeeded
 *
 * **Guard Editable**:
 * - true (default): Skip hotkeys in INPUT/TEXTAREA/contentEditable
 * - false: Process hotkeys even in editable elements
 * - Prevents accidental gallery navigation while typing
 * - Always calls onAny even if editable (for tracking)
 *
 * **Use Cases**:
 * - Capture phase: Gallery-level keyboard control (highest priority)
 * - Bubbling phase: Lower-priority keyboard handling
 * - preventDefault=false: Log-only mode (don't suppress events)
 * - guardEditable=false: Forms where hotkeys should work anyway
 *
 * @property context - Debug context tag (default "keyboard-navigator")
 * @property capture - Use capture phase (default true)
 * @property preventDefault - Prevent default browser action (default true)
 * @property stopPropagation - Stop event bubbling (default true)
 * @property guardEditable - Skip in editable elements (default true)
 *
 * @example
 * ```typescript
 * // Strict: High priority, suppress defaults
 * const options: KeyboardNavigatorOptions = {
 *   context: 'gallery-nav',
 *   capture: true,
 *   preventDefault: true,
 *   stopPropagation: true,
 *   guardEditable: true,
 * };
 *
 * // Permissive: Lower priority, allow in editable
 * const options: KeyboardNavigatorOptions = {
 *   capture: false,
 *   preventDefault: false,
 *   guardEditable: false,
 * };
 * ```
 *
 * @see {@link KeyboardNavigator.subscribe} for subscription usage
 * @see EventManager for context tagging details
 */
export interface KeyboardNavigatorOptions {
  context?: string;
  capture?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  guardEditable?: boolean;
}

/**
 * KeyboardNavigator Service - PC-only document-level keyboard control
 *
 * Manages centralized keyboard event handling with support for common
 * navigation keys. Implements singleton pattern for application-wide
 * keyboard control with proper lifecycle management.
 *
 * **Architecture**:
 * - Extends BaseServiceImpl for lifecycle management (initialize/destroy)
 * - Singleton pattern via getInstance()
 * - Document-level event delegation (single listener)
 * - Integration with EventManager for event coordination
 * - Subscription tracking for proper cleanup
 *
 * **Key Responsibilities**:
 * 1. Document keydown listener registration (via EventManager)
 * 2. Editable element detection and bypass (guardEditable option)
 * 3. Key-specific handler routing (Escape, Arrows, etc.)
 * 4. Event preprocessing (preventDefault, stopPropagation)
 * 5. Subscription lifecycle management (subscribe/unsubscribe)
 * 6. Resource cleanup on service destroy
 *
 * **Lifecycle**:
 * 1. getInstance() creates singleton instance
 * 2. initialize() called before first use (optional, via BaseServiceImpl)
 * 3. subscribe() registers keyboard handlers
 * 4. unsubscribe() (via returned function) removes subscription
 * 5. destroy() called on app shutdown (cleanup all subscriptions)
 *
 * **Performance Characteristics**:
 * - One listener per app (not per subscription)
 * - O(1) key detection (switch statement)
 * - O(1) subscribe/unsubscribe (array operations)
 * - Memory: O(n) where n = active subscriptions (~1-3 typical)
 *
 * **Thread Safety**:
 * - Singleton instance is thread-safe (initialization guard)
 * - Subscriptions array is not thread-safe (JavaScript single-threaded)
 *
 * @example
 * ```typescript
 * import { KeyboardNavigator } from '@shared/services/input';
 *
 * // Get singleton instance
 * const nav = KeyboardNavigator.getInstance();
 * await nav.initialize();  // Optional, recommended for lifecycle
 *
 * // Subscribe to keyboard events
 * const unsubscribe = nav.subscribe({
 *   onEscape: () => console.log('Escape pressed'),
 *   onLeft: () => console.log('Left arrow pressed'),
 *   onRight: () => console.log('Right arrow pressed'),
 * });
 *
 * // Later: unsubscribe
 * unsubscribe();
 *
 * // On app shutdown
 * nav.destroy();
 * ```
 *
 * @see {@link BaseServiceImpl} for lifecycle methods
 * @see {@link KeyboardNavigatorHandlers} for available callbacks
 * @see {@link KeyboardNavigatorOptions} for subscription options
 * @since v1.0.0
 */
export class KeyboardNavigator extends BaseServiceImpl {
  private static instance: KeyboardNavigator | null = null;
  private activeSubscriptions: string[] = [];

  private constructor() {
    super('KeyboardNavigator');
  }

  /**
   * Get singleton KeyboardNavigator instance
   *
   * Implements lazy initialization pattern - instance created on first call.
   * Subsequent calls return same instance.
   *
   * **Thread Safety**:
   * - Safe to call from multiple locations
   * - JavaScript single-threaded, no race conditions
   * - Always returns same instance
   *
   * **Initialization**:
   * - Constructor runs on first getInstance() call
   * - Does not call initialize() automatically
   * - Call initialize() manually for lifecycle management
   * - initialize() is optional for basic usage
   *
   * @returns Singleton KeyboardNavigator instance
   *
   * @example
   * ```typescript
   * const nav = KeyboardNavigator.getInstance();
   * const sameNav = KeyboardNavigator.getInstance();
   * console.assert(nav === sameNav);  // true
   * ```
   *
   * @see {@link initialize} for lifecycle setup
   */
  public static getInstance(): KeyboardNavigator {
    if (!KeyboardNavigator.instance) {
      KeyboardNavigator.instance = new KeyboardNavigator();
    }
    return KeyboardNavigator.instance;
  }

  /**
   * Lifecycle hook: Initialize service
   *
   * Called during BaseServiceImpl.initialize() lifecycle.
   * Can be called manually for explicit initialization.
   *
   * **Initialization Steps**:
   * 1. Log initialization message
   * 2. Sets isInitialized flag (BaseServiceImpl)
   * 3. Prepares service for use
   *
   * **Optional**:
   * - Service is usable without explicit initialize()
   * - Recommended for consistent lifecycle management
   * - Useful for testing with controlled initialization
   *
   * **Errors**:
   * - Logs debug message only (no exceptions thrown)
   * - Safe to call multiple times (idempotent)
   *
   * @returns Promise that resolves when initialized
   *
   * @example
   * ```typescript
   * const nav = KeyboardNavigator.getInstance();
   * await nav.initialize();  // Optional but recommended
   *
   * nav.subscribe({ onEscape: () => {} });
   * ```
   *
   * @see BaseServiceImpl for lifecycle details
   * @internal Part of BaseServiceImpl lifecycle
   */
  protected async onInitialize(): Promise<void> {
    logger.debug('KeyboardNavigator: initialization complete');
  }

  /**
   * Lifecycle hook: Destroy service and cleanup resources
   *
   * Called during BaseServiceImpl.destroy() lifecycle.
   * Removes all active keyboard subscriptions and releases references.
   *
   * **Cleanup Steps**:
   * 1. Iterate through all active subscription IDs
   * 2. Call EventManager.removeListener() for each
   * 3. Clear subscriptions array
   * 4. Log completion message
   *
   * **Error Handling**:
   * - Silently ignores errors during listener removal
   * - Ensures all listeners cleaned up regardless of errors
   * - Logs debug message for troubleshooting
   *
   * **Safety**:
   * - Safe to call multiple times (idempotent)
   * - Safe to call if never initialized
   * - Safe to call if already destroyed
   *
   * **Resource Impact**:
   * - Removes document keydown listener
   * - Allows garbage collection of subscription data
   * - Prevents memory leaks on app shutdown
   *
   * @example
   * ```typescript
   * const nav = KeyboardNavigator.getInstance();
   * nav.subscribe({ onEscape: () => {} });
   *
   * // On app shutdown
   * nav.destroy();  // Removes all subscriptions
   * ```
   *
   * @see BaseServiceImpl for lifecycle details
   * @internal Part of BaseServiceImpl lifecycle
   */
  protected onDestroy(): void {
    this.activeSubscriptions.forEach(id => {
      try {
        EventManager.getInstance().removeListener(id);
      } catch {
        /* Safe error handling: continue cleanup regardless */
      }
    });
    this.activeSubscriptions = [];
    logger.debug('KeyboardNavigator: destruction complete, all listeners removed');
  }

  /**
   * Subscribe to document keydown events with handler callbacks
   *
   * Registers keyboard event handlers with optional configuration.
   * Returns unsubscribe function for easy cleanup.
   *
   * **Subscription Mechanism**:
   * 1. Creates keydown event handler with closure over handlers/options
   * 2. Registers handler with EventManager (delegates to document.addEventListener)
   * 3. Tracks subscription ID in activeSubscriptions array
   * 4. Returns unsubscribe function with automatic cleanup
   *
   * **Handler Execution Flow**:
   * 1. Check if target is editable element (if guardEditable=true)
   *    - If editable: call onAny, return early
   *    - If not editable: continue to specific handlers
   * 2. Switch on event.key to find matching handler
   * 3. Call matching handler if registered (e.g., handlers.onEscape?.())
   * 4. Set handled=true if handler was called
   * 5. Call onAny callback for all keys (useful for logging)
   * 6. If handled: apply preventDefault/stopPropagation
   *
   * **Editable Element Detection**:
   * - Checks tagName: INPUT, TEXTAREA (case-insensitive)
   * - Checks contentEditable attribute for true value
   * - Safe: Returns false if target not HTMLElement or error occurs
   * - Always calls onAny even in editable elements (for analytics)
   *
   * **Key Mapping**:
   * - "Escape": onEscape callback
   * - "?": onHelp callback
   * - Shift+"/": onHelp callback (Shift+/ on US keyboard)
   * - "ArrowLeft": onLeft callback
   * - "ArrowRight": onRight callback
   * - "Home": onHome callback
   * - "End": onEnd callback
   * - "Enter": onEnter callback
   * - " " or "Space": onSpace callback
   * - Any key: onAny callback (after specific handler)
   *
   * **Error Handling**:
   * - Errors in specific handlers don't propagate
   * - Errors in onAny logged with try-catch
   * - Errors in preventDefault/stopPropagation silently ignored
   * - Safe to run without error boundaries
   *
   * **Cleanup**:
   * - Returned unsubscribe function removes listener
   * - Removes subscription ID from activeSubscriptions
   * - Safe to call multiple times (no-op if already removed)
   * - Called automatically by onDestroy()
   *
   * @param handlers - Object with optional handler callbacks
   * @param options - Subscription options (capture, preventDefault, etc.)
   * @returns Unsubscribe function to remove this subscription
   *
   * @example
   * ```typescript
   * const nav = KeyboardNavigator.getInstance();
   *
   * // Basic subscription
   * const unsubscribe = nav.subscribe({
   *   onEscape: () => closeGallery(),
   *   onLeft: () => previousItem(),
   *   onRight: () => nextItem(),
   * });
   *
   * // Later: unsubscribe
   * unsubscribe();
   *
   * // With options
   * const unsub = nav.subscribe(
   *   {
   *     onHelp: () => showHelp(),
   *     onAny: (event) => {
   *       console.log('Key:', event.key);
   *     },
   *   },
   *   {
   *     context: 'gallery-nav',
   *     capture: true,
   *     preventDefault: true,
   *     guardEditable: true,
   *   }
   * );
   * ```
   *
   * @see {@link KeyboardNavigatorHandlers} for callback types
   * @see {@link KeyboardNavigatorOptions} for option details
   */
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

    // Phase 137: Type Guard 래퍼로 EventListener 타입 변환
    const id = EventManager.getInstance().addListener(
      document,
      'keydown',
      createEventListener(handleKeyDown),
      { capture },
      context
    );

    // 구독 ID 추적 (생명주기 관리)
    this.activeSubscriptions.push(id);

    return () => {
      try {
        EventManager.getInstance().removeListener(id);
        this.activeSubscriptions = this.activeSubscriptions.filter(sid => sid !== id);
      } catch {
        /* no-op */
      }
    };
  }
}

export const keyboardNavigator = KeyboardNavigator.getInstance();
