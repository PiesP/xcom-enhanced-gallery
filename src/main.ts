// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Main entry. Orchestrates bootstrap stages, startup, and cleanup.
 */

import {
  initializeCoreBaseServices,
  initializeGalleryApp,
  initializeGalleryServices,
} from '@bootstrap/gallery-init';
import { executeStages } from '@bootstrap/utils';
import { createAppConfig } from '@constants/app-config';
import { clearSettings } from '@shared/container/settings-registry';
import { mutateDevNamespace } from '@shared/devtools/dev-namespace';
import { bootstrapErrorReporter, galleryErrorReporter } from '@shared/error/app-error-reporter';
import { getGlobalErrorHandler } from '@shared/error/error-handler';
import { logger } from '@shared/logging/logger';
import {
  getEventManager,
  resetEventManagerForTests as resetEventManager,
} from '@shared/services/event-manager';
import { getThemeService } from '@shared/services/theme-service';
import type { BootstrapStage } from '@shared/types/lifecycle.types';
import { TWITTER_HOSTS } from '@shared/utils/url/host';
// Import isolated gallery styles in CSS cascade priority order:
// layers → tokens → reset → utilities → component styles
import '@shared/styles/layers.css';
import '@shared/styles/design-tokens.primitive.css';
import '@shared/styles/design-tokens.semantic.css';
import '@shared/styles/design-tokens.component.css';
import '@shared/styles/base/reset.css';
import '@shared/styles/utilities/layout.css';
import '@shared/styles/utilities/animations.css';
import '@shared/styles/isolated-gallery.css';

