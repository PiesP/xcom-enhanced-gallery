import { initializeCoreBaseServices } from '@bootstrap/base-services';
import { initializeCriticalSystems } from '@bootstrap/critical-systems';
import type { Unregister } from '@bootstrap/events';
import { wireGlobalEvents } from '@bootstrap/events';
import { initializeGalleryApp } from '@bootstrap/gallery-init';
import type { IGalleryApp } from '@shared/container/app-container';
import { getThemeService, warmupNonCriticalServices } from '@shared/container/service-accessors';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error/app-error-reporter';
import { GlobalErrorHandler } from '@shared/error/error-handler';
import { CoreService } from '@shared/services/service-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';

import './styles/globals';

const isTestMode = import.meta.env.MODE === 'test';

type CleanupTask = () => Promise<void> | void;

const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  galleryApp: null as IGalleryApp | null,
};

let globalEventTeardown: Unregister | null = null;

async function runOptionalCleanup(task: CleanupTask): Promise<void> {
  try {
    await task();
  } catch {
    // ignore
  }
}

function tearDownGlobalEventHandlers(): void {
  if (!globalEventTeardown) {
    return;
  }

  const teardown = globalEventTeardown;
  globalEventTeardown = null;

  try {
    teardown();
  } catch {
    // ignore
  }
}

function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();

  globalEventTeardown = wireGlobalEvents(() => {
    cleanup().catch(() => {
      /* noop */
    });
  });
}

async function initializeBaseServicesStage(): Promise<void> {
  try {
    await initializeCoreBaseServices();
  } catch (error) {
    bootstrapErrorReporter.warn(error, {
      code: 'BASE_SERVICES_INIT_FAILED',
    });
    throw error;
  }
}

async function applyInitialThemeSetting(): Promise<void> {
  try {
    const themeService = getThemeService();

    if (typeof themeService.isInitialized === 'function' && !themeService.isInitialized()) {
      await themeService.initialize();
    }

    const savedSetting = themeService.getCurrentTheme();
    themeService.setTheme(savedSetting, { force: true, persist: false });
  } catch {
    // optional
  }
}

function initializeNonCriticalSystems(): void {
  try {
    warmupNonCriticalServices();
  } catch {
    // optional
  }
}

async function initializeGalleryIfPermitted(): Promise<void> {
  if (isTestMode) {
    return;
  }

  await initializeGallery();
}

async function initializeGallery(): Promise<void> {
  try {
    lifecycleState.galleryApp = await initializeGalleryApp();
  } catch (error) {
    lifecycleState.galleryApp = null;

    galleryErrorReporter.error(error, {
      code: 'GALLERY_INIT_FAILED',
    });

    throw error;
  }
}

async function cleanup(): Promise<void> {
  try {
    tearDownGlobalEventHandlers();

    await runOptionalCleanup(async () => {
      if (!lifecycleState.galleryApp) {
        return;
      }

      await lifecycleState.galleryApp.cleanup();
      lifecycleState.galleryApp = null;
    });

    await runOptionalCleanup(() => {
      CoreService.getInstance().cleanup();
    });

    await runOptionalCleanup(() => {
      globalTimerManager.cleanup();
    });

    await runOptionalCleanup(async () => {
      GlobalErrorHandler.getInstance().destroy();
    });

    lifecycleState.started = false;
  } catch (error) {
    bootstrapErrorReporter.error(error, {
      code: 'CLEANUP_FAILED',
    });
    throw error;
  }
}

async function startApplication(): Promise<void> {
  if (lifecycleState.started) {
    return;
  }

  if (lifecycleState.startPromise) {
    return lifecycleState.startPromise;
  }

  lifecycleState.startPromise = (async () => {
    await initializeCriticalSystems();

    try {
      await initializeBaseServicesStage();
    } catch {
      // optional
    }

    await applyInitialThemeSetting();
    setupGlobalEventHandlers();
    await initializeGalleryIfPermitted();
    initializeNonCriticalSystems();

    lifecycleState.started = true;
  })()
    .catch((error) => {
      lifecycleState.started = false;

      bootstrapErrorReporter.error(error, {
        code: 'APP_INIT_FAILED',
        metadata: { leanMode: true },
      });

      throw error;
    })
    .finally(() => {
      lifecycleState.startPromise = null;
    });

  return lifecycleState.startPromise;
}

void startApplication().catch(() => {
  /* noop */
});
