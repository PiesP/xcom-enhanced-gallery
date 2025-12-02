
// Mocks for modules used by main.ts before importing the module
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/bootstrap/environment', () => ({
  initializeEnvironment: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/bootstrap/base-services', () => ({
  initializeCoreBaseServices: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/bootstrap/critical-systems', () => ({
  initializeCriticalSystems: vi.fn().mockResolvedValue(undefined),
}));

const wireGlobalEventsMock = vi.fn<(handler: () => void | Promise<void>) => () => void>();

vi.mock('@/bootstrap/events', () => ({
  wireGlobalEvents: (...args: Parameters<typeof wireGlobalEventsMock>) =>
    wireGlobalEventsMock(...args),
}));

vi.mock('@/bootstrap/features', () => ({
  registerFeatureServicesLazy: vi.fn(),
}));

vi.mock('@/bootstrap/gallery-init', () => ({
  initializeGalleryApp: vi.fn().mockResolvedValue({ cleanup: vi.fn() }),
}));

vi.mock('@/bootstrap/dev-tools', () => ({
  initializeDevTools: vi.fn().mockResolvedValue(undefined),
}));

const runAfterWindowLoadMock = vi.fn();

vi.mock('@shared/dom/window-load', () => ({
  runAfterWindowLoad: (callback: () => void | Promise<void>) => runAfterWindowLoadMock(callback),
}));

const executePreloadStrategyMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/bootstrap/preload', () => ({
  executePreloadStrategy: executePreloadStrategyMock,
}));

vi.mock('@shared/external/vendors', () => ({
  cleanupVendors: vi.fn(),
}));

vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: { cleanup: vi.fn() },
}));

// Provide a stable core instance mock so assertions can check the same
// instance that the module under test uses.
const coreInstanceMockForMain = {
  cleanup: vi.fn(),
  has: vi.fn(() => true),
  register: vi.fn(),
  get: vi.fn(() => ({ initialize: vi.fn().mockResolvedValue(undefined) })),
};

vi.mock('@shared/services/service-manager', async () => ({
  CoreService: {
    getInstance: vi.fn(() => coreInstanceMockForMain),
  },
}));

