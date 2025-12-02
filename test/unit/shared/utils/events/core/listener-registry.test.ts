/**
 * @fileoverview ListenerRegistry tests
 * @deprecated Phase 500: ListenerRegistry merged into listener-manager.ts
 *              These tests now verify the consolidated listener-manager API.
 */
import {
  addListener,
  removeEventListenerManaged,
  removeAllEventListeners,
  getEventListenerStatus,
  __testHasListener,
  __testGetListener,
} from "@shared/utils/events/core/listener-manager";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from '@shared/logging';

// Mock logger
vi.mock("@shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ListenerManager (consolidated from ListenerRegistry)", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    element = document.createElement("div");
    vi.spyOn(element, "addEventListener");
    vi.spyOn(element, "removeEventListener");
    removeAllEventListeners();
  });

  it('should warn and gracefully handle invalid element parameter', () => {
    const listener = vi.fn();
    const badEl = null as unknown as EventTarget;

    const id = addListener(badEl, 'click', listener, undefined, 'test-invalid');

    expect(id).toBeTruthy();
    expect(__testHasListener(id)).toBe(false);
    // Logger warning should be invoked
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should log error when underlying element.addEventListener throws', () => {
    const badEl = document.createElement('div');
    // Simulate DOM addEventListener throwing
    vi.spyOn(badEl, 'addEventListener').mockImplementation(() => {
      throw new Error('add-element-fail');
    });

    const id = addListener(badEl, 'click', vi.fn(), undefined, 'ctx');
    expect(id).toBeTruthy();
    // Should not be registered due to addEventListener throwing
    expect(__testHasListener(id)).toBe(false);
  });

  it("should register and retrieve listener", () => {
    const listener = vi.fn();
    const id = addListener(element, "click", listener, undefined, "test");

    const registered = __testGetListener(id);
    expect(registered).toBeDefined();
    expect(registered?.type).toBe("click");
    expect(registered?.listener).toBe(listener);
  });

  it("should unregister listener", () => {
    const listener = vi.fn();
    const id = addListener(element, "click", listener, undefined, "test");

    const result = removeEventListenerManaged(id);

    expect(result).toBe(true);
    expect(__testHasListener(id)).toBe(false);
  });

  it("should return false when unregistering non-existent listener", () => {
    const result = removeEventListenerManaged("non-existent");
    expect(result).toBe(false);
  });

  it("should drain all listeners via removeAllEventListeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const id1 = addListener(element, "click", listener1, undefined, "test");
    const id2 = addListener(element, "mouseover", listener2, undefined, "test");

    removeAllEventListeners();

    expect(__testHasListener(id1)).toBe(false);
    expect(__testHasListener(id2)).toBe(false);
    expect(getEventListenerStatus().total).toBe(0);
  });

  it("should return status", () => {
    const listener = vi.fn();

    addListener(element, "click", listener, undefined, "ctx1");
    addListener(element, "click", listener, undefined, "ctx2");
    addListener(element, "mouseover", listener, undefined, "ctx1");

    const status = getEventListenerStatus();

    expect(status.total).toBe(3);
    expect(status.byContext).toEqual({
      ctx1: 2,
      ctx2: 1,
    });
    expect(status.byType).toEqual({
      click: 2,
      mouseover: 1,
    });
  });

  it('should skip adding when signal is already aborted', () => {
    const controller = new AbortController();
    controller.abort();
    const listener = vi.fn();

    const id = addListener(element, 'click', listener, { signal: controller.signal }, 'ctx-abort');

    expect(__testHasListener(id)).toBe(false);
    // addEventListener should not have been called due to pre-aborted signal
    expect(element.addEventListener).not.toHaveBeenCalled();
  });

  it('should attach abort handler and remove listener on abort', () => {
    const controller = new AbortController();
    const listener = vi.fn();

    const id = addListener(element, 'click', listener, { signal: controller.signal }, 'ctx-abort2');
    expect(__testHasListener(id)).toBe(true);

    controller.abort();

    expect(__testHasListener(id)).toBe(false);
    expect(element.removeEventListener).toHaveBeenCalled();
  });

  it('should handle signal.addEventListener throwing gracefully', () => {
    const badSignal = {
      addEventListener: () => {
        throw new Error('fail-add');
      },
      removeEventListener: () => {},
      aborted: false,
    } as unknown as AbortSignal;

    const listener = vi.fn();
    // Should not throw when addEventListener throws internally
    const id = addListener(element, 'click', listener, { signal: badSignal }, 'ctx-fail');
    expect(id).toBeTruthy();
    // When signal.addEventListener throws synchronously, the DOM's addEventListener may throw
    // which prevents registry registration. We should not crash, and no registration should be present.
    expect(__testHasListener(id)).toBe(false);
    // Should log that addEventListener was not available
    expect(logger.debug).toHaveBeenCalledWith('AbortSignal addEventListener not available (ignored)', expect.any(Object));
  });

  it('should catch and log removeEventListener throwing during abort cleanup', () => {
    let onAbort: (() => void) | undefined;
    const badSignal = {
      addEventListener(_: string, cb: () => void) {
        onAbort = cb;
      },
      removeEventListener(_: string, _cb: () => void) {
        throw new Error('remove-fail');
      },
      aborted: false,
    } as unknown as AbortSignal;

    const listener = vi.fn();
    const id = addListener(element, 'click', listener, { signal: badSignal }, 'ctx-remove-fail');
    expect(id).toBeTruthy();
    expect(__testHasListener(id)).toBe(true);

    // Simulate abort triggering
    onAbort?.();

    // removeEventListener should be called in finally and the thrown error should be caught and logged
    expect(logger.debug).toHaveBeenCalledWith('AbortSignal removeEventListener safeguard failed (ignored)', expect.any(Object));
    expect(__testHasListener(id)).toBe(false);
  });
});