interface GalleryLifecycleApp {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

const isTestMode = import.meta.env.MODE === 'test';

const lifecycleState = {
  started: false,
  startPromise: null as Promise<void> | null,
  cleanupPromise: null as Promise<void> | null,
  galleryApp: null as GalleryLifecycleApp | null,
};

function wireGlobalEvents(onBeforeUnload: () => void): () => void {
  const controller = new AbortController();
  const handler: EventListener = () => {
    controller.abort();
    onBeforeUnload();
  };
  getEventManager().addEventListener(window, 'pagehide', handler, {
    once: true,
    passive: true,
    signal: controller.signal,
    context: 'bootstrap:pagehide',
  });
  return () => {
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

/**
 * Module-level teardown handle for global event handlers.
 *
 * SAFETY: setupGlobalEventHandlers() always calls tearDownGlobalEventHandlers()
 * BEFORE overwriting this variable, so re-initialization (e.g., if the
 * bootstrap stage runs twice) never silently drops the first teardown.
 * The teardown is also called during cleanup() to ensure orderly shutdown.
 */
let globalEventTeardown: (() => void) | null = null;
let bfcacheRecoveryTeardown: (() => void) | null = null;

function tearDownGlobalEventHandlers(): void {
  if (globalEventTeardown) {
    const teardown = globalEventTeardown;
    globalEventTeardown = null;
    try {
      teardown();
    } catch (error) {
      __DEV__ && logger.debug('[events] teardown error', error);
    }
  }
  if (bfcacheRecoveryTeardown) {
    const teardown = bfcacheRecoveryTeardown;
    bfcacheRecoveryTeardown = null;
    try {
      teardown();
    } catch (error) {
      __DEV__ && logger.debug('[bfcache] teardown error', error);
    }
  }
}

function wireBFCacheRecovery(restart: () => Promise<void>): () => void {
  const controller = new AbortController();
  const handler: EventListener = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) {
      __DEV__ && logger.info('[bfcache] Page restored from BFCache, restarting app');
      (async () => {
        // Wait for any in-progress cleanup from pagehide to complete
        if (lifecycleState.cleanupPromise) {
          await lifecycleState.cleanupPromise;
        }
        await restart();
      })().catch((error) => {
        __DEV__ && logger.error('[bfcache] Restart failed', error);
      });
    }
  };
  getEventManager().addEventListener(window, 'pageshow', handler, {
    signal: controller.signal,
    context: 'bootstrap:pageshow',
  });
  return () => controller.abort();
}

function setupGlobalEventHandlers(): void {
  tearDownGlobalEventHandlers();
  globalEventTeardown = wireGlobalEvents(() => {
    lifecycleState.cleanupPromise = cleanup().catch((error) => {
      __DEV__ && logger.error('Cleanup failed', error);
    });
  });
  bfcacheRecoveryTeardown = wireBFCacheRecovery(startApplication);
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
      run: () => getGlobalErrorHandler().initialize(),
    },
    {
      label: 'Settings',
      run: initializeGalleryServices,
      optional: true,
    },
    {
      label: 'Core services (Theme / Language / Media)',
      run: initializeCoreBaseServices,
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

export async function cleanup(): Promise<void> {
  try {
    __DEV__ && logger.info('Starting application cleanup');

    await runOptionalCleanup('gallery', async () => {
      const app = lifecycleState.galleryApp;
      lifecycleState.galleryApp = null;
      if (app) await app.cleanup();
    });
    await runOptionalCleanup('theme-service', () => {
      const ts = getThemeService();
      if (ts.isInitialized()) ts.destroy();
    });
    tearDownGlobalEventHandlers();
    await runOptionalCleanup('error-handler', () => getGlobalErrorHandler().destroy());
    clearSettings();
    resetEventManager();

    if (__DEV__) {
      const remaining = getEventManager().getListenerStatus();
      if (remaining > 0) {
        logger.warn('[cleanup] uncleared listeners remain:', remaining);
      }
    }

    lifecycleState.started = false;
    __DEV__ && logger.info('Application cleanup complete');
  } catch (error) {
    bootstrapErrorReporter.error(error, { code: 'CLEANUP_FAILED' });
    throw error;
  }
}

export async function startApplication(): Promise<void> {
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

// ── URL guard: only activate on X.com / Twitter.com ──────────────────────────

/** Paths where gallery initialization is unnecessary (login, settings, etc.). */
const EXCLUDED_PATH_PREFIXES = [
  '/login',
  '/logout',
  '/signup',
  '/settings',
  '/i/flow/',
  '/i/settings',
  '/intent/',
  '/share',
] as const;

export function isAllowedStartPage(): boolean {
  const hostname = location.hostname.toLowerCase();
  const allowed = (TWITTER_HOSTS as unknown as readonly string[]).some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
  if (!allowed) return false;

  const path = location.pathname;
  return !EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

if (isAllowedStartPage()) {
  void startApplication().catch((error) => {
    __DEV__ && logger.error('Application failed to start', error);
  });
}

// SPA navigation listener: X.com uses client-side routing.
// The module-level isAllowedStartPage() check only runs once at load time;
// if the user navigates from /settings to timeline via SPA, the gallery
// would never start. This listener catches SPA route changes.
if (typeof navigation !== 'undefined') {
  navigation.addEventListener('navigate', () => {
    if (isAllowedStartPage() && !lifecycleState.started) {
      void startApplication().catch((error) => {
        __DEV__ && logger.error('Application failed to start (SPA nav)', error);
      });
    } else if (!isAllowedStartPage() && lifecycleState.started) {
      void cleanup().catch((error) => {
        __DEV__ && logger.error('Application cleanup failed (SPA nav away)', error);
      });
    }
  });
} else {
  // Fallback for browsers without Navigation API
  window.addEventListener('popstate', () => {
    if (isAllowedStartPage() && !lifecycleState.started) {
      void startApplication().catch((error) => {
        __DEV__ && logger.error('Application failed to start (popstate)', error);
      });
    } else if (!isAllowedStartPage() && lifecycleState.started) {
      void cleanup().catch((error) => {
        __DEV__ && logger.error('Application cleanup failed (popstate away)', error);
      });
    }
  });
}
