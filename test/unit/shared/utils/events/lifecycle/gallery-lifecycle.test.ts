import {
  cleanupGalleryEvents,
  getGalleryEventSnapshot,
  initializeGalleryEvents,
  updateGalleryEventOptions,
} from '@shared/utils/events/lifecycle/gallery-lifecycle';
import type { EventHandlers } from '@shared/utils/events/core/event-context';

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

describe('gallery-lifecycle', () => {
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

  describe('initializeGalleryEvents', () => {
    it('should initialize with default options', async () => {
      const handlers = createMockHandlers();

      const cleanup = await initializeGalleryEvents(handlers);

      expect(typeof cleanup).toBe('function');

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);
      expect(snapshot.isConnected).toBe(true);
    });

    it('should initialize with custom options', async () => {
      const handlers = createMockHandlers();
      const options = {
        enableKeyboard: true,
        enableMediaDetection: false,
        debugMode: true,
        context: 'custom-context',
      };

      await initializeGalleryEvents(handlers, options);

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);
      expect(snapshot.options?.context).toBe('custom-context');
    });

    it('should initialize with HTMLElement as second argument', async () => {
      const handlers = createMockHandlers();
      const rootElement = document.createElement('div');

      await initializeGalleryEvents(handlers, rootElement);

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);
    });

    it('should return noop function when handlers are missing', async () => {
      const cleanup = await initializeGalleryEvents(null as unknown as EventHandlers);

      expect(typeof cleanup).toBe('function');
      cleanup(); // Should not throw

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(false);
    });

    it('should cleanup and re-initialize when already initialized', async () => {
      const handlers1 = createMockHandlers();
      const handlers2 = createMockHandlers();

      await initializeGalleryEvents(handlers1);
      const snapshot1 = getGalleryEventSnapshot();
      expect(snapshot1.initialized).toBe(true);

      await initializeGalleryEvents(handlers2);
      const snapshot2 = getGalleryEventSnapshot();
      expect(snapshot2.initialized).toBe(true);
    });

    it('should use default context when context is empty string', async () => {
      const handlers = createMockHandlers();
      const options = {
        context: '   ', // Empty after trim
      };

      await initializeGalleryEvents(handlers, options);

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.options?.context).toBe('gallery');
    });

    it('should return cleanup function that cleans up events', async () => {
      const handlers = createMockHandlers();

      const cleanup = await initializeGalleryEvents(handlers);

      expect(getGalleryEventSnapshot().initialized).toBe(true);

      cleanup();

      expect(getGalleryEventSnapshot().initialized).toBe(false);
    });
  });

  describe('cleanupGalleryEvents', () => {
    it('should do nothing when not initialized', () => {
      const snapshot1 = getGalleryEventSnapshot();
      expect(snapshot1.initialized).toBe(false);

      cleanupGalleryEvents();

      const snapshot2 = getGalleryEventSnapshot();
      expect(snapshot2.initialized).toBe(false);
    });

    it('should cleanup when initialized', async () => {
      const handlers = createMockHandlers();
      await initializeGalleryEvents(handlers);

      expect(getGalleryEventSnapshot().initialized).toBe(true);

      cleanupGalleryEvents();

      expect(getGalleryEventSnapshot().initialized).toBe(false);
    });
  });

  describe('updateGalleryEventOptions', () => {
    it('should update options when initialized', async () => {
      const handlers = createMockHandlers();
      await initializeGalleryEvents(handlers, {
        debugMode: false,
        context: 'test',
      });

      updateGalleryEventOptions({ debugMode: true });

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.options?.debugMode).toBe(true);
    });

    it('should do nothing when not initialized', () => {
      updateGalleryEventOptions({ debugMode: true });

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.options).toBeNull();
    });
  });

  describe('getGalleryEventSnapshot', () => {
    it('should return initial state when not initialized', () => {
      const snapshot = getGalleryEventSnapshot();

      expect(snapshot.initialized).toBe(false);
      expect(snapshot.options).toBeNull();
      expect(snapshot.isConnected).toBe(false);
    });

    it('should return current state when initialized', async () => {
      const handlers = createMockHandlers();
      await initializeGalleryEvents(handlers, {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        context: 'test-gallery',
      });

      const snapshot = getGalleryEventSnapshot();

      expect(snapshot.initialized).toBe(true);
      expect(snapshot.options?.enableKeyboard).toBe(true);
      expect(snapshot.options?.enableMediaDetection).toBe(true);
      expect(snapshot.options?.context).toBe('test-gallery');
      expect(snapshot.isConnected).toBe(true);
    });
  });
});