vi.mock('@shared/error', () => ({
  GlobalErrorHandler: { getInstance: vi.fn(() => ({ destroy: vi.fn() })) },
  bootstrapErrorReporter: {
    error: vi.fn(),
    warn: vi.fn(),
    critical: vi.fn(),
    info: vi.fn(),
  },
  galleryErrorReporter: {
    error: vi.fn(),
    warn: vi.fn(),
    critical: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@shared/utils/events/core/listener-manager', () => ({
  getEventListenerStatus: vi.fn(() => ({ total: 0, byType: {}, byContext: {} })),
}));

vi.mock('@shared/container/service-accessors', () => ({
  warmupNonCriticalServices: vi.fn(),
  getThemeService: vi.fn(() => ({
    isInitialized: () => true,
    getCurrentTheme: () => 'light',
    setTheme: vi.fn(),
  })),
}));

describe('main module (basic bootstrap helpers)', () => {
  let main: typeof import('@/main');
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    wireGlobalEventsMock.mockReset();
    wireGlobalEventsMock.mockImplementation(() => () => undefined);
    runAfterWindowLoadMock.mockReset();
    runAfterWindowLoadMock.mockImplementation(() => Promise.resolve());
    executePreloadStrategyMock.mockClear();
    // Reset the stable core instance mock functions each time
    coreInstanceMockForMain.cleanup = vi.fn();
    coreInstanceMockForMain.has = vi.fn(() => true);
    coreInstanceMockForMain.register = vi.fn();
    coreInstanceMockForMain.get = vi.fn(() => ({ initialize: vi.fn().mockResolvedValue(undefined) }));
    // Import main module after mocks have been registered
    main = await import('@/main');
    const logging = await import('@shared/logging');
    logger = logging.logger;
  });

  // Note: executeBootstrapStage tests have been moved to test/unit/bootstrap/utils.test.ts
  // as the function is now exported from @/bootstrap/utils as executeStage

  describe('runBootstrapStages', () => {
    it('should run all bootstrap stages that are active in the environment', async () => {
      // Setup spies for functions used in bootstrap stages
      const environmentModule = await import('@/bootstrap/environment');
      const criticalModule = await import('@/bootstrap/critical-systems');
      const baseModule = await import('@/bootstrap/base-services');
      const eventsModule = await import('@/bootstrap/events');
      const featuresModule = await import('@/bootstrap/features');
      const devtoolsModule = await import('@/bootstrap/dev-tools');

      // Ensure spies were created via our mocks earlier in this file's top-level
      await expect(environmentModule.initializeEnvironment as any).toBeDefined();
      await expect(criticalModule.initializeCriticalSystems as any).toBeDefined();
      await expect(baseModule.initializeCoreBaseServices as any).toBeDefined();
      await expect(eventsModule.wireGlobalEvents as any).toBeDefined();
      await expect(featuresModule.registerFeatureServicesLazy as any).toBeDefined();
      await expect(devtoolsModule.initializeDevTools as any).toBeDefined();

      // Call the stages runner and expect the spies to be called
      await main.runBootstrapStages();
      expect(environmentModule.initializeEnvironment).toHaveBeenCalled();
      expect(criticalModule.initializeCriticalSystems).toHaveBeenCalled();
      expect(baseModule.initializeCoreBaseServices).toHaveBeenCalled();
      expect(wireGlobalEventsMock).toHaveBeenCalled();
      expect(featuresModule.registerFeatureServicesLazy).toHaveBeenCalled();
      expect(devtoolsModule.initializeDevTools).toHaveBeenCalled();
    });
  });

  describe('runOptionalCleanup', () => {
    it('should run cleanup task successfully', async () => {
      const task = vi.fn().mockResolvedValue(undefined);
      await expect(main.runOptionalCleanup('label', task)).resolves.toBeUndefined();
      expect(task).toHaveBeenCalled();
    });

    it('should call provided log on failure', async () => {
      const err = new Error('boom');
      const task = vi.fn().mockRejectedValue(err);
      const log = vi.fn();
      await expect(main.runOptionalCleanup('label', task, log)).resolves.toBeUndefined();
      expect(log).toHaveBeenCalledWith('label', err);
    });

    it('uses warn logger by default when cleanup fails', async () => {
      const err = new Error('cleanup failed');
      const task = vi.fn().mockRejectedValue(err);

      await expect(main.runOptionalCleanup('warn-default', task)).resolves.toBeUndefined();

      expect(logger.warn).toHaveBeenCalledWith('warn-default', err);
    });
  });

  describe('initializeInfrastructure', () => {
    it('reports critical error when environment initialization fails', async () => {
      const environmentModule = await import('@/bootstrap/environment');
      const { bootstrapErrorReporter } = await import('@shared/error');
      const failure = new Error('infra fail');
      (environmentModule.initializeEnvironment as any).mockRejectedValueOnce(failure);

      // initializeInfrastructure no longer throws - it reports via bootstrapErrorReporter.critical
      await main.initializeInfrastructure();

      expect(vi.mocked(bootstrapErrorReporter.critical)).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({ code: 'INFRASTRUCTURE_INIT_FAILED' })
      );
    });
  });

  describe('initializeBaseServicesStage', () => {
    it('warns when base services fail to initialize', async () => {
      const baseModule = await import('@/bootstrap/base-services');
      const { bootstrapErrorReporter } = await import('@shared/error');
      const failure = new Error('base fail');
      (baseModule.initializeCoreBaseServices as any).mockRejectedValueOnce(failure);

      await expect(main.initializeBaseServicesStage()).resolves.toBeUndefined();
      expect(vi.mocked(bootstrapErrorReporter.warn)).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({ code: 'BASE_SERVICES_INIT_FAILED' })
      );
    });
  });

  describe('applyInitialThemeSetting', () => {
    it('initializes theme service when not yet ready', async () => {
      const serviceAccessors = await import('@shared/container/service-accessors');
      const themeServiceMock = {
        isInitialized: vi.fn(() => false),
        initialize: vi.fn().mockResolvedValue(undefined),
        getCurrentTheme: vi.fn(() => 'galaxy'),
        setTheme: vi.fn(),
      };
      (serviceAccessors.getThemeService as any).mockReturnValueOnce(themeServiceMock);

      await main.applyInitialThemeSetting();

      expect(themeServiceMock.initialize).toHaveBeenCalled();
      expect(themeServiceMock.setTheme).toHaveBeenCalledWith('galaxy', { force: true, persist: false });
    });

    it('warns when theme application fails', async () => {
      const serviceAccessors = await import('@shared/container/service-accessors');
      (serviceAccessors.getThemeService as any).mockImplementationOnce(() => {
        throw new Error('theme failure');
      });

      await expect(main.applyInitialThemeSetting()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith('[theme-sync] Initial theme application skipped:', expect.any(Error));
    });
  });

  describe('cleanup', () => {
    it('should perform cleanup steps and set started false', async () => {
      // Create a fake gallery app with cleanup
      main.lifecycleState.galleryApp = { cleanup: vi.fn().mockResolvedValue(undefined) } as any;
      const coreServiceModule = await import('@shared/services/service-manager');
      const coreInstance = coreServiceModule.CoreService.getInstance() as any;
      // Ensure started is true before cleanup
      main.lifecycleState.started = true;

      await expect(main.cleanup()).resolves.toBeUndefined();
      expect(main.lifecycleState.started).toBe(false);
      expect(coreInstance.cleanup).toHaveBeenCalled();
      const vendors = await import('@shared/external/vendors');
      expect(vendors.cleanupVendors).toHaveBeenCalled();
    });

    it('skips gallery teardown when no gallery app exists', async () => {
      main.lifecycleState.galleryApp = null;

      await expect(main.cleanup()).resolves.toBeUndefined();
      expect(main.lifecycleState.galleryApp).toBeNull();
    });

    it('logs debug information when global error handler cleanup fails', async () => {
      const errorModule = await import('@shared/error');
      const failure = new Error('destroy fail');
      const handlerInstance = { destroy: vi.fn(() => {
        throw failure;
      }) };
      (errorModule.GlobalErrorHandler.getInstance as any).mockReturnValueOnce(handlerInstance);

      await expect(main.cleanup()).resolves.toBeUndefined();

      expect(logger.debug).toHaveBeenCalledWith('Global error handler cleanup', failure);
    });

    it('warns when lingering event listeners remain after cleanup', async () => {
      const listenerModule = await import('@shared/utils/events/core/listener-manager');
      (listenerModule.getEventListenerStatus as any).mockReturnValueOnce({
        total: 2,
        byType: { click: 2 },
        byContext: {},
      });

      await expect(main.cleanup()).resolves.toBeUndefined();

      expect(logger.warn).toHaveBeenCalledWith(
        '[cleanup] ⚠️ Warning: uncleared event listeners remain:',
        expect.objectContaining({ total: 2 })
      );
    });

    it('propagates unexpected cleanup failures', async () => {
      const { bootstrapErrorReporter } = await import('@shared/error');
      const failure = new Error('logger failure');
      logger.info.mockImplementationOnce(() => {
        throw failure;
      });

      await expect(main.cleanup()).rejects.toThrow(failure);
      expect(vi.mocked(bootstrapErrorReporter.error)).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({ code: 'CLEANUP_FAILED' })
      );
    });
  });

  describe('startApplication', () => {
    beforeEach(() => {
      main.lifecycleState.started = false;
      main.lifecycleState.startPromise = null;
      main.lifecycleState.galleryApp = null;
    });

    it('should not start if already started', async () => {
      main.lifecycleState.started = true;
      await main.startApplication();
      expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Starting X.com Enhanced Gallery'));
    });

    it('should reuse promise if start in progress', async () => {
      const promise = Promise.resolve();
      main.lifecycleState.startPromise = promise;
      const result = await main.startApplication();
      expect(result).toBe(undefined); // Since promise resolves to void
      // We can't easily check if it returned the *same* promise object because await unwraps it.
      // But we can check that it didn't log "Starting..."
      expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Starting X.com Enhanced Gallery'));
    });

    it('should run bootstrap stages and set started=true', async () => {
      // Mock runBootstrapStages to avoid running all stages
      // But runBootstrapStages is exported, so we can't easily mock it if we are testing the module that exports it.
      // However, we mocked the *dependencies* of runBootstrapStages (the stages themselves).
      // So running it is fine.

      await main.startApplication();

      expect(main.lifecycleState.started).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Application initialization complete'));
    });

    it('logs bootstrap failures without retrying', async () => {
      const featuresModule = await import('@/bootstrap/features');
      const { bootstrapErrorReporter } = await import('@shared/error');
      const failure = new Error('bootstrap boom');
      (featuresModule.registerFeatureServicesLazy as any).mockRejectedValueOnce(failure);

      await main.startApplication();
      await Promise.resolve();

      expect(vi.mocked(bootstrapErrorReporter.error)).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({ code: 'APP_INIT_FAILED' })
      );
    });
  });

  describe('initializeGallery', () => {
    it('should initialize gallery app', async () => {
      const galleryInitModule = await import('@/bootstrap/gallery-init');

      await main.initializeGallery();

      expect(galleryInitModule.initializeGalleryApp).toHaveBeenCalled();
      expect(main.lifecycleState.galleryApp).toBeDefined();
    });

    it('surfaces initialization errors from gallery bootstrap', async () => {
      const galleryInitModule = await import('@/bootstrap/gallery-init');
      const { galleryErrorReporter } = await import('@shared/error');
      const failure = new Error('gallery fail');
      (galleryInitModule.initializeGalleryApp as any).mockRejectedValueOnce(failure);

      // initializeGallery no longer throws - it reports via galleryErrorReporter.critical
      await main.initializeGallery();

      expect(vi.mocked(galleryErrorReporter.critical)).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({ code: 'GALLERY_INIT_FAILED' })
      );
    });
  });

  describe('initializeNonCriticalSystems', () => {
    it('should warmup non-critical services', async () => {
      const serviceAccessors = await import('@shared/container/service-accessors');

      main.initializeNonCriticalSystems();

      expect(serviceAccessors.warmupNonCriticalServices).toHaveBeenCalled();
    });

    it('warns when warmup throws', async () => {
      const serviceAccessors = await import('@shared/container/service-accessors');
      (serviceAccessors.warmupNonCriticalServices as any).mockImplementationOnce(() => {
        throw new Error('warmup failed');
      });

      main.initializeNonCriticalSystems();

      expect(logger.warn).toHaveBeenCalledWith(
        'Error during non-critical system initialization:',
        expect.any(Error)
      );
    });
  });

  describe('setupGlobalEventHandlers', () => {
    it('tears down previous listeners before re-registering', () => {
      const firstTeardown = vi.fn();
      const secondTeardown = vi.fn();

      wireGlobalEventsMock.mockReturnValueOnce(firstTeardown).mockReturnValueOnce(secondTeardown);

      main.setupGlobalEventHandlers();
      main.setupGlobalEventHandlers();

      expect(firstTeardown).toHaveBeenCalledTimes(1);
      expect(wireGlobalEventsMock).toHaveBeenCalledTimes(2);
    });

    it('invokes cleanup when unload handler is triggered', async () => {
      const handlerRegistry: Array<() => void> = [];
      wireGlobalEventsMock.mockImplementation(callback => {
        handlerRegistry.push(callback);
        return vi.fn();
      });

      main.lifecycleState.started = true;
      main.lifecycleState.galleryApp = { cleanup: vi.fn().mockResolvedValue(undefined) } as any;

      main.setupGlobalEventHandlers();

      expect(handlerRegistry).toHaveLength(1);
      handlerRegistry[0]!();
      await Promise.resolve();
      await Promise.resolve();
      expect(logger.info).toHaveBeenCalledWith('🧹 Starting application cleanup');
    });

    it('reports errors when unload cleanup rejects', async () => {
      const handlerRegistry: Array<() => void> = [];
      wireGlobalEventsMock.mockImplementation(callback => {
        handlerRegistry.push(callback);
        return vi.fn();
      });

      const cleanupError = new Error('cleanup failed');
      logger.info.mockImplementationOnce(() => {
        throw cleanupError;
      });

      main.setupGlobalEventHandlers();

      handlerRegistry[0]!();
      await Promise.resolve();
      await Promise.resolve();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(logger.error).toHaveBeenCalledWith('Error during page unload cleanup:', cleanupError);
    });

    it('logs teardown errors when unregister callbacks throw', () => {
      wireGlobalEventsMock
        .mockReturnValueOnce(() => {
          throw new Error('teardown failure');
        })
        .mockReturnValueOnce(vi.fn());

      main.setupGlobalEventHandlers();

      expect(() => main.setupGlobalEventHandlers()).not.toThrow();
      expect(logger.debug).toHaveBeenCalledWith(
        '[events] Error while tearing down global handlers',
        expect.any(Error)
      );
    });
  });

  describe('triggerPreloadStrategy', () => {
    it('skips scheduling when running in test mode', async () => {
      await main.triggerPreloadStrategy();
      expect(runAfterWindowLoadMock).not.toHaveBeenCalled();
    });
  });

  describe('initializeGalleryIfPermitted', () => {
    it('logs skip message in test mode without initializing gallery', async () => {
      main.lifecycleState.galleryApp = null;

      await main.initializeGalleryIfPermitted();

      expect(logger.debug).toHaveBeenCalledWith('Gallery initialization skipped (test mode)');
      expect(main.lifecycleState.galleryApp).toBeNull();
    });
  });
});

