// initializeDevTools dynamic import moved to initializeDevToolsIfNeeded
import type { Unregister } from '@bootstrap/events';
import { wireGlobalEvents } from '@bootstrap/events';
import { initializeGalleryApp } from '@bootstrap/gallery-init';
import { executeStages } from '@bootstrap/utils';
import { createAppConfig } from '@constants/app-config';
import type { IGalleryApp } from '@shared/container/app-container';
import { warmupNonCriticalServices } from '@shared/container/service-accessors';
import { runAfterWindowLoad } from '@shared/dom/window-load';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error';
import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import { CoreService } from '@shared/services/service-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';

// Global styles
// Global styles are loaded at runtime to avoid import-time side effects.
// They are dynamically loaded inside startApplication for safety in both tests and bundling.

// Vendor initialization moved to startApplication

const isDevEnvironment = __DEV__;
const isTestMode = import.meta.env.MODE === 'test';

type CleanupTask = () => Promise<void> | void;
type CleanupLogger = (message: string, error: unknown) => void;

export const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  galleryApp: null as IGalleryApp | null,
  lastError: null as unknown | null,
};

const warnCleanupLog: CleanupLogger = (message, error) => {
  logger.warn(message, error);
};

const debugCleanupLog: CleanupLogger = (message, error) => {
  logger.debug(message, error);
};

let globalEventTeardown: Unregister | null = null;
let commandRuntimeTeardown: (() => void) | null = null;

/**
 * Set global event teardown function (used by bootstrap stages)
 */
export function setGlobalEventTeardown(teardown: Unregister): void {
  globalEventTeardown = teardown;
}

function tearDownGlobalEventHandlers(): void {
  if (!globalEventTeardown) {
    return;
  }

  const teardown = globalEventTeardown;
  globalEventTeardown = null;

  try {
    teardown();
  } catch (error) {
    if (isDevEnvironment) {
      logger.debug('[events] Error while tearing down global handlers', error);
    }
  }
}

function tearDownCommandRuntime(): void {
  if (!commandRuntimeTeardown) {
    return;
  }

  const teardown = commandRuntimeTeardown;
  commandRuntimeTeardown = null;

  try {
    teardown();
  } catch (error) {
    if (isDevEnvironment) {
      logger.debug('[command-runtime] Error while tearing down runtime', error);
    }
  }
}

export async function runOptionalCleanup(
  label: string,
  task: CleanupTask,
  log: CleanupLogger = warnCleanupLog
): Promise<void> {
  try {
    await task();
  } catch (error) {
    log(label, error);
  }
}

/**
 * Bootstrap stage definitions (data-driven configuration)
 *
 * 📋 10-stage bootstrap process:
 * 1️⃣  Global styles - src/styles/globals
 * 2️⃣  Developer tooling - src/bootstrap/dev-tools.ts (dev-only)
 * 3️⃣  Infrastructure initialization (Vendor load) - src/bootstrap/environment.ts
 * 4️⃣  Core systems (Core services + notification stack) - src/bootstrap/critical-systems.ts
 * 5️⃣  Base services (Theme/Language) - src/bootstrap/base-services.ts
 * 6️⃣  Theme synchronization - Apply initial theme setting
 * 7️⃣  Feature service registration (lazy load) - src/bootstrap/features.ts
 * 8️⃣  Global event handler setup - src/bootstrap/events.ts
 * 9️⃣  Gallery app initialization - src/features/gallery/GalleryApp.ts
 * 🔟  Background system initialization (non-critical services)
 *
 * 💡 Conditional Execution:
 * - Developer tooling runs only in __DEV__ mode and not in tests
 * - Gallery initialization is skipped in test mode
 */
const bootstrapStages = [
  {
    label: 'Global styles',
    run: loadGlobalStyles,
  },
  {
    label: 'Developer tooling',
    run: initializeDevToolsIfNeeded,
    shouldRun: () => isDevEnvironment && !isTestMode,
    optional: true,
  },
  {
    label: 'Infrastructure',
    run: initializeInfrastructure,
  },
  {
    label: 'Critical systems',
    run: async () => {
      const { initializeCriticalSystems } = await import('@bootstrap/critical-systems');
      await initializeCriticalSystems();
    },
  },
  {
    label: 'Base services',
    run: initializeBaseServicesStage,
    optional: true,
  },
  {
    label: 'Theme synchronization',
    run: applyInitialThemeSetting,
    optional: true,
  },
  {
    label: 'Feature service registration',
    run: async () => {
      const { registerFeatureServicesLazy } = await import('@bootstrap/features');
      await registerFeatureServicesLazy();
    },
    optional: true,
  },
  {
    label: 'Global event wiring',
    run: () => setupGlobalEventHandlers(),
  },
  {
    label: 'Command runtime (dev)',
    run: initializeCommandRuntimeIfNeeded,
    shouldRun: () => isDevEnvironment && !isTestMode,
    optional: true,
  },
  {
    label: 'Gallery initialization',
    run: initializeGalleryIfPermitted,
  },
  {
    label: 'Non-critical systems',
    run: () => initializeNonCriticalSystems(),
    optional: true,
  },
] as const;

