import { initializeCriticalSystems } from '@/bootstrap/critical-systems';
// initializeDevTools dynamic import moved to initializeDevToolsIfNeeded
import { initializeEnvironment } from '@/bootstrap/environment';
import type { Unregister } from '@/bootstrap/events';
import { wireGlobalEvents } from '@/bootstrap/events';
import { registerFeatureServicesLazy } from '@/bootstrap/features';
import { initializeGalleryApp } from '@/bootstrap/gallery-init';
import { createAppConfig } from '@/constants/app-config';
import { logger } from '@/shared/logging';
import type { IGalleryApp } from '@shared/container/app-container';
import { warmupNonCriticalServices } from '@shared/container/service-accessors';
import { runAfterWindowLoad } from '@shared/dom/window-load';
import { cleanupVendors } from '@shared/external/vendors';
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

const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  galleryApp: null as IGalleryApp | null,
};

type BootstrapStage = {
  label: string;
  run: () => Promise<void> | void;
};

const warnCleanupLog: CleanupLogger = (message, error) => {
  logger.warn(message, error);
};

const debugCleanupLog: CleanupLogger = (message, error) => {
  logger.debug(message, error);
};

let globalEventTeardown: Unregister | null = null;

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

async function runOptionalCleanup(
  label: string,
  task: CleanupTask,
  log: CleanupLogger = warnCleanupLog,
): Promise<void> {
  try {
    await task();
  } catch (error) {
    log(label, error);
  }
}

async function runBootstrapStages(): Promise<void> {
  for (const stage of bootstrapStages) {
    await executeBootstrapStage(stage);
  }
}

async function executeBootstrapStage(stage: BootstrapStage): Promise<void> {
  try {
    logger.debug(`[bootstrap] ➡️ ${stage.label}`);
    await Promise.resolve(stage.run());
  } catch (error) {
    logger.error(`[bootstrap] ❌ ${stage.label} failed`, error);
    throw error;
  }
}

// Lean mode: requestIdleCallback scheduling removed

/**
 * Initialize base infrastructure
 */
async function initializeInfrastructure(): Promise<void> {
  try {
    await initializeEnvironment();
    logger.debug('✅ Vendor library initialization complete');
  } catch (error) {
    logger.error('❌ Infrastructure initialization failed:', error);
    throw error;
  }
}

async function initializeBaseServicesStage(): Promise<void> {
  try {
    const { initializeCoreBaseServices } = await import('@/bootstrap/base-services');
    await initializeCoreBaseServices();
    logger.debug('✅ Base services initialization complete');
  } catch (error) {
    logger.warn('⚠️ Base services initialization failed:', error);
  }
}

