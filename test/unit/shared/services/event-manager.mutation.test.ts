/**
 * @fileoverview Mutation test coverage for EventManager
 * Target: Improve event-manager.ts from 70% to 85%+
 * Focus: Error handling, edge cases, conditional branches
 */
import { EventManager } from '@shared/services/event-manager';
import * as listenerManager from '@shared/utils/events/core/listener-manager';
import { logger } from '@shared/logging';

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EventManager mutation coverage', () => {
  let eventManager: EventManager;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    (EventManager as unknown as { instance: null }).instance = null;
    eventManager = EventManager.getInstance();
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(listenerManager, 'addListener');
    vi.spyOn(listenerManager, 'removeEventListenerManaged');
    vi.spyOn(listenerManager, 'removeEventListenersByContext');
  });

  afterEach(() => {
    eventManager.cleanupAll();
    container.remove();
    (EventManager as unknown as { instance: null }).instance = null;
  });

  describe('addEventListener error handling', () => {
    it('should log error when addListener throws', () => {
      vi.mocked(listenerManager.addListener).mockImplementationOnce(() => {
        throw new Error('Registration failed');
      });

      const result = eventManager.addEventListener(container, 'click', vi.fn());

      expect(result).toBe(eventManager);
      expect(logger.error).toHaveBeenCalledWith(
        'EventManager: Failed to register DOM event listener',
        expect.objectContaining({
          eventType: 'click',
          error: expect.any(Error),
        })
      );
    });

    it('should not log warning when element is null but not destroyed', () => {
      vi.mocked(logger.warn).mockClear();

      eventManager.addEventListener(null, 'click', vi.fn());

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log warning and return this when element is null AND destroyed', () => {
      eventManager.cleanup();
      vi.mocked(logger.warn).mockClear();

      const result = eventManager.addEventListener(null, 'click', vi.fn());

      expect(result).toBe(eventManager);
      expect(logger.warn).toHaveBeenCalledWith('addEventListener called on destroyed EventManager');
    });
  });

  describe('addCustomEventListener error handling', () => {
    it('should log error when addListener throws for custom events', () => {
      vi.mocked(listenerManager.addListener).mockImplementationOnce(() => {
        throw new Error('Custom registration failed');
      });

      const result = eventManager.addCustomEventListener(container, 'custom:event', vi.fn());

      expect(result).toBe(eventManager);
      expect(logger.error).toHaveBeenCalledWith(
        'EventManager: Failed to register custom event listener',
        expect.objectContaining({
          eventType: 'custom:event',
          error: expect.any(Error),
        })
      );
    });

    it('should log warning when called on destroyed manager with custom event', () => {
      eventManager.cleanup();
      vi.mocked(logger.warn).mockClear();

      eventManager.addCustomEventListener(container, 'custom:event', vi.fn());

      expect(logger.warn).toHaveBeenCalledWith('addCustomEventListener called on destroyed EventManager');
    });

    it('should not log warning when element is null but manager is not destroyed', () => {
      vi.mocked(logger.warn).mockClear();

      eventManager.addCustomEventListener(null, 'custom:event', vi.fn());

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should return manager instance when element is null', () => {
      const result = eventManager.addCustomEventListener(null, 'custom:event', vi.fn());
      expect(result).toBe(eventManager);
    });
  });

  describe('addListener warnings on destroyed instance', () => {
    it('should warn and return empty string when destroyed', () => {
      eventManager.cleanup();
      vi.mocked(logger.warn).mockClear();

      const id = eventManager.addListener(container, 'click', vi.fn());

      expect(id).toBe('');
      expect(logger.warn).toHaveBeenCalledWith('EventManager: addListener called on destroyed instance');
    });
  });

  describe('cleanup edge cases', () => {
    it('should not re-cleanup when already destroyed', () => {
      eventManager.cleanup();
      vi.mocked(logger.debug).mockClear();

      eventManager.cleanup();

      // Should not log cleanup completed again
      expect(logger.debug).not.toHaveBeenCalledWith(
        'EventManager: DOM events cleanup completed',
        expect.anything()
      );
    });

    it('should handle cleanup when no listeners were added', () => {
      eventManager.cleanup();

      expect(eventManager.getIsDestroyed()).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith(
        'EventManager: DOM events cleanup completed',
        expect.objectContaining({ cleanupCount: 0 })
      );
    });

    it('should count multiple cleanups correctly', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('id-1');
      eventManager.addEventListener(container, 'click', vi.fn());

      vi.mocked(listenerManager.addListener).mockReturnValue('id-2');
      eventManager.addEventListener(container, 'keydown', vi.fn());

      vi.mocked(listenerManager.addListener).mockReturnValue('id-3');
      eventManager.addCustomEventListener(container, 'custom', vi.fn());

      eventManager.cleanup();

      expect(logger.debug).toHaveBeenCalledWith(
        'EventManager: DOM events cleanup completed',
        expect.objectContaining({ cleanupCount: 3 })
      );
    });
  });

  describe('handleTwitterEvent edge cases', () => {
    it('should pass undefined options to addListener', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('twitter-id');

      eventManager.handleTwitterEvent(container, 'click', vi.fn(), 'twitter-context');

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        container,
        'click',
        expect.any(Function),
        undefined,
        'twitter-context'
      );
    });

    it('should work without context', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('twitter-id');

      const id = eventManager.handleTwitterEvent(container, 'click', vi.fn());

      expect(id).toBe('twitter-id');
    });
  });

  describe('removeListener and removeByContext', () => {
    it('should delegate removeListener to removeEventListenerManaged', () => {
      vi.mocked(listenerManager.removeEventListenerManaged).mockReturnValue(true);

      const result = eventManager.removeListener('test-id');

      expect(result).toBe(true);
      expect(listenerManager.removeEventListenerManaged).toHaveBeenCalledWith('test-id');
    });

    it('should delegate removeByContext to removeEventListenersByContext', () => {
      vi.mocked(listenerManager.removeEventListenersByContext).mockReturnValue(5);

      const result = eventManager.removeByContext('my-context');

      expect(result).toBe(5);
      expect(listenerManager.removeEventListenersByContext).toHaveBeenCalledWith('my-context');
    });
  });

  describe('getUnifiedStatus detailed structure', () => {
    it('should return correct structure with all properties', () => {
      const status = eventManager.getUnifiedStatus();

      expect(status).toMatchObject({
        domEvents: {
          listenerCount: expect.any(Number),
          isDestroyed: false,
        },
        galleryEvents: expect.anything(),
        totalListeners: expect.any(Number),
        isDestroyed: false,
      });
    });

    it('should accurately reflect listener count in domEvents', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('id-1');
      eventManager.addEventListener(container, 'click', vi.fn());

      vi.mocked(listenerManager.addListener).mockReturnValue('id-2');
      eventManager.addEventListener(container, 'keydown', vi.fn());

      const status = eventManager.getUnifiedStatus();

      expect(status.domEvents.listenerCount).toBe(2);
      expect(status.totalListeners).toBe(2);
    });
  });

  describe('cleanupAll behavior', () => {
    it('should call cleanupGallery before cleanup', () => {
      const cleanupGallerySpy = vi.spyOn(eventManager, 'cleanupGallery');

      eventManager.cleanupAll();

      expect(cleanupGallerySpy).toHaveBeenCalled();
    });

    it('should log complete cleanup message', () => {
      eventManager.cleanupAll();

      expect(logger.debug).toHaveBeenCalledWith('EventManager complete cleanup');
    });

    it('should not call cleanup if already destroyed', () => {
      eventManager.cleanup();
      vi.mocked(logger.debug).mockClear();

      eventManager.cleanupAll();

      // Should only log complete cleanup, not DOM cleanup
      expect(logger.debug).toHaveBeenCalledWith('EventManager complete cleanup');
      expect(logger.debug).not.toHaveBeenCalledWith(
        'EventManager: DOM events cleanup completed',
        expect.anything()
      );
    });
  });

  describe('onInitialize and onDestroy lifecycle', () => {
    it('should complete initialization successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (eventManager as any).onInitialize();

      expect(logger.debug).toHaveBeenCalledWith('EventManager initialization completed');
    });

    it('should log destroy message', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (eventManager as any).onDestroy();

      expect(logger.debug).toHaveBeenCalledWith('EventManager destroyed');
    });
  });

  describe('addEventListener with different element types', () => {
    it('should work with Document', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('doc-id');

      const result = eventManager.addEventListener(document, 'click', vi.fn());

      expect(result).toBe(eventManager);
      expect(listenerManager.addListener).toHaveBeenCalledWith(
        document,
        'click',
        expect.any(Function),
        undefined,
        'EventManager:DOM'
      );
    });

    it('should work with Window', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('win-id');

      const result = eventManager.addEventListener(window, 'resize', vi.fn());

      expect(result).toBe(eventManager);
      expect(listenerManager.addListener).toHaveBeenCalledWith(
        window,
        'resize',
        expect.any(Function),
        undefined,
        'EventManager:DOM'
      );
    });
  });

  describe('addEventListener with options', () => {
    it('should pass options to addListener', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('id-with-options');
      const options = { passive: true, capture: true, once: true };

      eventManager.addEventListener(container, 'scroll', vi.fn(), options);

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        container,
        'scroll',
        expect.any(Function),
        options,
        'EventManager:DOM'
      );
    });

    it('should pass signal option', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('id-with-signal');
      const controller = new AbortController();
      const options = { signal: controller.signal };

      eventManager.addEventListener(container, 'click', vi.fn(), options);

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        container,
        'click',
        expect.any(Function),
        expect.objectContaining({ signal: controller.signal }),
        'EventManager:DOM'
      );
    });
  });

  describe('addCustomEventListener context', () => {
    it('should use EventManager:Custom context', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('custom-id');

      eventManager.addCustomEventListener(container, 'my:custom:event', vi.fn());

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        container,
        'my:custom:event',
        expect.any(Function),
        undefined,
        'EventManager:Custom'
      );
    });

    it('should pass options to custom event listener', () => {
      vi.mocked(listenerManager.addListener).mockReturnValue('custom-id');
      const options = { capture: true };

      eventManager.addCustomEventListener(container, 'custom', vi.fn(), options);

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        container,
        'custom',
        expect.any(Function),
        options,
        'EventManager:Custom'
      );
    });
  });
});