// exported runBootstrapStages below
export async function runBootstrapStages(): Promise<void> {
  const results = await executeStages(bootstrapStages, { stopOnFailure: true });
  const failedStage = results.find((r) => !r.success && !r.optional);
  if (failedStage) {
    throw failedStage.error ?? new Error(`Bootstrap stage failed: ${failedStage.label}`);
  }
}

// Lean mode: requestIdleCallback scheduling removed

/**
 * Initialize base infrastructure
 */
// exported initializeInfrastructure below
export async function initializeInfrastructure(): Promise<void> {
  try {
    const { initializeEnvironment } = await import('@bootstrap/environment');
    await initializeEnvironment();
    logger.debug('✅ Vendor library initialization complete');
  } catch (error) {
    bootstrapErrorReporter.critical(error, {
      code: 'INFRASTRUCTURE_INIT_FAILED',
    });
    throw error;
  }
}

// exported initializeBaseServicesStage below
export async function initializeBaseServicesStage(): Promise<void> {
  try {
    const { initializeCoreBaseServices } = await import('@bootstrap/base-services');
    await initializeCoreBaseServices();
    logger.debug('✅ Base services initialization complete');
  } catch (error) {
    bootstrapErrorReporter.warn(error, {
      code: 'BASE_SERVICES_INIT_FAILED',
    });
    throw error;
  }
}

// exported applyInitialThemeSetting below
export async function applyInitialThemeSetting(): Promise<void> {
  try {
    const { getThemeService } = await import('@shared/container/service-accessors');
    const themeService = getThemeService();

    if (typeof themeService.isInitialized === 'function' && !themeService.isInitialized()) {
      await themeService.initialize();
    }

    const savedSetting = themeService.getCurrentTheme();
    themeService.setTheme(savedSetting, { force: true, persist: false });

    if (__DEV__) {
      logger.debug(`[theme-sync] Applied saved theme: ${savedSetting}`);
    }
  } catch (error) {
    logger.warn('[theme-sync] Initial theme application skipped:', error);
  }
}

/**
 * Non-Critical system background initialization
 * Phase 3.1: Utilize requestIdleCallback
 */
// exported initializeNonCriticalSystems below
export function initializeNonCriticalSystems(): void {
  // Lean mode: execute immediately without idle scheduling or test mode branching
  try {
    logger.info('Starting non-critical system initialization');
    warmupNonCriticalServices();
    logger.info('✅ Non-critical system initialization complete');
  } catch (error) {
    logger.warn('Error during non-critical system initialization:', error);
  }
}

/**
 * Set up global event handlers
 */
// exported setupGlobalEventHandlers below
export function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();

  globalEventTeardown = wireGlobalEvents(() => {
    cleanup().catch((error) => logger.error('Error during page unload cleanup:', error));
  });
}

// exported loadGlobalStyles below
export async function loadGlobalStyles(): Promise<void> {
  await import('./styles/globals');
}

// exported initializeDevToolsIfNeeded below
export async function initializeDevToolsIfNeeded(): Promise<void> {
  if (!isDevEnvironment) {
    return;
  }

  const { initializeDevTools } = await import('@bootstrap/dev-tools');
  await initializeDevTools();
}

export async function initializeCommandRuntimeIfNeeded(): Promise<void> {
  tearDownCommandRuntime();

  const { startDevCommandRuntime } = await import('@edge/bootstrap');
  commandRuntimeTeardown = startDevCommandRuntime();
}

// exported initializeGalleryIfPermitted below
export async function initializeGalleryIfPermitted(): Promise<void> {
  if (isTestMode) {
    logger.debug('Gallery initialization skipped (test mode)');
    return;
  }

  await initializeGallery();
}

// exported triggerPreloadStrategy below
export function triggerPreloadStrategy(): void {
  if (isTestMode) {
    return;
  }

  void runAfterWindowLoad(async () => {
    try {
      const { executePreloadStrategy } = await import('@bootstrap/preload');
      await executePreloadStrategy();
    } catch (error) {
      logger.warn('[Phase 326] Error executing preload strategy:', error);
    }
  });
}

/**
 * Application cleanup
 */
