/**
 * Main application entry point and lifecycle management.
 *
 * Orchestrates bootstrap stages, startup, and graceful cleanup.
 * Executes stages in order: infrastructure → services → events → gallery.
 * Handles dev/prod modes with distinct optimization strategies.
 *
 * \@run-at document-idle - Executes after DOM is ready per userscript guarantee
 */

import { initializeCoreBaseServices } from '@bootstrap/base-services';
import { initializeCriticalSystems } from '@bootstrap/critical-systems';
import { setupDevNamespace } from '@bootstrap/dev-namespace';
import { initializeDevTools } from '@bootstrap/dev-tools';
import { initializeEnvironment } from '@bootstrap/environment';
import type { Unregister } from '@bootstrap/events';
import { wireGlobalEvents } from '@bootstrap/events';
import { initializeGalleryApp } from '@bootstrap/gallery-init';
import { executeStages } from '@bootstrap/utils';
import { createAppConfig } from '@constants/app-config';
import { startDevCommandRuntime } from '@edge/bootstrap';
import type { IGalleryApp } from '@shared/container/app-container';
import { getThemeService } from '@shared/container/service-accessors';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error/app-error-reporter';
import { GlobalErrorHandler } from '@shared/error/error-handler';
import type { BootstrapStage } from '@shared/interfaces/handler.interfaces';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import { CoreService } from '@shared/services/service-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';

// Global styles (side-effect import)
import './styles/globals';

const isDevEnvironment = __DEV__;
const isTestMode = import.meta.env.MODE === 'test';

type CleanupTask = () => Promise<void> | void;
type CleanupLogger = (message: string, error: unknown) => void;

const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  galleryApp: null as IGalleryApp | null,
};

const warnCleanupLog: CleanupLogger | undefined = __DEV__
  ? (message, error) => {
      logger.warn(message, error);
    }
  : undefined;

const debugCleanupLog: CleanupLogger | undefined = __DEV__
  ? (message, error) => {
      logger.debug(message, error);
    }
  : undefined;

let globalEventTeardown: Unregister | null = null;
let commandRuntimeTeardown: (() => void) | null = null;

/**
 * Refresh dev namespace with current application state.
 * Updates global dev namespace to expose app instance and control functions.
 * Dev-only utility for debugging.
 *
 * @internal
 */
async function refreshDevNamespace(app: IGalleryApp | null): Promise<void> {
  setupDevNamespace(app, {
    start: startApplication,
    createConfig: createAppConfig,
    cleanup,
  });
}

/**
 * Initialize dev command runtime if needed (dev mode only).
 * Automatically skipped in production and test modes.
 *
 * @internal
 */
async function initializeCommandRuntimeIfNeeded(): Promise<void> {
  // Dev-only; Rollup can drop the branch and the import in production.
  if (!__DEV__ || isTestMode) {
    return;
  }

  tearDownCommandRuntime();
  commandRuntimeTeardown = startDevCommandRuntime();
}

/**
 * Tear down global event handlers and unsubscribe all listeners.
 *
 * @internal
 */
function tearDownGlobalEventHandlers(): void {
  if (!globalEventTeardown) {
    return;
  }

  const teardown = globalEventTeardown;
  globalEventTeardown = null;

  try {
    teardown();
  } catch (error) {
    if (__DEV__) {
      logger.debug('[events] Error while tearing down global handlers', error);
    }
  }
}

/**
 * Tear down dev command runtime.
 *
 * @internal
 */
function tearDownCommandRuntime(): void {
  if (!commandRuntimeTeardown) {
    return;
  }

  const teardown = commandRuntimeTeardown;
  commandRuntimeTeardown = null;

  try {
    teardown();
  } catch (error) {
    if (__DEV__) {
      logger.debug('[command-runtime] Error while tearing down runtime', error);
    }
  }
}

/**
 * Execute optional cleanup task with error handling and logging.
 *
 * @internal
 */
async function runOptionalCleanup(
  label: string,
  task: CleanupTask,
  log?: CleanupLogger
): Promise<void> {
  const selectedLog = log ?? warnCleanupLog;

  try {
    await task();
  } catch (error) {
    selectedLog?.(label, error);
  }
}

