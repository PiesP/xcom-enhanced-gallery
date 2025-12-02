/**
 * @fileoverview Tests for DomEventManager (deprecated)
 * @description Phase 600: DomEventManager is deprecated in favor of EventManager.
 *              These tests are kept for backward compatibility verification.
 *              New code should use EventManager.getInstance() from @shared/services/event-manager.
 */
import { createDomEventManager, DomEventManager } from "@shared/dom/dom-event-manager";
import { EventManager } from "@shared/services/event-manager";
import * as listenerManager from "@shared/utils/events/core/listener-manager";
import { logger } from "@shared/logging";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("DomEventManager (deprecated)", () => {
  let manager: DomEventManager;
  let element: HTMLElement;

  beforeEach(() => {
    manager = new DomEventManager();
    element = document.createElement("div");
    vi.spyOn(listenerManager, "addListener");
    vi.spyOn(listenerManager, "removeEventListenerManaged");
    vi.spyOn(EventManager, "getInstance");
    // Spy on the singleton prototype methods used by DomEventManager so calls are
    // captured regardless of whether they're invoked on the instance or prototype.
    vi.spyOn(EventManager.prototype, "addListener");
    vi.spyOn(EventManager.prototype, "removeListener");
    // Spy on logger for assertions around logging behavior
    vi.spyOn(logger, "debug");
    vi.spyOn(logger, "warn");
    vi.spyOn(logger, "error");
  });

  afterEach(() => {
    manager.cleanup();
    vi.restoreAllMocks();
  });

  it("should register event listener using listenerManager", () => {
    const handler = vi.fn();
    manager.addEventListener(element, "click", handler);

    expect(listenerManager.addListener).toHaveBeenCalledWith(
      element,
      "click",
      handler,
      undefined,
      "DomEventManager",
    );
  });

  it("should register custom event listener using listenerManager", () => {
    const handler = vi.fn();
    manager.addCustomEventListener(element, "custom-event", handler);

    expect(listenerManager.addListener).toHaveBeenCalledWith(
      element,
      "custom-event",
      handler,
      undefined,
      "DomEventManager:Custom",
    );
  });

  it("should log debug message when registering DOM event listener", () => {
    const handler = vi.fn();
    manager.addEventListener(element, "click", handler);

    expect(logger.debug).toHaveBeenCalledWith(
      "DOM EM: Event listener registered",
      expect.objectContaining({ eventType: "click", options: undefined, id: expect.any(String) }),
    );
  });

  it("should log debug message when registering custom event listener", () => {
    const handler = vi.fn();
    manager.addCustomEventListener(element, "custom-event", handler);

    expect(logger.debug).toHaveBeenCalledWith(
      "DOM EM: Custom event listener registered",
      expect.objectContaining({ eventType: "custom-event", options: undefined, id: expect.any(String) }),
    );
  });

  it("should cleanup listeners", () => {
    const handler = vi.fn();
    // Mock addListener to return a fake ID
    vi.mocked(listenerManager.addListener).mockReturnValue("test-id");

    manager.addEventListener(element, "click", handler);
    manager.cleanup();

    // New unified cleanup: DomEventManager uses EventManager.removeListener
    expect(EventManager.prototype.removeListener).toHaveBeenCalledWith("test-id");
    expect(manager.getIsDestroyed()).toBe(true);
    // logger imported at module top
    expect(logger.debug).toHaveBeenCalledWith(
      "DOM EM: All event listeners cleanup completed",
      expect.objectContaining({ cleanupCount: 1 }),
    );
  });

  it("should not register listeners if destroyed", () => {
    manager.cleanup();
    const handler = vi.fn();
    manager.addEventListener(element, "click", handler);

    expect(listenerManager.addListener).not.toHaveBeenCalled();
  });

  it("should not register custom listeners if destroyed", () => {
    manager.cleanup();
    const handler = vi.fn();
    manager.addCustomEventListener(element, "click", handler);

    expect(listenerManager.addListener).not.toHaveBeenCalled();
  });

  it("should return listener count", () => {
    const handler = vi.fn();
    manager.addEventListener(element, "click", handler);
    manager.addEventListener(element, "mouseover", handler);

    expect(manager.getListenerCount()).toBe(2);
  });

  it("should handle null element gracefully", () => {
    const handler = vi.fn();
    manager.addEventListener(null, "click", handler);
    expect(listenerManager.addListener).not.toHaveBeenCalled();
  });

  it("should handle null element gracefully for custom events", () => {
    const handler = vi.fn();
    manager.addCustomEventListener(null, "custom", handler);
    expect(listenerManager.addListener).not.toHaveBeenCalled();
  });

  describe("chainable API", () => {
    it("should return this from addEventListener for chaining", () => {
      const result = manager.addEventListener(element, "click", vi.fn());
      expect(result).toBe(manager);
    });

    it("should return this from addCustomEventListener for chaining", () => {
      const result = manager.addCustomEventListener(element, "custom", vi.fn());
      expect(result).toBe(manager);
    });

    it("should allow method chaining", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      manager
        .addEventListener(element, "click", handler1)
        .addEventListener(element, "mouseover", handler2)
        .addCustomEventListener(element, "custom", vi.fn());

      expect(manager.getListenerCount()).toBe(3);
    });

    it("should return this even when destroyed", () => {
      manager.cleanup();
      const result = manager.addEventListener(element, "click", vi.fn());
      expect(result).toBe(manager);
    });

    it("should return this for null element", () => {
      const result = manager.addEventListener(null, "click", vi.fn());
      expect(result).toBe(manager);
    });
  });

  describe("delegation to EventManager", () => {
    it("should delegate addEventListener to EventManager.addListener", () => {
      const handler = vi.fn();
      const em = EventManager.getInstance();

      // Ensure addListener returns a fake id so cleanup can use it
      vi.mocked(em.addListener).mockReturnValue("em-id-1");

      manager.addEventListener(element, "click", handler);

      expect(em.addListener).toHaveBeenCalledWith(
        element,
        "click",
        expect.any(Function),
        undefined,
        "DomEventManager",
      );

      // For DOM events, the cleanup now uses EventManager.removeListener
      manager.cleanup();

      expect(EventManager.prototype.removeListener).toHaveBeenCalledWith("em-id-1");
    });

    it("should fallback to low-level removal when EventManager.removeListener throws", () => {
      const handler = vi.fn();
      const em = EventManager.getInstance();

      vi.mocked(em.addListener).mockReturnValue("em-id-2");
      vi.mocked(em.removeListener).mockImplementationOnce(() => {
        throw new Error("remove failed");
      });

      // Spy on the low-level fallback removal (expected if EventManager.removeListener throws)
      vi.spyOn(listenerManager, "removeEventListenerManaged");

      // Use custom event path which delegates cleanup through EventManager.removeListener
      manager.addCustomEventListener(element, "click", handler);
      expect(manager.getListenerCount()).toBe(1);

      // Should not throw and should call low-level removeEventListenerManaged after exception
      // logger imported at module top
      expect(() => manager.cleanup()).not.toThrow();
      expect(listenerManager.removeEventListenerManaged).toHaveBeenCalledWith("em-id-2");
      expect(logger.warn).toHaveBeenCalledWith(
        "DOM EM: EventManager.removeListener failed - falling back to low-level removal",
        expect.any(Error),
      );

    });

    it("should fallback to low-level removal for DOM events when EventManager.removeListener throws", () => {
      const handler = vi.fn();
      const em = EventManager.getInstance();

      vi.mocked(em.addListener).mockReturnValue("em-id-4");
      vi.mocked(em.removeListener).mockImplementationOnce(() => {
        throw new Error("remove failed");
      });

      vi.spyOn(listenerManager, "removeEventListenerManaged");

      manager.addEventListener(element, "click", handler);
      expect(manager.getListenerCount()).toBe(1);

      // Should not throw and should call low-level removeEventListenerManaged after exception
      // logger imported at module top
      expect(() => manager.cleanup()).not.toThrow();
      expect(listenerManager.removeEventListenerManaged).toHaveBeenCalledWith("em-id-4");
      expect(logger.warn).toHaveBeenCalledWith(
        "DOM EM: EventManager.removeListener failed - falling back to low-level removal",
        expect.any(Error),
      );
    });

    it("should delegate addCustomEventListener cleanup to EventManager.removeListener", () => {
      const handler = vi.fn();
      const em = EventManager.getInstance();

      vi.mocked(em.addListener).mockReturnValue("em-id-3");
      manager.addCustomEventListener(element, "custom-event", handler);

      expect(em.addListener).toHaveBeenCalledWith(
        element,
        "custom-event",
        expect.any(Function),
        undefined,
        "DomEventManager:Custom",
      );

      manager.cleanup();

      expect(em.removeListener).toHaveBeenCalledWith("em-id-3");
    });
  });

  describe("cleanup behavior", () => {
    it("should be idempotent - multiple cleanup calls should not error", () => {
      vi.mocked(listenerManager.addListener).mockReturnValue("test-id");
      manager.addEventListener(element, "click", vi.fn());

      manager.cleanup();
      vi.clearAllMocks();
      manager.cleanup(); // Second call

      // Should not call EventManager.removeListener again
      expect(EventManager.prototype.removeListener).not.toHaveBeenCalled();
    });

    it("should continue cleanup even if individual cleanup fails", () => {
      vi.mocked(listenerManager.addListener)
        .mockReturnValueOnce("id-1")
        .mockReturnValueOnce("id-2");

      manager.addEventListener(element, "click", vi.fn());
      manager.addEventListener(element, "mouseover", vi.fn());

      // First cleanup throws at EventManager level
      vi.mocked(EventManager.prototype.removeListener)
        .mockImplementationOnce(() => {
          throw new Error("Cleanup error");
        })
        .mockImplementationOnce(() => true);

      // Fallback should invoke low-level removal for the first id
      vi.spyOn(listenerManager, 'removeEventListenerManaged');
      // Make the low-level removal also fail to trigger the outer cleanup catch
      vi.mocked(listenerManager.removeEventListenerManaged).mockImplementationOnce(() => {
        throw new Error('Second cleanup error');
      });

      // Should not throw and should continue to second cleanup
      expect(() => manager.cleanup()).not.toThrow();
      expect(EventManager.prototype.removeListener).toHaveBeenCalledTimes(2);
      // Ensure fallback was used for failing case
      expect(listenerManager.removeEventListenerManaged).toHaveBeenCalledTimes(1);
      // Ensure warning was logged for the failing cleanup (outer catch path)
      expect(logger.warn).toHaveBeenCalledWith(
        "DOM EM: Failed to cleanup individual listener",
        expect.any(Error),
      );
    });

    it("should clear cleanups array after cleanup", () => {
      vi.mocked(listenerManager.addListener).mockReturnValue("test-id");
      manager.addEventListener(element, "click", vi.fn());

      expect(manager.getListenerCount()).toBe(1);
      manager.cleanup();
      expect(manager.getListenerCount()).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should handle addListener throwing error", () => {
      vi.mocked(listenerManager.addListener).mockImplementation(() => {
        throw new Error("Add listener failed");
      });

      // Should not throw and should log error
      // logger imported at module top
      expect(() => manager.addEventListener(element, "click", vi.fn())).not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "DOM EM: Failed to register event listener",
        expect.objectContaining({ eventType: "click", error: expect.any(Error) }),
      );
    });

    it("should handle addListener error for custom events", () => {
      vi.mocked(listenerManager.addListener).mockImplementation(() => {
        throw new Error("Add custom listener failed");
      });

      // logger imported at module top
      expect(() => manager.addCustomEventListener(element, "custom", vi.fn())).not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "DOM EM: Failed to register custom event listener",
        expect.objectContaining({ eventType: "custom", error: expect.any(Error) }),
      );
    });
  });

  describe("event options", () => {
    it("should pass options to addEventListener", () => {
      const options = { passive: true, capture: true };
      manager.addEventListener(element, "scroll", vi.fn(), options);

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        element,
        "scroll",
        expect.any(Function),
        options,
        "DomEventManager",
      );
    });

    it("should pass options to addCustomEventListener", () => {
      const options = { once: true };
      manager.addCustomEventListener(element, "custom", vi.fn(), options);

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        element,
        "custom",
        expect.any(Function),
        options,
        "DomEventManager:Custom",
      );
    });
  });

  describe("Document and Window targets", () => {
    it("should register event on Document", () => {
      manager.addEventListener(document, "click", vi.fn());

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        document,
        "click",
        expect.any(Function),
        undefined,
        "DomEventManager",
      );
    });

    it("should register event on Window", () => {
      manager.addEventListener(window, "resize", vi.fn());

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        window,
        "resize",
        expect.any(Function),
        undefined,
        "DomEventManager",
      );
    });
  });
});

describe("createDomEventManager factory", () => {
  it("should create a new DomEventManager instance", () => {
    const manager = createDomEventManager();
    expect(manager).toBeInstanceOf(DomEventManager);
  });

  it("should create independent instances", () => {
    const manager1 = createDomEventManager();
    const manager2 = createDomEventManager();
    expect(manager1).not.toBe(manager2);
  });
});
