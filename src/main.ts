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
import { getThemeService, warmupNonCriticalServices } from '@shared/container/service-accessors';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error/app-error-reporter';
import { GlobalErrorHandler } from '@shared/error/error-handler';
import type { BootstrapStage } from '@shared/interfaces';
import { logger } from '@shared/logging';
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

async function refreshDevNamespace(app: IGalleryApp | null): Promise<void> {
  setupDevNamespace(app, {
    start: startApplication,
    createConfig: createAppConfig,
    cleanup,
  });
}

async function initializeCommandRuntimeIfNeeded(): Promise<void> {
  // Dev-only; Rollup can drop the branch and the import in production.
  if (!__DEV__ || isTestMode) {
    return;
  }

  tearDownCommandRuntime();
  commandRuntimeTeardown = startDevCommandRuntime();
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
    if (__DEV__) {
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
    if (__DEV__) {
      logger.debug('[command-runtime] Error while tearing down runtime', error);
    }
  }
}

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
        run: initializeInfrastructure,
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
        run: initializeGalleryIfPermitted,
      },
      {
        label: 'Non-critical systems',
        run: () => initializeNonCriticalSystems(),
        optional: true,
      },
    ]
  : null;

// exported runBootstrapStages below
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
  await initializeInfrastructure();
  await initializeCriticalSystems();
  try {
    await initializeBaseServicesStage();
  } catch {
    // Optional in production.
  }
  await applyInitialThemeSetting();
  setupGlobalEventHandlers();
  await initializeGalleryIfPermitted();
  initializeNonCriticalSystems();
}

// Lean mode: requestIdleCallback scheduling removed

/**
 * Initialize base infrastructure
 */
// exported initializeInfrastructure below
async function initializeInfrastructure(): Promise<void> {
  try {
    if (__DEV__) {
      await initializeEnvironment();
    }
    if (__DEV__) {
      logger.debug('✅ Vendor library initialization complete');
    }
  } catch (error) {
    bootstrapErrorReporter.critical(error, {
      code: 'INFRASTRUCTURE_INIT_FAILED',
    });
    throw error;
  }
}

// exported initializeBaseServicesStage below
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
 * Non-Critical system background initialization
 * Phase 3.1: Utilize requestIdleCallback
 */
// exported initializeNonCriticalSystems below
function initializeNonCriticalSystems(): void {
  // Lean mode: execute immediately without idle scheduling or test mode branching
  try {
    if (__DEV__) {
      logger.info('Starting non-critical system initialization');
    }
    warmupNonCriticalServices();
    if (__DEV__) {
      logger.info('✅ Non-critical system initialization complete');
    }
  } catch (error) {
    if (__DEV__) {
      logger.warn('Error during non-critical system initialization:', error);
    }
  }
}

/**
 * Set up global event handlers
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
async function loadGlobalStyles(): Promise<void> {
  // Styles are imported statically at module load time.
}

// exported initializeDevToolsIfNeeded below
async function initializeDevToolsIfNeeded(): Promise<void> {
  if (!isDevEnvironment) {
    return;
  }
  await initializeDevTools();
}

// exported initializeGalleryIfPermitted below
async function initializeGalleryIfPermitted(): Promise<void> {
  if (isTestMode) {
    if (__DEV__) {
      logger.debug('Gallery initialization skipped (test mode)');
    }
    return;
  }

  await initializeGallery();
}

/**
 * Application cleanup
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
 * Main application entry point
 *
 * Executes the configured bootstrap stages.
 * Keep the stage list and its documentation centralized in the stage
 * configuration (bootstrapStages) to avoid drift.
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
 * Gallery immediate initialization (no delay)
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
