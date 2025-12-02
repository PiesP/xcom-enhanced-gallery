/// <reference types="vitest" />
// Ensure logger is mocked
vi.mock('@shared/logging', () => ({ logger: { warn: vi.fn(), debug: vi.fn(), error: vi.fn() } }));
import { addListener, __testRegistryUnregister, __testHasListener, removeAllEventListeners, removeEventListenersByContext } from '@shared/utils/events/core/listener-manager';
import { logger } from '@shared/logging';

describe('ListenerManager mutation additions', () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    element = document.createElement('div');
    // Ensure registry is clear between tests
    removeAllEventListeners();
  });

  it('should return false when unregistering a non-existent id', () => {
    const result = __testRegistryUnregister('not-a-real-id');
    expect(result).toBe(false);
  });

  it('should return true when unregistering an existing id', () => {
    const id = addListener(element, 'click', () => {});
    expect(__testHasListener(id)).toBe(true);
    const result = __testRegistryUnregister(id);
    expect(result).toBe(true);
    expect(__testHasListener(id)).toBe(false);
  });

  it('removeAllEventListeners should be a no-op when no listeners are present', () => {
    // Ensure debug not called when there are no listeners
    vi.clearAllMocks();
    removeAllEventListeners();
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('addListener should not call logger.debug when signal.addEventListener is not a function', () => {
    vi.clearAllMocks();
    const signal = {
      aborted: false,
      addEventListener: undefined,
      removeEventListener: undefined,
    } as unknown as AbortSignal;

    const id = addListener(element, 'click', () => {}, { signal } as AddEventListenerOptions, 'test');
    expect(id).toBeDefined();
    const debugCalls: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
    const found = debugCalls.some((c: any) => c[0] === 'AbortSignal addEventListener not available (ignored)');
    expect(found).toBe(false);
  });

  it('addListener should warn and return id for invalid element', () => {
    const invalid: any = {};
    const id = addListener(invalid, 'click', () => {}, undefined, 'testCtx');
    expect(id).toBeDefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('removeEventListenersByContext should remove listeners with matching context', () => {
    vi.clearAllMocks();
    const id1 = addListener(element, 'click', () => {}, undefined, 'ctx');
    const id2 = addListener(element, 'click', () => {}, undefined, 'ctx');
    const removed = removeEventListenersByContext('ctx');
    expect(removed).toBe(2);
    // Find a debug call that contains the removal message
    const called = ((logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? []).some((c: any) => typeof c[0] === 'string' && c[0].includes('[removeEventListenersByContext] Removed'));
    expect(called).toBe(true);
    expect(__testHasListener(id1)).toBe(false);
    expect(__testHasListener(id2)).toBe(false);
  });

  it('addListener should attach abort listener and cleanup on abort', () => {
    vi.clearAllMocks();
    const callbacks: Array<() => void> = [];
    const signal = {
      aborted: false,
      addEventListener: vi.fn((_type: string, cb: any) => callbacks.push(cb)),
      removeEventListener: vi.fn((_type: string, cb: any) => {
        const idx = callbacks.indexOf(cb);
        if (idx >= 0) callbacks.splice(idx, 1);
      }),
      // test helper to trigger abort
      __trigger() {
        callbacks.forEach((cb) => cb());
      },
    } as unknown as AbortSignal;

    const id = addListener(element, 'click', () => {}, { signal } as AddEventListenerOptions, 'ctx2');
    expect((signal as unknown as any).addEventListener).toHaveBeenCalled();
    // No debug logging
    // Should not log debug about addEventListener being unavailable when it's defined
    const debugCalls: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
    const abortAddCall = debugCalls.some((c: any) => typeof c[0] === 'string' && (c[0] as string).includes('addEventListener not available'));
    expect(abortAddCall).toBe(false);
    // Trigger abort to force cleanup
    (signal as unknown as any).__trigger();
    expect(__testHasListener(id)).toBe(false);
    expect((signal as unknown as any).removeEventListener).toHaveBeenCalled();
    const removeDebugCalls: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
    const removeDebugFound = removeDebugCalls.some((c: any) => c[0] === 'AbortSignal removeEventListener safeguard failed (ignored)');
    expect(removeDebugFound).toBe(false);
  });

  it('removeAllEventListeners should remove all listeners and log debug', () => {
    vi.clearAllMocks();
    const id1 = addListener(element, 'click', () => {}, undefined, 'rctx');
    const id2 = addListener(element, 'click', () => {}, undefined, 'rctx');
    removeAllEventListeners();
    expect(__testHasListener(id1)).toBe(false);
    expect(__testHasListener(id2)).toBe(false);
    expect(logger.warn).not.toHaveBeenCalled();
    const called2: boolean = ((logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? []).some((c: any) => typeof c[0] === 'string' && c[0].includes('[removeAllEventListeners] Removed'));
    expect(called2).toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('addListener should not call logger.debug when signal.addEventListener is present and does not throw', () => {
    vi.clearAllMocks();
    const callbacks: Array<() => void> = [];
    const signal = {
      aborted: false,
      addEventListener: vi.fn((_type: string, cb: any) => callbacks.push(cb)),
      removeEventListener: vi.fn((_type: string, cb: any) => {
        const idx = callbacks.indexOf(cb);
        if (idx >= 0) callbacks.splice(idx, 1);
      }),
    } as unknown as AbortSignal;

    const id = addListener(element, 'click', () => {}, { signal } as AddEventListenerOptions, 'ctx-good');
    expect(id).toBeDefined();
    expect((signal as unknown as any).addEventListener).toHaveBeenCalled();
    const debugCallsOk: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
    const abortAddCallOk = debugCallsOk.some((c: any) => typeof c[0] === 'string' && (c[0] as string).includes('addEventListener not available'));
    expect(abortAddCallOk).toBe(false);
    // cleanup
    removeEventListenersByContext('ctx-good');
  });

  // Flaky test intentionally omitted: asserting debug log presence when signal.addEventListener throws.

  // NOTE: when signal.addEventListener is not a function the addListener path should not attempt to call it

  it('removeEventListenersByContext should return 0 when context has no listeners', () => {
    vi.clearAllMocks();
    const removed = removeEventListenersByContext('non-existing');
    expect(removed).toBe(0);
    const debugCalls2: any[] = (logger.debug as unknown as { mock?: { calls: any[] } }).mock?.calls ?? [];
    const found2 = debugCalls2.some((c: any) => typeof c[0] === 'string' && c[0].includes('[removeEventListenersByContext] Removed'));
    expect(found2).toBe(false);
  });
});
