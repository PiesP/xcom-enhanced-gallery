/**
 * Tests for Listener Manager
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addListener,
  removeEventListenerManaged,
  removeAllEventListeners,
  __testHasListener,
  __testGetListener,
  getEventListenerStatus,
  removeEventListenersByContext,
} from '@shared/utils/events/core/listener-manager';
import { logger } from '@shared/logging';

describe('ListenerManager', () => {
  beforeEach(() => {
    // Ensure we have a clean registry before each test
    removeAllEventListeners();
    vi.spyOn(logger, 'debug');
    vi.spyOn(logger, 'warn');
    vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    removeAllEventListeners();
    vi.restoreAllMocks();
  });

  it('should register a DOM listener and allow removal', () => {
    const el = document.createElement('div');
    const handler = vi.fn();
    const id = addListener(el, 'click', handler, undefined, 'test');

    expect(__testHasListener(id)).toBe(true);
    const ctx = __testGetListener(id);
    expect(ctx).toBeDefined();
    expect(ctx?.type).toBe('click');

    // Should remove successfully via managed API
    expect(removeEventListenerManaged(id)).toBe(true);
    expect(__testHasListener(id)).toBe(false);
  });

  it('should attach abort handler and remove on signal abort', () => {
    const el = document.createElement('div');
    const handler = vi.fn();
    const controller = new AbortController();
    const id = addListener(el, 'click', handler, { signal: controller.signal }, 'test-abort');

    // registered
    expect(__testHasListener(id)).toBe(true);

    // abort signal should remove registration via onAbort
    controller.abort();
    expect(__testHasListener(id)).toBe(false);
  });

  it('should return early if signal.addEventListener throws (no registration)', () => {
    const el = document.createElement('div');
    const handler = vi.fn();
    const fakeSignal: Partial<AbortSignal> = {
      addEventListener: () => {
        throw new Error('add failed');
      },
      removeEventListener: () => {},
      aborted: false,
    };
    const id = addListener(el as unknown as EventTarget, 'click', handler, { signal: fakeSignal as AbortSignal }, 'sig-fail');

    // Because addEventListener on signal failed, we return early and the listener should not be registered
    expect(__testHasListener(id)).toBe(false);
  });

  it('should cleanup abort handler when DOM addEventListener throws', () => {
    // Fake element with addEventListener that throws
    const handler = vi.fn();
    let savedAbort: EventListener | undefined;
    const fakeSignal: Partial<AbortSignal> = {
      addEventListener: vi.fn((_, listener: EventListener) => {
        savedAbort = listener;
      }) as unknown as (type: string, listener: EventListener) => void,
      removeEventListener: vi.fn(),
      aborted: false,
    };
    const element = {
      addEventListener: () => {
        throw new Error('DOM add failed');
      },
      removeEventListener: vi.fn(),
    } as unknown as EventTarget;

    const id = addListener(element, 'click', handler, { signal: fakeSignal as AbortSignal }, 'dom-fail');

    // Should have attached abort handler, verify it and then confirm remove was called when DOM addEventListener failed
    expect(savedAbort).toBeDefined();
    expect((fakeSignal.removeEventListener as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    expect(__testHasListener(id)).toBe(false);
  });

  it('should sanitize options passed to DOM addEventListener (no signal property)', () => {
    const opts: AddEventListenerOptions = { passive: true, capture: true, signal: (new AbortController()).signal } as any;
    let capturedOptions: any = null;
    const element = {
      addEventListener: (_: string, __: EventListener, options?: AddEventListenerOptions) => {
        capturedOptions = options;
      },
      removeEventListener: () => {},
    } as unknown as EventTarget;

    const handler = vi.fn();
    const id = addListener(element, 'click', handler, opts, 'sanitize');

    // domOptions passed to element.addEventListener should not include .signal
    expect(capturedOptions).toBeDefined();
    expect((capturedOptions as any).signal).toBeUndefined();
    // cleanup
    removeEventListenerManaged(id);
  });

  it('removeEventListenerManaged should return false when element.removeEventListener throws', () => {
    const el = {
      addEventListener: () => {},
      removeEventListener: () => {
        throw new Error('remove failed');
      },
    } as unknown as EventTarget;
    const id = addListener(el, 'click', () => {}, undefined, 'remove-throw');
    // Since removeEventListener throws, this should return false and keep the registry entry
    expect(removeEventListenerManaged(id)).toBe(false);
    // cleanup via registry helper
    removeAllEventListeners();
  });
});

describe('Listener Manager (expanded tests)', () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    element = document.createElement('div');
    vi.spyOn(element, 'addEventListener');
    vi.spyOn(element, 'removeEventListener');
    // Spy on logger for assertions
    vi.spyOn(logger, 'debug');
    vi.spyOn(logger, 'warn');
    vi.spyOn(logger, 'error');
    // Clear registry manually since we don't have a clear method exposed directly for tests
    // but removeAllEventListeners should do it.
    removeAllEventListeners();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeAllEventListeners();
  });

  describe('addListener', () => {
    it('should generate correct ID format', () => {
      const listener = vi.fn();
      const id1 = addListener(element, 'click', listener);
      const id2 = addListener(element, 'click', listener, undefined, 'my-ctx');

      // Math.random().toString(36).slice(2, 11) produces 9 chars
      expect(id1).toMatch(/^[a-z0-9]{1,15}$/);
      expect(id2).toMatch(/^my-ctx:[a-z0-9]{1,15}$/);
    });

    it('should add event listener to element', () => {
      const listener = vi.fn();
      const id = addListener(element, 'click', listener);

      expect(element.addEventListener).toHaveBeenCalledWith('click', listener, undefined);
      expect(id).toBeDefined();
    });

    it('should handle invalid element', () => {
      const listener = vi.fn();
      const id = addListener(null as unknown as EventTarget, 'click', listener);

      expect(id).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid element passed'),
        expect.anything()
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle aborted signal', () => {
      const controller = new AbortController();
      controller.abort();
      const listener = vi.fn();

      addListener(element, 'click', listener, { signal: controller.signal });

      expect(element.addEventListener).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Skip adding listener due to pre-aborted signal'),
        expect.anything()
      );
    });

    it('should register listener with registry', () => {
      const listener = vi.fn();
      const id = addListener(element, 'click', listener);

      const registered = __testGetListener(id);
      expect(registered).toBeDefined();
      expect(registered?.element).toBe(element);
      expect(registered?.type).toBe('click');
      expect(registered?.listener).toBe(listener);
    });

    it('should handle AbortSignal aborting later', () => {
      const controller = new AbortController();
      const listener = vi.fn();
      const id = addListener(element, 'click', listener, {
        signal: controller.signal,
      });

      expect(element.addEventListener).toHaveBeenCalled();

      // Trigger abort
      controller.abort();

      // Should remove listener
      expect(element.removeEventListener).toHaveBeenCalledWith(
        'click',
        listener,
        expect.objectContaining({ signal: controller.signal })
      );
      // Should unregister
      expect(__testHasListener(id)).toBe(false);
    });

    it('should handle errors during addEventListener', () => {
      const error = new Error('Add failed');
      vi.spyOn(element, 'addEventListener').mockImplementation(() => {
        throw error;
      });
      const listener = vi.fn();

      const id = addListener(element, 'click', listener);

      expect(id).toBeDefined();
      // Should log error but not crash
    });

    it('should handle object without addEventListener as element', () => {
      const listener = vi.fn();
      const invalidElement = {} as EventTarget;
      const id = addListener(invalidElement, 'click', listener);

      expect(id).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid element passed'),
        expect.anything()
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle signal.addEventListener throwing error', () => {
      const listener = vi.fn();
      const signal = {
        aborted: false,
        addEventListener: vi.fn().mockImplementation(() => {
          throw new Error('Signal add failed');
        }),
        removeEventListener: vi.fn(),
      } as unknown as AbortSignal;

      const id = addListener(element, 'click', listener, { signal });

      expect(id).toBeDefined();
      expect(signal.addEventListener).toHaveBeenCalled();
    });

    it('should handle signal.removeEventListener throwing error during abort', () => {
      const listener = vi.fn();
      let abortHandler: () => void;

      const signal = {
        aborted: false,
        addEventListener: vi.fn().mockImplementation((type, handler) => {
          if (type === 'abort') abortHandler = handler;
        }),
        removeEventListener: vi.fn().mockImplementation(() => {
          throw new Error('Signal remove failed');
        }),
      } as unknown as AbortSignal;

      addListener(element, 'click', listener, { signal });

      // Simulate abort
      expect(abortHandler!).toBeDefined();
      abortHandler!();

      expect(signal.removeEventListener).toHaveBeenCalled();
      // Should not throw
      const calls: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
      const call = calls.find((c: any) =>
        typeof c[0] === 'string' && c[0].includes('AbortSignal removeEventListener safeguard failed')
      );
      expect(call).toBeDefined();
      const secondArg = call![1];
      expect(secondArg).toHaveProperty('context');
    });
  });

  describe('removeEventListenerManaged', () => {
    it('should remove event listener and unregister', () => {
      const listener = vi.fn();
      const id = addListener(element, 'click', listener);

      const result = removeEventListenerManaged(id);

      expect(result).toBe(true);
      expect(element.removeEventListener).toHaveBeenCalledWith('click', listener, undefined);
      expect(__testHasListener(id)).toBe(false);
    });

    it('should handle non-existent listener id', () => {
      const result = removeEventListenerManaged('non-existent');
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Event listener not found for removal')
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle errors during removeEventListener', () => {
      const listener = vi.fn();
      const id = addListener(element, 'click', listener);

      vi.spyOn(element, 'removeEventListener').mockImplementation(() => {
        throw new Error('Remove failed');
      });

      const result = removeEventListenerManaged(id);

      expect(result).toBe(false);
      // Should log error
    });
  });

  describe('removeEventListenersByContext', () => {
    it('should remove all listeners for a specific context', () => {
      const listener = vi.fn();
      const context = 'test-context';
      const id1 = addListener(element, 'click', listener, undefined, context);
      const id2 = addListener(element, 'hover', listener, undefined, context);
      const id3 = addListener(element, 'focus', listener, undefined, 'other-context');

      const count = removeEventListenersByContext(context);

      expect(count).toBe(2);
      expect(__testHasListener(id1)).toBe(false);
      expect(__testHasListener(id2)).toBe(false);
      expect(__testHasListener(id3)).toBe(true);
    });

    it('should return 0 if no listeners found for context', () => {
      const count = removeEventListenersByContext('non-existent-context');
      expect(count).toBe(0);
      const debugCalls: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
      const found = debugCalls.some((c: any) => typeof c[0] === 'string' && c[0].includes('[removeEventListenersByContext]'));
      expect(found).toBe(false);
    });

    it('should log debug when removing listeners by context', () => {
      const listener = vi.fn();
      const context = 'log-context';
      addListener(element, 'click', listener, undefined, context);

      const count = removeEventListenersByContext(context);

      expect(count).toBe(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          `[removeEventListenersByContext] Removed 1 listeners for context: ${context}`
        )
      );
    });

    it('should continue removing other listeners if one fails', () => {
      const listener = vi.fn();
      const context = 'fail-context';
      const id1 = addListener(element, 'click', listener, undefined, context);
      const id2 = addListener(element, 'hover', listener, undefined, context);

      // Mock removeEventListener to fail for the first call only
      let callCount = 0;
      vi.spyOn(element, 'removeEventListener').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Remove failed');
        }
      });

      const count = removeEventListenersByContext(context);

      // Should still count as removed from registry perspective?
      // The implementation iterates over registry entries.
      // If removeEventListenerManaged returns false (due to error), does it count?
      // Let's check implementation of removeEventListenersByContext...
      // It calls removeEventListenerManaged.
      // removeEventListenerManaged catches error and returns false.
      // removeEventListenersByContext filters by result === true.

      // So if one fails, count should be 1.
      expect(count).toBe(1);
      expect(__testHasListener(id1)).toBe(true); // Failed to remove, so it should still be in registry
      // Wait, removeEventListenerManaged calls registry.unregister BEFORE returning true?
      // No, let's check source code again.

      /*
      try {
        ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
        listenerRegistry.unregister(id); // This happens after DOM removal
        return true;
      } catch (error) {
        logger.warn(...)
        return false;
      }
      */

      // So if DOM removal fails, unregister is NOT called.
      expect(__testHasListener(id1)).toBe(true);
      expect(__testHasListener(id2)).toBe(false);
    });
  });

  describe('removeAllEventListeners', () => {
    it('should remove all registered listeners', () => {
      const listener = vi.fn();
      addListener(element, 'click', listener);
      addListener(element, 'hover', listener);

      removeAllEventListeners();

      expect(getEventListenerStatus().total).toBe(0);
      expect(element.removeEventListener).toHaveBeenCalledTimes(2);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[removeAllEventListeners] Removed 2 listeners')
      );
    });

    it('should handle errors during removal of specific listeners', () => {
      const listener = vi.fn();
      addListener(element, 'click', listener);

      vi.spyOn(element, 'removeEventListener').mockImplementation(() => {
        throw new Error('Remove failed');
      });

      removeAllEventListeners();

      // Should still clear registry even if DOM removal fails?
      // Looking at implementation: registry drain() clears registry first, then iterates.
      expect(getEventListenerStatus().total).toBe(0);
    });

    it('should do nothing if no listeners registered', () => {
      removeAllEventListeners();
      const debugCalls: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
      const found = debugCalls.some((c: any) => typeof c[0] === 'string' && c[0].includes('[removeAllEventListeners]'));
      expect(found).toBe(false);
    });
  });

  describe('getEventListenerStatus', () => {
    it('should return current status', () => {
      const listener = vi.fn();
      addListener(element, 'click', listener);

      const status = getEventListenerStatus();
      expect(status.total).toBe(1);
    });

    it('should return empty array when no listeners registered', () => {
      removeAllEventListeners();

      const status = getEventListenerStatus();
      expect(status.total).toBe(0);
    });
  });

  describe('mutation coverage - unregister behavior', () => {
    it('should return false when context is not found for unregister', () => {
      // Attempt to remove a listener that doesn't exist
      const result = removeEventListenerManaged('completely-fake-id-12345');

      expect(result).toBe(false);
    });

    it('should return true when successfully removing a listener', () => {
      const listener = vi.fn();
      const id = addListener(element, 'click', listener);

      const result = removeEventListenerManaged(id);

      expect(result).toBe(true);
    });
  });

  describe('mutation coverage - logger object properties', () => {
    it('should log debug with type and context properties when registering', () => {
      const listener = vi.fn();
      addListener(element, 'click', listener, undefined, 'test-context');

      // Verify logger.debug was called with object containing type and context
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Listener registered'),
        expect.objectContaining({
          type: 'click',
          context: 'test-context',
        })
      );
    });

    it('should log warn with detailed properties for invalid element', () => {
      const listener = vi.fn();
      addListener(null as unknown as EventTarget, 'click', listener, undefined, 'inv-ctx');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid element'),
          expect.objectContaining({
          type: 'click',
          context: 'inv-ctx',
          elementType: 'object',
          hasAddEventListener: null,
        })
      );
    });

    it('should log debug with context when skipping pre-aborted signal', () => {
      const controller = new AbortController();
      controller.abort();
      const listener = vi.fn();

      addListener(element, 'click', listener, { signal: controller.signal }, 'abort-ctx');

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Skip adding listener due to pre-aborted signal'),
        expect.objectContaining({
          context: 'abort-ctx',
        })
      );
    });

    it('should log debug with context when adding listener successfully', () => {
      const listener = vi.fn();
      addListener(element, 'click', listener, undefined, 'success-ctx');

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Event listener added:'),
        expect.objectContaining({
          context: 'success-ctx',
        })
      );
    });

    it('should log error with context when addEventListener fails', () => {
      const error = new Error('Add failed');
      vi.spyOn(element, 'addEventListener').mockImplementation(() => {
        throw error;
      });
      const listener = vi.fn();

      addListener(element, 'click', listener, undefined, 'error-ctx');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to add event listener'),
        expect.objectContaining({
          error,
          context: 'error-ctx',
        })
      );
    });

    it('should log warn with error and context during drain failure', () => {
      const listener = vi.fn();
      addListener(element, 'click', listener, undefined, 'drain-ctx');

      const removeError = new Error('Drain remove failed');
      vi.spyOn(element, 'removeEventListener').mockImplementation(() => {
        throw removeError;
      });

      removeAllEventListeners();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to remove event listener during drain'),
        expect.objectContaining({
          error: removeError,
          context: 'drain-ctx',
        })
      );
    });
  });

  describe('mutation coverage - signal addEventListener check', () => {
    it('should handle signal without addEventListener method', () => {
      const listener = vi.fn();
      const signal = {
        aborted: false,
        // No addEventListener method
      } as unknown as AbortSignal;

      const id = addListener(element, 'click', listener, { signal });

      expect(id).toBeDefined();
      expect(element.addEventListener).toHaveBeenCalled();
      const debugCalls: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
      const found = debugCalls.some((c: any) => c[0] === 'AbortSignal addEventListener not available (ignored)');
      expect(found).toBe(false);
    });

    it('should properly check if signal.addEventListener is a function', () => {
      const listener = vi.fn();
      const signal = {
        aborted: false,
        addEventListener: 'not a function',
        removeEventListener: vi.fn(),
      } as unknown as AbortSignal;

      const id = addListener(element, 'click', listener, { signal });

      expect(id).toBeDefined();
      expect(element.addEventListener).toHaveBeenCalled();
      const debugCalls2: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
      const found2 = debugCalls2.some((c: any) => c[0] === 'AbortSignal addEventListener not available (ignored)');
      expect(found2).toBe(false);
      // Should not try to call non-function
    });
  });

  describe('mutation coverage - listenersToRemove array', () => {
    it('should correctly build listenersToRemove array and remove only matching context', () => {
      const listener = vi.fn();

      // Add listeners with different contexts
      const id1 = addListener(element, 'click', listener, undefined, 'ctx-a');
      const id2 = addListener(element, 'click', listener, undefined, 'ctx-b');
      const id3 = addListener(element, 'click', listener, undefined, 'ctx-a');

      // Remove only 'ctx-a' context
      const count = removeEventListenersByContext('ctx-a');

      expect(count).toBe(2);
      expect(__testHasListener(id1)).toBe(false);
      expect(__testHasListener(id2)).toBe(true); // Different context, should remain
      expect(__testHasListener(id3)).toBe(false);
    });
  });
});