const devBootstrapStages: readonly BootstrapStage[] | null = __DEV__
  ? [
      {
        label: 'Global styles',
        run: loadGlobalStyles,
      },
      {
        label: 'Developer tooling',
        run: initializeDevToolsIfNeeded,
        shouldRun: () => !isTestMode,
        optional: true,
      },
      {
        label: 'Infrastructure',
        run: async () => {
          try {
            await initializeEnvironment();
            logger.debug('✅ Vendor library initialization complete');
          } catch (error) {
            bootstrapErrorReporter.critical(error, {
              code: 'INFRASTRUCTURE_INIT_FAILED',
            });
            throw error;
          }
        },
      },
      {
        label: 'Critical systems',
        run: initializeCriticalSystems,
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
        label: 'Global event wiring',
        run: () => setupGlobalEventHandlers(),
      },
      {
        label: 'Command runtime (dev)',
        run: initializeCommandRuntimeIfNeeded,
        shouldRun: () => !isTestMode,
        optional: true,
      },
      {
        label: 'Gallery initialization',
        run: initializeGallery,
        shouldRun: () => !isTestMode,
      },
    ]
  : null;

// exported runBootstrapStages below
/**
 * Execute all configured bootstrap stages in sequence.
 * Dev mode: verbose logging and optional recovery.
 * Prod mode: minimal sequential bootstrap.
 *
 * @internal
 */
async function runBootstrapStages(): Promise<void> {
  // Keep the stage runner dev-only to avoid shipping the generic executor and
  // its verbose strings/objects in the production (non-minified) userscript.
  if (__DEV__) {
    const stages = devBootstrapStages ?? [];
    const results = await executeStages(stages, { stopOnFailure: true });
    const failedStage = results.find((r) => !r.success && !r.optional);
    if (failedStage) {
      throw failedStage.error ?? new Error(`Bootstrap stage failed: ${failedStage.label}`);
    }
    return;
  }

  // Production: minimal sequential bootstrap.
  await initializeCriticalSystems();
  try {
    await initializeBaseServicesStage();
  } catch {
    // Optional in production.
  }
  await applyInitialThemeSetting();
  setupGlobalEventHandlers();
  await initializeGallery();
}

// Lean mode: requestIdleCallback scheduling removed

// exported initializeBaseServicesStage below
/**
 * Initialize core base services (fonts, API clients, storage, etc.).
 *
 * @internal
 */
async function initializeBaseServicesStage(): Promise<void> {
  try {
    await initializeCoreBaseServices();
    if (__DEV__) {
      logger.debug('✅ Base services initialization complete');
    }
  } catch (error) {
    bootstrapErrorReporter.warn(error, {
      code: 'BASE_SERVICES_INIT_FAILED',
    });
    throw error;
  }
}

// exported applyInitialThemeSetting below
/**
 * Apply initial theme setting from saved configuration.
 * Initializes theme service and applies saved preference without persisting changes.
 *
 * @internal
 */
async function applyInitialThemeSetting(): Promise<void> {
  try {
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
    if (__DEV__) {
      logger.warn('[theme-sync] Initial theme application skipped:', error);
    }
  }
}

/**
 * Set up global event handlers and wire application-wide event system.
 * Registers listeners for page events that trigger cleanup when needed.
 *
 * @internal
 */
// exported setupGlobalEventHandlers below
function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();

  globalEventTeardown = wireGlobalEvents(() => {
    cleanup().catch((error) => {
      if (__DEV__) {
        logger.error('Cleanup failed', error);
      }
    });
  });
}

// exported loadGlobalStyles below
/**
 * Load global styles (placeholder).
 * Actual styles imported statically via side-effect import at module load time.
 *
 * @internal
 */
async function loadGlobalStyles(): Promise<void> {
  // Styles are imported statically at module load time.
}

// exported initializeDevToolsIfNeeded below
/**
 * Initialize developer tools if in development environment.
 *
 * @internal
 */
async function initializeDevToolsIfNeeded(): Promise<void> {
  if (!isDevEnvironment) {
    return;
  }
  await initializeDevTools();
}

