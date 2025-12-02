import {
  cleanupGalleryEvents,
  initializeGalleryEvents,
} from '@shared/utils/events/lifecycle/gallery-lifecycle';
import type { EventHandlers } from '@shared/utils/events/core/event-context';
import * as listenerManager from '@shared/utils/events/core/listener-manager';
import * as keyboardModule from '@shared/utils/events/handlers/keyboard';
import * as mediaClickModule from '@shared/utils/events/handlers/media-click';

// Mock dependencies
vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@shared/utils/events/core/listener-manager', () => ({
  addListener: vi.fn(),
  removeEventListenersByContext: vi.fn(),
}));

vi.mock('@shared/utils/events/handlers/keyboard', () => ({
  handleKeyboardEvent: vi.fn(),
}));

vi.mock('@shared/utils/events/handlers/media-click', () => ({
  handleMediaClick: vi.fn().mockResolvedValue({ handled: false }),
}));

vi.mock('@shared/utils/events/keyboard-debounce', () => ({
  resetKeyboardDebounceState: vi.fn(),
}));

describe('gallery-lifecycle mutation tests', () => {
  const createMockHandlers = (): EventHandlers => ({
    onMediaClick: vi.fn().mockResolvedValue(undefined),
    onGalleryClose: vi.fn(),
    onKeyboardEvent: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cleanupGalleryEvents();
  });

  afterEach(() => {
    cleanupGalleryEvents();
    vi.restoreAllMocks();
  });

  describe('event handler registration', () => {
    it('should not register keyboard listener when enableKeyboard is false', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        enableKeyboard: false,
        enableMediaDetection: true,
      });

      const addListenerCalls = vi.mocked(listenerManager.addListener).mock.calls;
      const keydownCalls = addListenerCalls.filter(call => call[1] === 'keydown');
      const clickCalls = addListenerCalls.filter(call => call[1] === 'click');

      expect(keydownCalls.length).toBe(0);
      expect(clickCalls.length).toBe(1);
    });

    it('should not register click listener when enableMediaDetection is false', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        enableKeyboard: true,
        enableMediaDetection: false,
      });

      const addListenerCalls = vi.mocked(listenerManager.addListener).mock.calls;
      const keydownCalls = addListenerCalls.filter(call => call[1] === 'keydown');
      const clickCalls = addListenerCalls.filter(call => call[1] === 'click');

      expect(keydownCalls.length).toBe(1);
      expect(clickCalls.length).toBe(0);
    });

    it('should use document.body as event target when no root element provided', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers);

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        document.body,
        expect.any(String),
        expect.any(Function),
        expect.any(Object),
        expect.any(String),
      );
    });

    it('should use custom root element when provided', async () => {
      const handlers = createMockHandlers();
      const customRoot = document.createElement('div');

      await initializeGalleryEvents(handlers, customRoot);

      expect(listenerManager.addListener).toHaveBeenCalledWith(
        customRoot,
        expect.any(String),
        expect.any(Function),
        expect.any(Object),
        expect.any(String),
      );
    });
  });

  describe('event propagation', () => {
    it('should prevent event bubbling when result is handled and preventBubbling is true', async () => {
      const handlers = createMockHandlers();

      vi.mocked(mediaClickModule.handleMediaClick).mockResolvedValue({
        handled: true,
      });

      await initializeGalleryEvents(handlers, {
        enableKeyboard: false,
        enableMediaDetection: true,
        preventBubbling: true,
      });

      // Get the click handler that was registered
      const addListenerCall = vi.mocked(listenerManager.addListener).mock.calls.find(
        call => call[1] === 'click',
      );
      expect(addListenerCall).toBeDefined();

      const clickHandler = addListenerCall![2] as EventListener;
      const mockEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as MouseEvent;

      await clickHandler(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not prevent bubbling when result is not handled', async () => {
      const handlers = createMockHandlers();

      vi.mocked(mediaClickModule.handleMediaClick).mockResolvedValue({
        handled: false,
      });

      await initializeGalleryEvents(handlers, {
        enableKeyboard: false,
        enableMediaDetection: true,
        preventBubbling: true,
      });

      const addListenerCall = vi.mocked(listenerManager.addListener).mock.calls.find(
        call => call[1] === 'click',
      );
      const clickHandler = addListenerCall![2] as EventListener;
      const mockEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as MouseEvent;

      await clickHandler(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('keyboard handler invocation', () => {
    it('should invoke handleKeyboardEvent when keydown event occurs', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        enableKeyboard: true,
        enableMediaDetection: false,
      });

      const addListenerCall = vi.mocked(listenerManager.addListener).mock.calls.find(
        call => call[1] === 'keydown',
      );
      expect(addListenerCall).toBeDefined();

      const keyHandler = addListenerCall![2] as EventListener;
      const mockEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });

      keyHandler(mockEvent);

      expect(keyboardModule.handleKeyboardEvent).toHaveBeenCalledWith(
        mockEvent,
        handlers,
        expect.objectContaining({ enableKeyboard: true }),
      );
    });
  });

  describe('debug mode logging', () => {
    it('should log debug info when debugMode is enabled', async () => {
      const { logger } = await import('@shared/logging');
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        debugMode: true,
        context: 'test-debug',
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '[GalleryEvents] Event listeners registered',
        expect.objectContaining({ context: 'test-debug' }),
      );
    });

    it('should not log debug info when debugMode is disabled', async () => {
      const { logger } = await import('@shared/logging');
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        debugMode: false,
        context: 'test-no-debug',
      });

      expect(logger.debug).not.toHaveBeenCalled();
    });
  });

  describe('cleanup behavior', () => {
    it('should call removeEventListenersByContext with correct context', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, { context: 'cleanup-test' });
      cleanupGalleryEvents();

      expect(listenerManager.removeEventListenersByContext).toHaveBeenCalledWith('cleanup-test');
    });

    it('should not call removeEventListenersByContext when not initialized', () => {
      // Ensure we start uninitialized by calling cleanup first
      cleanupGalleryEvents();
      vi.clearAllMocks();

      // Call cleanup when not initialized
      cleanupGalleryEvents();

      // Should early return and not call removeEventListenersByContext
      expect(listenerManager.removeEventListenersByContext).not.toHaveBeenCalled();
    });

    it('should only call removeEventListenersByContext when listenerContext exists', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, { context: 'valid-context' });

      // Clean up once (this should call removeEventListenersByContext)
      cleanupGalleryEvents();

      // Verify it was called
      expect(listenerManager.removeEventListenersByContext).toHaveBeenCalledTimes(1);
      expect(listenerManager.removeEventListenersByContext).toHaveBeenCalledWith('valid-context');
    });
  });

  describe('null/missing handlers', () => {
    it('should return early and log error when handlers is null', async () => {
      const { logger } = await import('@shared/logging');

      // Pass null handlers
      const cleanup = await initializeGalleryEvents(
        null as unknown as EventHandlers,
      );

      expect(logger.error).toHaveBeenCalledWith('[GalleryLifecycle] Missing handlers');
      // Should return a no-op cleanup function
      expect(typeof cleanup).toBe('function');

      // No listeners should be registered
      expect(listenerManager.addListener).not.toHaveBeenCalled();
    });

    it('should return early and log error when handlers is undefined', async () => {
      const { logger } = await import('@shared/logging');

      const cleanup = await initializeGalleryEvents(
        undefined as unknown as EventHandlers,
      );

      expect(logger.error).toHaveBeenCalledWith('[GalleryLifecycle] Missing handlers');
      expect(typeof cleanup).toBe('function');
      expect(listenerManager.addListener).not.toHaveBeenCalled();
    });
  });

  describe('re-initialization warning', () => {
    it('should warn and cleanup when already initialized', async () => {
      const { logger } = await import('@shared/logging');
      const handlers = createMockHandlers();

      // Initialize first time
      await initializeGalleryEvents(handlers, { context: 'first-init' });
      vi.clearAllMocks();

      // Initialize again without explicit cleanup
      await initializeGalleryEvents(handlers, { context: 'second-init' });

      // Should warn about re-initialization
      expect(logger.warn).toHaveBeenCalledWith(
        '[GalleryLifecycle] Already initialized, re-initializing',
      );

      // Should have cleaned up the old context
      expect(listenerManager.removeEventListenersByContext).toHaveBeenCalledWith('first-init');
    });
  });

  describe('listener options', () => {
    it('should register listeners with capture: true option', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        enableKeyboard: true,
        enableMediaDetection: true,
      });

      // Check that addListener was called with capture: true
      const calls = vi.mocked(listenerManager.addListener).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      for (const call of calls) {
        const options = call[3] as AddEventListenerOptions;
        expect(options.capture).toBe(true);
      }
    });

    it('should register listeners with passive: false option', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        enableKeyboard: true,
        enableMediaDetection: true,
      });

      const calls = vi.mocked(listenerManager.addListener).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      for (const call of calls) {
        const options = call[3] as AddEventListenerOptions;
        expect(options.passive).toBe(false);
      }
    });

    it('should pass both capture and passive options to listener', async () => {
      const handlers = createMockHandlers();

      await initializeGalleryEvents(handlers, {
        enableKeyboard: true,
        enableMediaDetection: false,
      });

      // Verify keydown listener has correct options
      const keydownCall = vi.mocked(listenerManager.addListener).mock.calls.find(
        call => call[1] === 'keydown',
      );
      expect(keydownCall).toBeDefined();

      const options = keydownCall![3] as AddEventListenerOptions;
      expect(options).toEqual({
        capture: true,
        passive: false,
      });
    });
  });
});