// exported cleanup below
export async function cleanup(): Promise<void> {
  try {
    logger.info('🧹 Starting application cleanup');

    tearDownGlobalEventHandlers();
    tearDownCommandRuntime();
    await runOptionalCleanup('Gallery cleanup', async () => {
      if (!lifecycleState.galleryApp) {
        return;
      }

      await lifecycleState.galleryApp.cleanup();
      lifecycleState.galleryApp = null;
      if (__DEV__) {
        const { setupDevNamespace } = await import('@bootstrap/dev-namespace');
        setupDevNamespace(null, {
          start: startApplication,
          createConfig: createAppConfig,
          cleanup,
        });
      }
    });

    await runOptionalCleanup('CoreService cleanup', () => {
      CoreService.getInstance().cleanup();
    });

    await runOptionalCleanup('Global timer cleanup', () => {
      globalTimerManager.cleanup();
    });

    await runOptionalCleanup(
      'Global error handler cleanup',
      async () => {
        const { GlobalErrorHandler } = await import('@shared/error');
        GlobalErrorHandler.getInstance().destroy();
      },
      debugCleanupLog
    );

    if (__DEV__) {
      await runOptionalCleanup(
        'Dev namespace cleanup',
        async () => {
          const { setupDevNamespace } = await import('@bootstrap/dev-namespace');
          setupDevNamespace(null, {
            start: startApplication,
            createConfig: createAppConfig,
            cleanup,
          });
        },
        debugCleanupLog
      );
    }

    if (isDevEnvironment) {
      await runOptionalCleanup(
        '[cleanup] Event listener status check',
        async () => {
          const status = EventManager.getInstance().getListenerStatus();
          if (status.total > 0) {
            logger.warn('[cleanup] ⚠️ Warning: uncleared event listeners remain:', {
              total: status.total,
              byType: status.byType,
              byContext: status.byContext,
            });
          } else {
            logger.debug('[cleanup] ✅ All event listeners cleared successfully');
          }
        },
        debugCleanupLog
      );
    }

    lifecycleState.started = false;
    logger.info('✅ Application cleanup complete');
  } catch (error) {
    bootstrapErrorReporter.error(error, {
      code: 'CLEANUP_FAILED',
    });
    throw error;
  }
}

/**
 * Main application entry point
 *
 * Executes the configured bootstrap stages and starts background preload work.
 * Keep the stage list and its documentation centralized in the stage
 * configuration (bootstrapStages) to avoid drift.
 */
// exported startApplication below
export async function startApplication(): Promise<void> {
  if (lifecycleState.started) {
    logger.debug('Application: Already started');
    return;
  }

  if (lifecycleState.startPromise) {
    logger.debug('Application: Start in progress - reusing promise');
    return lifecycleState.startPromise;
  }

  lifecycleState.startPromise = (async () => {
    logger.info('🚀 Starting X.com Enhanced Gallery...');

    await runBootstrapStages();

    triggerPreloadStrategy();

    lifecycleState.started = true;
    lifecycleState.lastError = null;

    logger.info('✅ Application initialization complete');

    // Phase 290: Namespace isolation - provide single namespace for global access in dev environment
    if (__DEV__) {
      const { setupDevNamespace } = await import('@bootstrap/dev-namespace');
      setupDevNamespace(lifecycleState.galleryApp, {
        start: startApplication,
        createConfig: createAppConfig,
        cleanup,
      });
    }
  })()
    .catch((error) => {
      lifecycleState.started = false;
      lifecycleState.lastError = error;
      bootstrapErrorReporter.error(error, {
        code: 'APP_INIT_FAILED',
        metadata: { leanMode: true },
      });

      // Re-throw so callers awaiting startApplication can observe failures.
      throw error;
    })
    .finally(() => {
      lifecycleState.startPromise = null;
    });

  return lifecycleState.startPromise;
}

/**
 * Gallery immediate initialization (no delay)
 */
// exported initializeGallery below
export async function initializeGallery(): Promise<void> {
  try {
    logger.debug('🎯 Starting gallery immediate initialization');

    // Phase 2.1: Initialization via bootstrap module
    lifecycleState.galleryApp = await initializeGalleryApp();

    logger.debug('✅ Gallery immediate initialization complete');
  } catch (error) {
    // Keep lifecycle state consistent for subsequent retries.
    lifecycleState.galleryApp = null;

    // Report without using the reporter as control flow; the bootstrap stage should fail.
    galleryErrorReporter.error(error, {
      code: 'GALLERY_INIT_FAILED',
    });

    throw error;
  }
}

/**
 * Application immediate startup
 *
 * @run-at document-idle guarantee:
 * The userscript engine (Tampermonkey/Greasemonkey) executes after the DOM is ready,
 * so DOMContentLoaded listeners are unnecessary. We call startApplication immediately.
 *
 * Phase 236: Removed DOMContentLoaded listener to minimize interference with Twitter's native page
 */
// Fire-and-forget startup. We intentionally swallow the rejection here to avoid
// unhandled promise rejections at the top level.
// Callers can still await startApplication() to observe failures.
void startApplication().catch(() => {
  /* noop */
});

// Named exports for manual startup from external context
export const appModule = {
  start: startApplication,
  createConfig: createAppConfig,
  cleanup,
};
