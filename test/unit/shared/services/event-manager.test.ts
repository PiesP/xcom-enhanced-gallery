/**
 * @fileoverview Tests for EventManager service
 * @description Phase 600: Updated tests for unified EventManager
 *              Tests cover DOM event management, managed listeners, and gallery lifecycle
 */
import { EventManager } from "@shared/services/event-manager";
import * as listenerManager from "@shared/utils/events/core/listener-manager";
import { logger } from '@shared/logging';
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("EventManager", () => {
    let eventManager: EventManager;
    let container: HTMLDivElement;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton
        (EventManager as unknown as { instance: null }).instance = null;
        eventManager = EventManager.getInstance();
        container = document.createElement("div");
        document.body.appendChild(container);
        vi.spyOn(listenerManager, 'addListener');
        vi.spyOn(listenerManager, 'removeEventListenerManaged');
        vi.spyOn(logger, 'warn');
        vi.spyOn(logger, 'debug');
        vi.spyOn(logger, 'error');
    });

    afterEach(() => {
        eventManager.cleanupAll();
        container.remove();
        (EventManager as unknown as { instance: null }).instance = null;
    });

    describe("singleton pattern", () => {
        it("should return the same instance", () => {
            const instance1 = EventManager.getInstance();
            const instance2 = EventManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        it("should create new instance after null reset", () => {
            const instance1 = EventManager.getInstance();
            (EventManager as unknown as { instance: null }).instance = null;
            const instance2 = EventManager.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });

    describe("DOM event management", () => {
        it("should register and trigger DOM events", () => {
            const handler = vi.fn();
            eventManager.addEventListener(container, "click", handler);

            container.click();

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it("should register custom events", () => {
            const handler = vi.fn();
            eventManager.addCustomEventListener(container, "custom-event", handler);

            container.dispatchEvent(new CustomEvent("custom-event"));

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it("should track listener count", () => {
            const initialCount = eventManager.getListenerCount();

            eventManager.addEventListener(container, "click", vi.fn());
            expect(eventManager.getListenerCount()).toBe(initialCount + 1);

            eventManager.addEventListener(container, "keydown", vi.fn());
            expect(eventManager.getListenerCount()).toBe(initialCount + 2);
        });

        it("should cleanup all listeners", () => {
            eventManager.addEventListener(container, "click", vi.fn());
            eventManager.addEventListener(container, "keydown", vi.fn());

            eventManager.cleanup();

            expect(eventManager.getIsDestroyed()).toBe(true);
        });

        it("should return chainable this from addEventListener", () => {
            const result = eventManager.addEventListener(container, "click", vi.fn());
            expect(result).toBe(eventManager);
        });

        it("should return chainable this from addCustomEventListener", () => {
            const result = eventManager.addCustomEventListener(container, "custom", vi.fn());
            expect(result).toBe(eventManager);
        });
    });

    describe("managed listener pattern", () => {
        it("should add listener with ID", () => {
            const handler = vi.fn();
            const id = eventManager.addListener(container, "click", handler);

            expect(id).toBeTruthy();
            container.click();
            expect(handler).toHaveBeenCalled();
        });

        it("should remove listener by ID", () => {
            const handler = vi.fn();
            const id = eventManager.addListener(container, "click", handler);

            eventManager.removeListener(id);
            container.click();

            expect(handler).not.toHaveBeenCalled();
        });

        it("should remove listeners by context", () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            eventManager.addListener(container, "click", handler1, undefined, "test-context");
            eventManager.addListener(container, "keydown", handler2, undefined, "test-context");

            const removedCount = eventManager.removeByContext("test-context");

            expect(removedCount).toBe(2);
            container.click();
            container.dispatchEvent(new KeyboardEvent("keydown"));
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });
    });

    describe("handleTwitterEvent", () => {
        it("should register Twitter-specific events", () => {
            const handler = vi.fn();
            const id = eventManager.handleTwitterEvent(container, "click", handler, "twitter-context");

            expect(id).toBeTruthy();
            container.click();
            expect(handler).toHaveBeenCalled();
        });
    });

    describe("getUnifiedStatus", () => {
        it("should return unified status object", () => {
            const status = eventManager.getUnifiedStatus();

            expect(status).toHaveProperty("domEvents");
            expect(status).toHaveProperty("galleryEvents");
            expect(status).toHaveProperty("totalListeners");
            expect(status).toHaveProperty("isDestroyed");
        });
    });

    describe("destroyed state handling", () => {
        it("should warn when adding listeners after destruction", () => {
            eventManager.cleanup();

            eventManager.addEventListener(container, "click", vi.fn());
            eventManager.addCustomEventListener(container, "custom", vi.fn());

            // logger should capture warn messages
            expect(logger.warn).toHaveBeenCalledWith('addEventListener called on destroyed EventManager');
            expect(eventManager.getIsDestroyed()).toBe(true);
        });

        it("should return empty string when adding managed listener after destruction", () => {
            eventManager.cleanup();

            const id = eventManager.addListener(container, "click", vi.fn());

            expect(id).toBe("");
        });

        it("should return empty string when handling Twitter event after destruction", () => {
            eventManager.cleanup();

            const id = eventManager.handleTwitterEvent(container, "click", vi.fn());

            expect(id).toBe("");
        });
    });

    describe('internal delegation & error behavior', () => {
        it('should delegate addEventListener to listener-manager addListener', () => {
            const handler = vi.fn();
            eventManager.addEventListener(container, 'click', handler);

            expect(listenerManager.addListener).toHaveBeenCalledWith(
                container,
                'click',
                expect.any(Function),
                undefined,
                'EventManager:DOM'
            );
        });

        it('should call removeEventListenerManaged on cleanup and log debug', () => {
            const handler = vi.fn();
            // Let listener-manager return a fixed ID
            vi.mocked(listenerManager.addListener).mockReturnValue('em-cleanup-id');

            eventManager.addEventListener(container, 'click', handler);

            eventManager.cleanup();

            expect(listenerManager.removeEventListenerManaged).toHaveBeenCalledWith('em-cleanup-id');
            expect(logger.debug).toHaveBeenCalledWith('EventManager: DOM events cleanup completed', expect.objectContaining({ cleanupCount: 1 }));
        });

        it('should log warn when individual cleanup fails due to removal throwing', () => {
            const handler = vi.fn();

            // simulate managed listener id being returned and cleanup function invoking removal
            vi.mocked(listenerManager.addListener).mockReturnValue('em-cleanup-id');
            eventManager.addEventListener(container, 'click', handler);

            vi.mocked(listenerManager.removeEventListenerManaged).mockImplementationOnce(() => {
                throw new Error('Remove failure');
            });

            // invoke cleanup which should catch and warn
            eventManager.cleanup();
            expect(logger.warn).toHaveBeenCalledWith('EventManager: Failed to cleanup individual listener', expect.any(Error));
        });

        it('should log error when listener-manager addListener throws during addEventListener', () => {
            const handler = vi.fn();
            vi.mocked(listenerManager.addListener).mockImplementationOnce(() => {
                throw new Error('add-fail');
            });

            eventManager.addEventListener(container, 'click', handler);

            expect(logger.error).toHaveBeenCalledWith('EventManager: Failed to register DOM event listener', expect.objectContaining({ eventType: 'click', error: expect.any(Error) }));
        });
    });

        it('should log debug with id when adding DOM event listener', () => {
            const handler = vi.fn();
            // Return a known id from the mocked listener manager
            vi.mocked(listenerManager.addListener).mockReturnValue('debug-dom-id');

            eventManager.addEventListener(container, 'click', handler);

            expect(logger.debug).toHaveBeenCalledWith('EventManager: DOM event listener registered', expect.objectContaining({ id: 'debug-dom-id', eventType: 'click' }));
        });

        it('should log debug with id when adding custom event listener', () => {
            const handler = vi.fn();
            vi.mocked(listenerManager.addListener).mockReturnValue('debug-custom-id');

            eventManager.addCustomEventListener(container, 'custom', handler);

            expect(logger.debug).toHaveBeenCalledWith('EventManager: Custom event listener registered', expect.objectContaining({ id: 'debug-custom-id', eventType: 'custom' }));
        });

    describe("cleanupAll", () => {
        it("should cleanup both gallery and DOM events", () => {
            eventManager.addEventListener(container, "click", vi.fn());

            eventManager.cleanupAll();

            expect(eventManager.getIsDestroyed()).toBe(true);
        });

        it("should not throw when called multiple times", () => {
            eventManager.addEventListener(container, "click", vi.fn());

            eventManager.cleanupAll();
            expect(() => eventManager.cleanupAll()).not.toThrow();
        });

        it("should not call cleanup again if already destroyed", () => {
            eventManager.cleanup();
            // cleanupAll should not throw when isDestroyed is already true
            expect(() => eventManager.cleanupAll()).not.toThrow();
        });

        it('should not throw and should log warn when cleanupGallery throws', () => {
            vi.spyOn(eventManager, 'cleanupGallery').mockImplementation(() => {
                throw new Error('boom');
            });

            expect(() => eventManager.cleanupAll()).not.toThrow();
            expect(logger.warn).toHaveBeenCalledWith('EventManager: Failed to cleanup gallery events', expect.any(Error));
        });
    });

    describe("initializeGallery", () => {
        it("should return cleanup function", async () => {
            const handlers = {
                onMediaClick: vi.fn(),
                onGalleryClose: vi.fn(),
            };

            const cleanup = await eventManager.initializeGallery(handlers);

            expect(cleanup).toBeInstanceOf(Function);
            cleanup();
        });

        it("should initialize with custom options", async () => {
            const handlers = {
                onMediaClick: vi.fn(),
                onGalleryClose: vi.fn(),
            };

            const cleanup = await eventManager.initializeGallery(handlers, {
                enableKeyboard: true,
                enableMediaDetection: true,
                debugMode: false,
            });

            expect(cleanup).toBeInstanceOf(Function);
            cleanup();
        });
    });

    describe("getUnifiedStatus", () => {
        it("should return all status properties", () => {
            const status = eventManager.getUnifiedStatus();

            expect(status).toHaveProperty("domEvents");
            expect(status).toHaveProperty("galleryEvents");
            expect(status).toHaveProperty("totalListeners");
            expect(status).toHaveProperty("isDestroyed");

            expect(status.domEvents).toHaveProperty("listenerCount");
            expect(status.domEvents).toHaveProperty("isDestroyed");
        });

        it("should reflect listener count changes", () => {
            const initialStatus = eventManager.getUnifiedStatus();
            const initialCount = initialStatus.totalListeners;

            eventManager.addEventListener(container, "click", vi.fn());

            const updatedStatus = eventManager.getUnifiedStatus();
            expect(updatedStatus.totalListeners).toBe(initialCount + 1);
        });

        it("should reflect destroyed state", () => {
            expect(eventManager.getUnifiedStatus().isDestroyed).toBe(false);

            eventManager.cleanup();

            expect(eventManager.getUnifiedStatus().isDestroyed).toBe(true);
        });
    });

    describe("getGalleryStatus", () => {
        it("should return gallery event snapshot", () => {
            const status = eventManager.getGalleryStatus();

            expect(status).toHaveProperty("initialized");
            expect(status).toHaveProperty("isConnected");
        });
    });
});
