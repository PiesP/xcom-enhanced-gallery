// Production entry point.
// Keep this file free of dev-only imports and verbose strings.

import { initializeCoreBaseServices } from '@bootstrap/base-services';
import { initializeCriticalSystems } from '@bootstrap/critical-systems';
import type { Unregister } from '@bootstrap/events';
import { wireGlobalEvents } from '@bootstrap/events';
import { initializeGalleryApp } from '@bootstrap/gallery-init';
import { executeStages } from '@bootstrap/utils';
import type { IGalleryApp } from '@shared/container/app-container';
import { getThemeService, warmupNonCriticalServices } from '@shared/container/service-accessors';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error/app-error-reporter';
import { GlobalErrorHandler } from '@shared/error/error-handler';
import type { BootstrapStage } from '@shared/interfaces/handler.interfaces';
import { CoreService } from '@shared/services/service-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';

import './styles/globals';

const isTestMode = import.meta.env.MODE === 'test';

type CleanupTask = () => Promise<void> | void;

const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  galleryApp: null as IGalleryApp | null,
  lastError: null as unknown | null,
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
  } catch {
    // Intentionally ignored in production entry.
  }
}

async function runOptionalCleanup(label: string, task: CleanupTask): Promise<void> {
  try {
    await task();
  } catch {
    // Intentionally ignored in production entry.
    // The label is kept short to reduce shipped strings in a non-minified bundle.
    void label;
  }
}

const bootstrapStages: readonly BootstrapStage[] = [
  {
    label: '1',
    run: initializeInfrastructure,
  },
  {
    label: '2',
    run: initializeCriticalSystems,
  },
  {
    label: '3',
    run: initializeBaseServicesStage,
    optional: true,
  },
  {
    label: '4',
    run: applyInitialThemeSetting,
    optional: true,
  },
  {
    label: '5',
    run: () => setupGlobalEventHandlers(),
  },
  {
    label: '6',
    run: initializeGalleryIfPermitted,
  },
  {
    label: '7',
    run: () => initializeNonCriticalSystems(),
    optional: true,
  },
];

async function runBootstrapStages(): Promise<void> {
  const results = await executeStages(bootstrapStages, { stopOnFailure: true });
  const failedStage = results.find((r) => !r.success && !r.optional);
  if (failedStage) {
    throw failedStage.error ?? new Error('Bootstrap failed');
  }
}

async function initializeInfrastructure(): Promise<void> {
  // Production-only entry intentionally keeps infrastructure init minimal.
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
    // Theme application is best-effort.
  }
}

function initializeNonCriticalSystems(): void {
  try {
    warmupNonCriticalServices();
  } catch {
    // Best-effort.
  }
}

function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();

  globalEventTeardown = wireGlobalEvents(() => {
    void cleanup().catch(() => {
      /* noop */
    });
  });
}

async function initializeGalleryIfPermitted(): Promise<void> {
  if (isTestMode) {
    return;
  }

  await initializeGallery();
}

async function cleanup(): Promise<void> {
  tearDownGlobalEventHandlers();

  await runOptionalCleanup('1', async () => {
    if (!lifecycleState.galleryApp) {
      return;
    }

    await lifecycleState.galleryApp.cleanup();
    lifecycleState.galleryApp = null;
  });

  await runOptionalCleanup('2', () => {
    CoreService.getInstance().cleanup();
  });

  await runOptionalCleanup('3', () => {
    globalTimerManager.cleanup();
  });

  await runOptionalCleanup('4', async () => {
    GlobalErrorHandler.getInstance().destroy();
  });

  lifecycleState.started = false;
}

async function startApplication(): Promise<void> {
  if (lifecycleState.started) {
    return;
  }

  if (lifecycleState.startPromise) {
    return lifecycleState.startPromise;
  }

  lifecycleState.startPromise = (async () => {
    await runBootstrapStages();

    lifecycleState.started = true;
    lifecycleState.lastError = null;
  })()
    .catch((error) => {
      lifecycleState.started = false;
      lifecycleState.lastError = error;
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

void startApplication().catch(() => {
  /* noop */
});