async function applyInitialThemeSetting(): Promise<void> {
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
function initializeNonCriticalSystems(): void {
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
function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();

  globalEventTeardown = wireGlobalEvents(() => {
    cleanup().catch(error => logger.error('Error during page unload cleanup:', error));
  });
}

async function loadGlobalStyles(): Promise<void> {
  await import('./styles/globals');
}

async function initializeDevToolsIfNeeded(): Promise<void> {
  if (!isDevEnvironment) {
    return;
  }

  const { initializeDevTools } = await import('@/bootstrap/dev-tools');
  await initializeDevTools();
}

async function initializeGalleryIfPermitted(): Promise<void> {
  if (isTestMode) {
    logger.debug('Gallery initialization skipped (test mode)');
    return;
  }

  await initializeGallery();
}

const bootstrapStages: BootstrapStage[] = [
  { label: 'Global styles', run: loadGlobalStyles },
  ...(isDevEnvironment ? [{ label: 'Developer tooling', run: initializeDevToolsIfNeeded }] : []),
  { label: 'Infrastructure', run: initializeInfrastructure },
  { label: 'Critical systems', run: initializeCriticalSystems },
  { label: 'Base services', run: initializeBaseServicesStage },
  { label: 'Theme synchronization', run: applyInitialThemeSetting },
  { label: 'Feature service registration', run: registerFeatureServicesLazy },
  { label: 'Global event wiring', run: () => setupGlobalEventHandlers() },
  { label: 'Gallery initialization', run: initializeGalleryIfPermitted },
  { label: 'Non-critical systems', run: () => initializeNonCriticalSystems() },
];

function triggerPreloadStrategy(): void {
  if (isTestMode) {
    return;
  }

  void runAfterWindowLoad(async () => {
    try {
      const { executePreloadStrategy } = await import('@/bootstrap/preload');
      await executePreloadStrategy();
    } catch (error) {
      logger.warn('[Phase 326] Error executing preload strategy:', error);
    }
  });
}

/**
 * Application cleanup
 */
async function cleanup(): Promise<void> {
  try {
    logger.info('🧹 Starting application cleanup');

    tearDownGlobalEventHandlers();
    await runOptionalCleanup('Gallery cleanup', async () => {
      if (!lifecycleState.galleryApp) {
        return;
      }

      await lifecycleState.galleryApp.cleanup();
      lifecycleState.galleryApp = null;
      if (__DEV__) {
        const { setupDevNamespace } = await import('@/bootstrap/dev-namespace');
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

    await runOptionalCleanup('Vendor cleanup', () => {
      cleanupVendors();
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
      debugCleanupLog,
    );

    if (isDevEnvironment) {
      await runOptionalCleanup(
        '[cleanup] Event listener status check',
        async () => {
          const { getEventListenerStatus } = await import(
            '@shared/utils/events/core/listener-manager'
          );
          const status = getEventListenerStatus();
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
        debugCleanupLog,
      );
    }

    lifecycleState.started = false;
    logger.info('✅ Application cleanup complete');
  } catch (error) {
    logger.error('❌ Error during application cleanup:', error);
    throw error;
  }
}

/**
 * Main application entry point
 *
 * 📋 9-stage bootstrap process:
 * 1️⃣  Global styles - src/styles/globals
 * 2️⃣  Developer tooling - src/bootstrap/dev-tools.ts
 * 3️⃣  Infrastructure initialization (Vendor load) - src/bootstrap/environment.ts
 * 4️⃣  Core systems (Core services + notification stack) - src/bootstrap/critical-systems.ts (Phase 2.1)
 * 5️⃣  Base services (Theme/Language) - src/bootstrap/base-services.ts (Phase 2.1)
 * 6️⃣  Feature service registration (lazy load) - src/bootstrap/features.ts
 * 7️⃣  Global event handler setup - src/bootstrap/events.ts
 * 8️⃣  Gallery app initialization - src/features/gallery/GalleryApp.ts
 * 9️⃣  Background system initialization (non-critical services)
 *
 * 💡 Critical vs Non-Critical:
 * - Critical: Needed immediately after page load (infrastructure, core, gallery)
 * - Non-Critical: Can wait until after user interaction (background timers)
 */
async function startApplication(): Promise<void> {
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

    logger.info('✅ Application initialization complete');

    // Phase 290: Namespace isolation - provide single namespace for global access in dev environment
    if (__DEV__) {
      const { setupDevNamespace } = await import('@/bootstrap/dev-namespace');
      setupDevNamespace(lifecycleState.galleryApp, {
        start: startApplication,
        createConfig: createAppConfig,
        cleanup,
      });
    }
  })()
    .catch(error => {
      logger.error('❌ Application initialization failed (lean mode, no retry):', error);
    })
    .finally(() => {
      lifecycleState.startPromise = null;
    });

  return lifecycleState.startPromise;
}

/**
 * Gallery immediate initialization (no delay)
 */
async function initializeGallery(): Promise<void> {
  try {
    logger.debug('🎯 Starting gallery immediate initialization');

    // Phase 2.1: Initialization via bootstrap module
    lifecycleState.galleryApp = await initializeGalleryApp();

    logger.debug('✅ Gallery immediate initialization complete');
  } catch (error) {
    logger.error('❌ Gallery immediate initialization failed:', error);
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
startApplication();

// Module default export (allows manual startup from external context)
export default {
  start: startApplication,
  createConfig: createAppConfig,
  cleanup,
};

// Phase 290: Namespace isolation - allow global access only in development environment
if (__DEV__) {
  void import('@/bootstrap/dev-namespace').then(({ setupDevNamespace }) => {
    setupDevNamespace(undefined, {
      start: startApplication,
      createConfig: createAppConfig,
      cleanup,
    });
  });
}
