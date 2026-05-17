/**
 * @fileoverview Main entry. Orchestrates bootstrap stages, startup, and cleanup.
 */

import { initializeCoreBaseServices } from '@bootstrap/base-services';
import { initializeGalleryApp, initializeGalleryServices } from '@bootstrap/gallery-init';
import { executeStages } from '@bootstrap/utils';
import { createAppConfig } from '@constants/app-config';
import { mutateDevNamespace } from '@shared/devtools/dev-namespace';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error/app-error-reporter';
import { GlobalErrorHandler } from '@shared/error/error-handler';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import type { BootstrapStage } from '@shared/types/lifecycle.types';
import { globalTimerManager } from '@shared/utils/time/timer-management';

import './styles/globals';

interface GalleryLifecycleApp {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

const isTestMode = import.meta.env.MODE === 'test';

const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  galleryApp: null as GalleryLifecycleApp | null,
};

function wireGlobalEvents(onBeforeUnload: () => void): () => void {
  let disposed = false;
  const controller = new AbortController();
  const invokeOnce = (): void => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    onBeforeUnload();
  };
  EventManager.getInstance().addEventListener(window, 'pagehide', invokeOnce as EventListener, {
    once: true,
    passive: true,
    signal: controller.signal,
    context: 'bootstrap:pagehide',
  });
  return () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
  };
}

function setupDevNamespace(
  galleryAppInstance: GalleryLifecycleApp | null | undefined,
  actions: {
    start: () => Promise<void>;
    createConfig: typeof createAppConfig;
    cleanup: () => Promise<void>;
  }
): void {
  mutateDevNamespace((namespace) => {
    const mainNamespace = (namespace.main ??= { ...actions }) as typeof namespace.main;
    mainNamespace.start = actions.start;
    mainNamespace.createConfig = actions.createConfig;
    mainNamespace.cleanup = actions.cleanup;
    if (galleryAppInstance !== undefined) {
      if (galleryAppInstance) mainNamespace.galleryApp = galleryAppInstance;
      else delete mainNamespace.galleryApp;
    }
  });
}

let globalEventTeardown: (() => void) | null = null;

function tearDownGlobalEventHandlers(): void {
  if (!globalEventTeardown) return;
  const teardown = globalEventTeardown;
  globalEventTeardown = null;
  try {
    teardown();
  } catch (error) {
    __DEV__ && logger.debug('[events] teardown error', error);
  }
}

function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();
  globalEventTeardown = wireGlobalEvents(() => {
    cleanup().catch((error) => {
      __DEV__ && logger.error('Cleanup failed', error);
    });
  });
}

async function runOptionalCleanup(label: string, task: () => Promise<void> | void): Promise<void> {
  try {
    await task();
  } catch (error) {
    __DEV__ && logger.warn(`[cleanup] ${label} failed`, error);
  }
}

function buildStages(): readonly BootstrapStage[] {
  return [
    {
      label: 'Error handler',
      run: () => GlobalErrorHandler.getInstance().initialize(),
    },
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

async function cleanup(): Promise<void> {
  try {
    __DEV__ && logger.info('Starting application cleanup');

    await runOptionalCleanup('gallery', async () => {
      const app = lifecycleState.galleryApp;
      lifecycleState.galleryApp = null;
      if (app) await app.cleanup();
    });
    tearDownGlobalEventHandlers();
    await runOptionalCleanup('timers', () => globalTimerManager.cleanup());
    await runOptionalCleanup('error-handler', () => GlobalErrorHandler.getInstance().destroy());

    if (__DEV__) {
      const status = EventManager.getInstance().getListenerStatus();
      if (status.total > 0) {
        logger.warn('[cleanup] uncleared listeners remain:', status);
      }
    }

    lifecycleState.started = false;
    __DEV__ && logger.info('Application cleanup complete');
  } catch (error) {
    bootstrapErrorReporter.error(error, { code: 'CLEANUP_FAILED' });
    throw error;
  }
}

async function startApplication(): Promise<void> {
  if (lifecycleState.startPromise) return lifecycleState.startPromise;
  if (lifecycleState.started) return;

  lifecycleState.startPromise = (async () => {
    __DEV__ && logger.info('Starting X.com Enhanced Gallery...');

    await runBootstrapStages();
    lifecycleState.started = true;

    if (__DEV__) {
      logger.info('Application initialization complete');
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

void startApplication().catch((error) => {
  __DEV__ && logger.error('Application failed to start', error);
});
