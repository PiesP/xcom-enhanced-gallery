
describe('window-load', () => {
  let windowLoadModule: typeof import('@shared/dom/window-load');

  beforeEach(async () => {
    vi.resetModules();
    // Default to browser environment (JSDOM)
    windowLoadModule = await import('@shared/dom/window-load');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('waitForWindowLoad', () => {
    it('should resolve immediately if document.readyState is complete', async () => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });

      await expect(windowLoadModule.waitForWindowLoad()).resolves.toBeUndefined();
    });

    it('should wait for load event if document.readyState is not complete', async () => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'loading',
      });

      let loadHandler: EventListener | undefined;
      const addEventListenerSpy = vi
        .spyOn(window, 'addEventListener')
        .mockImplementation((event, handler) => {
          if (event === 'load') {
            loadHandler = handler as EventListener;
          }
        });
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const promise = windowLoadModule.waitForWindowLoad();

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function), {
        once: true,
        passive: true,
      });
      expect(loadHandler).toBeDefined();

      // Simulate load event
      loadHandler!(new Event('load'));

      await expect(promise).resolves.toBeUndefined();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('load', loadHandler);
    });

    it('should return the same promise for multiple calls while loading', async () => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'loading',
      });

      const promise1 = windowLoadModule.waitForWindowLoad();
      const promise2 = windowLoadModule.waitForWindowLoad();

      expect(promise1).toBe(promise2);
    });
  });

  describe('runAfterWindowLoad', () => {
    it('should execute callback after window load', async () => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });

      const callback = vi.fn();
      await windowLoadModule.runAfterWindowLoad(callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle async callbacks', async () => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });

      const callback = vi.fn().mockResolvedValue('done');
      await windowLoadModule.runAfterWindowLoad(callback);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Non-browser environment', () => {
    let originalWindow: unknown;
    let originalDocument: unknown;

    beforeEach(() => {
      originalWindow = global.window;
      originalDocument = global.document;
      // @ts-expect-error - Deleting global for test simulation
      delete global.window;
      // @ts-expect-error - Deleting global for test simulation
      delete global.document;
      vi.resetModules();
    });

    afterEach(() => {
      global.window = originalWindow as Window & typeof globalThis;
      global.document = originalDocument as Document;
    });

    it('should resolve immediately when window is undefined', async () => {
      const mod = await import('@shared/dom/window-load');
      await expect(mod.waitForWindowLoad()).resolves.toBeUndefined();
    });
  });

  describe('Partial environments', () => {
    let originalWindow: unknown;
    let originalDocument: unknown;

    beforeEach(() => {
      originalWindow = global.window;
      originalDocument = global.document;
      vi.resetModules();
    });

    afterEach(() => {
      // @ts-expect-error - Restoring global
      global.window = originalWindow;
      // @ts-expect-error - Restoring global
      global.document = originalDocument;
    });

    it('should treat missing document as non-browser environment', async () => {
      // Window exists, document missing
      // @ts-expect-error - Deleting global for test simulation
      delete global.document;

      const mod = await import('@shared/dom/window-load');
      // Should resolve immediately without checking readyState (which would throw)
      await expect(mod.waitForWindowLoad()).resolves.toBeUndefined();
    });

    it('should treat missing window as non-browser environment', async () => {
      // Document exists, window missing
      // @ts-expect-error - Deleting global for test simulation
      delete global.window;

      // Ensure document is in 'loading' state so isWindowLoaded() would return false
      // if it incorrectly thinks we are in a browser environment.
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'loading',
      });

      const mod = await import('@shared/dom/window-load');
      // Should resolve immediately without trying to add event listener (which would throw)
      await expect(mod.waitForWindowLoad()).resolves.toBeUndefined();
    });
  });
});