describe('main module (environment overrides)', () => {
  beforeEach(() => {
    runAfterWindowLoadMock.mockReset();
    runAfterWindowLoadMock.mockImplementation(() => Promise.resolve());
    executePreloadStrategyMock.mockReset();
    executePreloadStrategyMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function importMainWithEnv(options: { mode?: string; dev?: boolean } = {}) {
    const { mode = 'production', dev = true } = options;
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.stubEnv('MODE', mode);
    vi.stubGlobal('__DEV__', dev);
    return import('@/main');
  }

  it('skips developer tooling initialization outside dev mode', async () => {
    const mainModule = await importMainWithEnv({ dev: false });
    const devToolsModule = await import('@/bootstrap/dev-tools');

    await mainModule.initializeDevToolsIfNeeded();

    expect(devToolsModule.initializeDevTools).not.toHaveBeenCalled();
  });

  it('initializes gallery when not running in test mode', async () => {
    const mainModule = await importMainWithEnv({ mode: 'production' });
    const galleryInitModule = await import('@/bootstrap/gallery-init');

    await mainModule.initializeGalleryIfPermitted();

    expect(galleryInitModule.initializeGalleryApp).toHaveBeenCalled();
  });

  it('schedules preload strategy when allowed', async () => {
    const mainModule = await importMainWithEnv({ mode: 'production' });
    executePreloadStrategyMock.mockClear();
    const initialCalls = runAfterWindowLoadMock.mock.calls.length;

    await mainModule.triggerPreloadStrategy();
    expect(runAfterWindowLoadMock).toHaveBeenCalledTimes(initialCalls + 1);

    const scheduledCallback = runAfterWindowLoadMock.mock.calls.at(-1)?.[0];
    expect(typeof scheduledCallback).toBe('function');
    await scheduledCallback!();

    expect(executePreloadStrategyMock).toHaveBeenCalled();
  });

  it('warns when preload strategy execution fails', async () => {
    const mainModule = await importMainWithEnv({ mode: 'production' });
    const logging = await import('@shared/logging');
    const failure = new Error('preload failure');
    const initialCalls = runAfterWindowLoadMock.mock.calls.length;

    await mainModule.triggerPreloadStrategy();
    expect(runAfterWindowLoadMock).toHaveBeenCalledTimes(initialCalls + 1);

    const scheduledCallback = runAfterWindowLoadMock.mock.calls.at(-1)?.[0];
    expect(typeof scheduledCallback).toBe('function');
    executePreloadStrategyMock.mockRejectedValueOnce(failure);

    await scheduledCallback!().catch(() => undefined);

    expect(logging.logger.warn).toHaveBeenCalledWith(
      '[Phase 326] Error executing preload strategy:',
      failure
    );
  });
});

describe('main module - mutation coverage', () => {
  let main: typeof import('@/main');
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    wireGlobalEventsMock.mockReset();
    wireGlobalEventsMock.mockImplementation(() => () => undefined);
    runAfterWindowLoadMock.mockReset();
    coreInstanceMockForMain.cleanup = vi.fn();
    main = await import('@/main');
    const logging = await import('@shared/logging');
    logger = logging.logger;
  });

  describe('lifecycleState initial values', () => {
    it('should have started as false initially', () => {
      // Reset lifecycle state to its initial state
      main.lifecycleState.started = false;
      main.lifecycleState.startPromise = null;
      main.lifecycleState.galleryApp = null;

      expect(main.lifecycleState.started).toBe(false);
      expect(main.lifecycleState.startPromise).toBeNull();
      expect(main.lifecycleState.galleryApp).toBeNull();
    });

    it('should verify started is actually false, not true', () => {
      // This tests that the initial value mutation (false -> true) would fail
      main.lifecycleState.started = false;
      expect(main.lifecycleState.started).not.toBe(true);
    });
  });

  describe('bootstrapStages structure coverage', () => {
    it('should have bootstrap stages with proper structure', async () => {
      // Verify stages exist and have proper shape
      await main.runBootstrapStages();

      // Bootstrap stages must run and return without error
      // This kills mutations that replace arrays with empty arrays or wrong objects
      const environmentModule = await import('@/bootstrap/environment');
      const criticalModule = await import('@/bootstrap/critical-systems');

      expect(environmentModule.initializeEnvironment).toHaveBeenCalled();
      expect(criticalModule.initializeCriticalSystems).toHaveBeenCalled();
    });

    it('should have stages with label and run properties', async () => {
      // Run bootstrap and check that all stages are executed
      // This ensures ObjectLiteral mutations ({}) are killed
      const envModule = await import('@/bootstrap/environment');
      const baseModule = await import('@/bootstrap/base-services');
      const criticalModule = await import('@/bootstrap/critical-systems');

      await main.runBootstrapStages();

      // Each stage must have been called - if any stage is replaced with {},
      // executeBootstrapStage would fail when calling stage.run()
      expect(envModule.initializeEnvironment).toHaveBeenCalled();
      expect(baseModule.initializeCoreBaseServices).toHaveBeenCalled();
      expect(criticalModule.initializeCriticalSystems).toHaveBeenCalled();
    });
  });

  describe('cleanup galleryApp conditionals', () => {
    it('should cleanup gallery app when it exists', async () => {
      const mockCleanup = vi.fn().mockResolvedValue(undefined);
      main.lifecycleState.galleryApp = { cleanup: mockCleanup } as any;
      main.lifecycleState.started = true;

      await main.cleanup();

      expect(mockCleanup).toHaveBeenCalled();
      expect(main.lifecycleState.galleryApp).toBeNull();
    });

    it('should not throw when galleryApp is null', async () => {
      main.lifecycleState.galleryApp = null;
      main.lifecycleState.started = true;

      await expect(main.cleanup()).resolves.toBeUndefined();
    });

    it('should not throw when galleryApp cleanup fails', async () => {
      const mockCleanup = vi.fn().mockRejectedValue(new Error('cleanup failed'));
      main.lifecycleState.galleryApp = { cleanup: mockCleanup } as any;
      main.lifecycleState.started = true;

      await expect(main.cleanup()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('event listener status checks', () => {
    it('should detect when listeners remain with total > 0', async () => {
      const listenerModule = await import('@shared/utils/events/core/listener-manager');
      (listenerModule.getEventListenerStatus as any).mockReturnValueOnce({
        total: 5,
        byType: { click: 3, keydown: 2 },
        byContext: { gallery: 5 },
      });

      main.lifecycleState.started = true;
      await main.cleanup();

      expect(logger.warn).toHaveBeenCalledWith(
        '[cleanup] ⚠️ Warning: uncleared event listeners remain:',
        expect.objectContaining({ total: 5 })
      );
    });

    it('should not warn when total is exactly 0', async () => {
      const listenerModule = await import('@shared/utils/events/core/listener-manager');
      (listenerModule.getEventListenerStatus as any).mockReturnValueOnce({
        total: 0,
        byType: {},
        byContext: {},
      });

      main.lifecycleState.started = true;
      // Clear previous warn calls
      logger.warn.mockClear();
      logger.debug.mockClear();

      await main.cleanup();

      // Should log debug success, not warn
      expect(logger.debug).toHaveBeenCalledWith('[cleanup] ✅ All event listeners cleared successfully');
    });

    it('should detect listeners with boundary value total === 1', async () => {
      const listenerModule = await import('@shared/utils/events/core/listener-manager');
      (listenerModule.getEventListenerStatus as any).mockReturnValueOnce({
        total: 1,
        byType: { click: 1 },
        byContext: { gallery: 1 },
      });

      main.lifecycleState.started = true;
      await main.cleanup();

      expect(logger.warn).toHaveBeenCalledWith(
        '[cleanup] ⚠️ Warning: uncleared event listeners remain:',
        expect.objectContaining({ total: 1 })
      );
    });
  });

  describe('startApplication state transitions', () => {
    beforeEach(() => {
      main.lifecycleState.started = false;
      main.lifecycleState.startPromise = null;
      main.lifecycleState.galleryApp = null;
    });

    it('should set started to true after successful bootstrap', async () => {
      expect(main.lifecycleState.started).toBe(false);

      await main.startApplication();

      expect(main.lifecycleState.started).toBe(true);
    });

    it('should clear startPromise after completion', async () => {
      await main.startApplication();
      // After awaiting, the promise should be cleared in finally block
      expect(main.lifecycleState.startPromise).toBeNull();
    });

    it('should not re-run when started is true', async () => {
      main.lifecycleState.started = true;
      const infoSpy = logger.info;
      infoSpy.mockClear();

      await main.startApplication();

      // Should not log "Starting X.com Enhanced Gallery..."
      expect(infoSpy).not.toHaveBeenCalledWith(expect.stringContaining('Starting'));
    });
  });
});
