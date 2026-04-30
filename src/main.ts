/**
 * @fileoverview Main entry point.
 * Orchestrates bootstrap stages, startup, and graceful cleanup.
 * \@run-at document-idle — runs after DOM is ready per userscript guarantee.
 */

import { initializeCoreBaseServices } from '@bootstrap/base-services';
import { initializeCriticalSystems } from '@bootstrap/critical-systems';
import { setupDevNamespace } from '@bootstrap/dev-namespace';
import { initializeDevTools } from '@bootstrap/dev-tools';
import { initializeEnvironment } from '@bootstrap/environment';
import type { Unregister } from '@bootstrap/events';
import { wireGlobalEvents } from '@bootstrap/events';
import { initializeGalleryApp, initializeGalleryServices } from '@bootstrap/gallery-init';
import { executeStages } from '@bootstrap/utils';
import { createAppConfig } from '@constants/app-config';
import type { IGalleryApp } from '@shared/container/app-container';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error/app-error-reporter';
import { GlobalErrorHandler } from '@shared/error/error-handler';
import type { BootstrapStage } from '@shared/interfaces/handler.interfaces';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import { CoreService } from '@shared/services/service-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';

// Global styles (side-effect import)
import './styles/globals';

const isTestMode = import.meta.env.MODE === 'test';

const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  galleryApp: null as IGalleryApp | null,
};

let globalEventTeardown: Unregister | null = null;

function tearDownGlobalEventHandlers(): void {
  if (!globalEventTeardown) return;
  const teardown = globalEventTeardown;
  globalEventTeardown = null;
  try {
    teardown();
  } catch (error) {
    if (__DEV__) logger.debug('[events] teardown error', error);
  }
}

function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();
  globalEventTeardown = wireGlobalEvents(() => {
    cleanup().catch((error) => {
      if (__DEV__) logger.error('Cleanup failed', error);
    });
  });
}

async function runOptionalCleanup(label: string, task: () => Promise<void> | void): Promise<void> {
  try {
    await task();
  } catch (error) {
    if (__DEV__) logger.warn(`[cleanup] ${label}`, error);
  }
}

function buildStages(): readonly BootstrapStage[] {
  return [
    {
      label: 'Infrastructure',
      run: async () => {
        try {
          await initializeEnvironment();
        } catch (error) {
          bootstrapErrorReporter.critical(error, { code: 'INFRASTRUCTURE_INIT_FAILED' });
          throw error;
        }
      },
    },
    {
      label: 'Developer tooling',
      run: initializeDevTools,
      shouldRun: () => __DEV__ && !isTestMode,
      optional: true,
    },
    { label: 'Critical systems', run: initializeCriticalSystems },
    {
      label: 'Gallery services',
      run: async () => {
        try {
          await initializeGalleryServices();
        } catch (error) {
          bootstrapErrorReporter.warn(error, { code: 'GALLERY_SERVICES_INIT_FAILED' });
          throw error;
        }
      },
      optional: true,
    },
    {
      label: 'Base services',
      run: async () => {
        try {
          await initializeCoreBaseServices();
        } catch (error) {
          bootstrapErrorReporter.warn(error, { code: 'BASE_SERVICES_INIT_FAILED' });
          throw error;
        }
      },
      optional: true,
    },
    { label: 'Global event wiring', run: setupGlobalEventHandlers },
    {
      label: 'Gallery initialization',
      run: initializeGallery,
      shouldRun: () => !isTestMode,
    },
  ];
}

async function runBootstrapStages(): Promise<void> {
  const results = await executeStages(buildStages(), { stopOnFailure: true });
  const failed = results.find((r) => !r.success && !r.optional);
  if (failed) {
    throw failed.error ?? new Error(`Bootstrap stage failed: ${failed.label}`);
  }
}

async function initializeGallery(): Promise<void> {
  try {
    lifecycleState.galleryApp = await initializeGalleryApp();
  } catch (error) {
    lifecycleState.galleryApp = null;
    galleryErrorReporter.error(error, { code: 'GALLERY_INIT_FAILED' });
    throw error;
  }
}

// Errors in individual cleanup tasks are swallowed intentionally
// to prevent one failed cleanup from blocking the rest of the teardown
async function cleanup(): Promise<void> {
  try {
    if (__DEV__) logger.info('🧹 Starting application cleanup');

    await runOptionalCleanup('gallery', async () => {
      const app = lifecycleState.galleryApp;
      lifecycleState.galleryApp = null;
      if (app) await app.cleanup();
    });
    tearDownGlobalEventHandlers();
    await runOptionalCleanup('core-service', () => CoreService.getInstance().cleanup());
    await runOptionalCleanup('timers', () => globalTimerManager.cleanup());
    await runOptionalCleanup('error-handler', () => GlobalErrorHandler.getInstance().destroy());

    if (__DEV__) {
      setupDevNamespace(lifecycleState.galleryApp, {
        start: startApplication,
        createConfig: createAppConfig,
        cleanup,
      });

      const status = EventManager.getInstance().getListenerStatus();
      if (status.total > 0) {
        logger.warn('[cleanup] ⚠️ uncleared listeners remain:', status);
      }
    }

    lifecycleState.started = false;
    if (__DEV__) logger.info('✅ Application cleanup complete');
  } catch (error) {
    bootstrapErrorReporter.error(error, { code: 'CLEANUP_FAILED' });
    throw error;
  }
}

async function startApplication(): Promise<void> {
  // Check startPromise first to prevent race between started/startPromise checks
  if (lifecycleState.startPromise) return lifecycleState.startPromise;
  if (lifecycleState.started) return;

  lifecycleState.startPromise = (async () => {
    if (__DEV__) logger.info('🚀 Starting X.com Enhanced Gallery...');

    await runBootstrapStages();
    lifecycleState.started = true;

    if (__DEV__) {
      logger.info('✅ Application initialization complete');
      setupDevNamespace(lifecycleState.galleryApp, {
        start: startApplication,
        createConfig: createAppConfig,
        cleanup,
      });
    }
  })()
    .catch((error) => {
      lifecycleState.started = false;
      bootstrapErrorReporter.error(error, { code: 'APP_INIT_FAILED' });
      throw error;
    })
    .finally(() => {
      lifecycleState.startPromise = null;
    });

  return lifecycleState.startPromise;
}

// Fire-and-forget startup. Callers can still await startApplication() to observe failures.
void startApplication().catch(() => {
  /* noop */
});