/**
 * Perform complete application cleanup and resource teardown.
 *
 * Executes cleanup in reverse initialization order:
 * global events → command runtime → gallery → services → timers → error handler.
 * Individual tasks are optional; errors logged but not thrown.
 */
// exported cleanup below
async function cleanup(): Promise<void> {
  try {
    if (__DEV__) {
      logger.info('🧹 Starting application cleanup');
    }

    tearDownGlobalEventHandlers();
    tearDownCommandRuntime();
    await runOptionalCleanup(__DEV__ ? 'Gallery cleanup' : '1', async () => {
      if (!lifecycleState.galleryApp) {
        return;
      }

      await lifecycleState.galleryApp.cleanup();
      lifecycleState.galleryApp = null;
    });

    await runOptionalCleanup(__DEV__ ? 'CoreService cleanup' : '2', () => {
      CoreService.getInstance().cleanup();
    });

    await runOptionalCleanup(__DEV__ ? 'Global timer cleanup' : '3', () => {
      globalTimerManager.cleanup();
    });

    await runOptionalCleanup(
      __DEV__ ? 'Global error handler cleanup' : '4',
      async () => {
        GlobalErrorHandler.getInstance().destroy();
      },
      debugCleanupLog
    );

    if (__DEV__) {
      await runOptionalCleanup(
        'Dev namespace refresh',
        async () => {
          await refreshDevNamespace(lifecycleState.galleryApp);
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
            if (__DEV__) {
              logger.warn('[cleanup] ⚠️ Warning: uncleared event listeners remain:', {
                total: status.total,
                byType: status.byType,
                byContext: status.byContext,
              });
            }
          } else if (__DEV__) {
            logger.debug('[cleanup] ✅ All event listeners cleared successfully');
          }
        },
        debugCleanupLog
      );
    }

    lifecycleState.started = false;
    if (__DEV__) {
      logger.info('✅ Application cleanup complete');
    }
  } catch (error) {
    bootstrapErrorReporter.error(error, {
      code: 'CLEANUP_FAILED',
    });
    throw error;
  }
}

/**
 * Start application and execute bootstrap stages.
 *
 * Prevents duplicate initialization by tracking startup state and promise.
 * Re-entrant: concurrent calls return the same startup promise.
 * Executes bootstrap stages in order.
 */
// exported startApplication below
async function startApplication(): Promise<void> {
  if (lifecycleState.started) {
    if (__DEV__) {
      logger.debug('Application: Already started');
    }
    return;
  }

  if (lifecycleState.startPromise) {
    if (__DEV__) {
      logger.debug('Application: Start in progress - reusing promise');
    }
    return lifecycleState.startPromise;
  }

  lifecycleState.startPromise = (async () => {
    if (__DEV__) {
      logger.info('🚀 Starting X.com Enhanced Gallery...');
    }

    await runBootstrapStages();

    lifecycleState.started = true;

    if (__DEV__) {
      logger.info('✅ Application initialization complete');
    }

    // Phase 290: Namespace isolation - provide single namespace for global access in dev environment
    if (__DEV__) {
      await refreshDevNamespace(lifecycleState.galleryApp);
    }
  })()
    .catch((error) => {
      lifecycleState.started = false;
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
 * Initialize gallery application and attach to DOM.
 *
 * Creates and initializes the gallery app instance. Clears state on failure
 * to allow subsequent retries. Reports initialization errors without catching them.
 *
 * @internal
 */
// exported initializeGallery below
async function initializeGallery(): Promise<void> {
  try {
    if (__DEV__) {
      logger.debug('🎯 Starting gallery immediate initialization');
    }

    // Phase 2.1: Initialization via bootstrap module
    lifecycleState.galleryApp = await initializeGalleryApp();

    if (__DEV__) {
      logger.debug('✅ Gallery immediate initialization complete');
    }
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
 * \@run-at document-idle guarantee:
 * The userscript engine executes after DOM is ready, so DOMContentLoaded listeners
 * are unnecessary. We call startApplication immediately.
 */
// Fire-and-forget startup. We intentionally swallow the rejection here to avoid
// unhandled promise rejections at the top level.
// Callers can still await startApplication() to observe failures.
void startApplication().catch(() => {
  /* noop */
});
