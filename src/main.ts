/**
 * X.com Enhanced Gallery - Main entry point
 *
 * Simplified structure - Optimized for userscript
 *
 * @version 4.0.0
 */

import { logger } from '@/shared/logging';
import { initializeEnvironment } from '@/bootstrap/environment';
import { wireGlobalEvents } from '@/bootstrap/events';
import type { AppConfig } from '@shared/types';
import type { IGalleryApp } from '@shared/container/app-container';
import { initializeCriticalSystems } from '@/bootstrap/critical-systems';
import { initializeDevTools } from '@/bootstrap/dev-tools';
import { registerFeatureServicesLazy } from '@/bootstrap/features';
import { initializeGalleryApp, clearGalleryApp } from '@/bootstrap/gallery-init';
import { waitForWindowLoad } from '@shared/utils/window-load';
import { warmupNonCriticalServices } from '@shared/container/service-accessors';
import { CoreService } from '@shared/services/core';
import { cleanupVendors } from './shared/external/vendors';
import { globalTimerManager } from '@shared/utils/timer-management';

// Global styles
// Global styles are loaded at runtime to avoid import-time side effects.
// They are dynamically loaded inside startApplication for safety in both tests and bundling.

// Vendor initialization moved to startApplication
// Application state management
let isStarted = false;
let startPromise: Promise<void> | null = null;
let galleryApp: IGalleryApp | null = null;
let cleanupHandlers: (() => Promise<void> | void)[] = [];

/**
 * DEV namespace setup utility
 * Phase 1.1: Helper function to eliminate duplicate code
 */
function setupDevNamespace(galleryAppInstance?: IGalleryApp | null): void {
  if (!import.meta.env.DEV) return;

  type WindowWithXEG = Window & {
    __XEG__?: {
      main?: {
        start: typeof startApplication;
        createConfig: typeof createAppConfig;
        cleanup: typeof cleanup;
        galleryApp?: IGalleryApp;
      };
    };
  };

  const win = globalThis as unknown as WindowWithXEG;
  win.__XEG__ = win.__XEG__ || {};
  win.__XEG__.main = {
    start: startApplication,
    createConfig: createAppConfig,
    cleanup,
  };

  if (galleryAppInstance) {
    win.__XEG__.main.galleryApp = galleryAppInstance;
  }
}

// Lean mode: requestIdleCallback scheduling removed

/**
 * Create application configuration
 */
function createAppConfig(): AppConfig {
  return {
    version: import.meta.env.VITE_VERSION ?? '3.1.0',
    isDevelopment: import.meta.env.DEV,
    debug: import.meta.env.DEV,
    autoStart: true,
    renderAfterLoad: true,
  };
}

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
  const unregister = wireGlobalEvents(() => {
    cleanup().catch(error => logger.error('Error during page unload cleanup:', error));
  });
  cleanupHandlers.push(unregister);
}

/**
 * Application cleanup
 */
async function cleanup(): Promise<void> {
  try {
    logger.info('🧹 Starting application cleanup');
    if (galleryApp) {
      await galleryApp.cleanup();
      clearGalleryApp(); // Phase 2.1: Cleanup via bootstrap module
      galleryApp = null;
      // Phase 290: Namespace isolation - cleanup only in development environment
      if (import.meta.env.DEV) {
        type WindowWithXEG = Window & {
          __XEG__?: {
            main?: {
              galleryApp?: unknown;
            };
          };
        };
        const win = globalThis as unknown as WindowWithXEG;
        if (win.__XEG__?.main) {
          delete win.__XEG__.main.galleryApp;
        }
      }
    }

    // CoreService instance cleanup (access prohibited from features layer, performed here only)
    CoreService.getInstance().cleanup();

    // Vendor resource cleanup (explicit call; no import-time side effects)
    try {
      cleanupVendors();
    } catch (e) {
      logger.warn('Warning during vendor cleanup:', e);
    }

    // Global DOMCache instance cleanup (remove import-time interval)
    try {
      const { globalDOMCache } = await import('@shared/dom/dom-cache');
      if (globalDOMCache) {
        globalDOMCache.dispose();
      }
    } catch (e) {
      logger.warn('Warning during DOMCache cleanup:', e);
    }

    await Promise.all(
      cleanupHandlers.map(handler =>
        Promise.resolve(handler()).catch((error: unknown) =>
          logger.warn('Error during cleanup handler execution:', error)
        )
      )
    );
    cleanupHandlers = [];

    // Global timer cleanup (non-critical init, etc.)
    try {
      globalTimerManager.cleanup();
    } catch (e) {
      logger.warn('Warning during global timer cleanup:', e);
    }

    // DOMContentLoaded handler registered at module level removed (test environment stabilization)
    // Phase 236: @run-at document-idle guarantee eliminates DOMContentLoaded listener
    // No listeners to remove anymore, so this block itself is removed

    // Global error handler cleanup (remove window:error/unhandledrejection listeners)
    try {
      const { GlobalErrorHandler } = await import('@shared/error');
      GlobalErrorHandler.getInstance().destroy();
    } catch (e) {
      logger.debug('Global error handlers cleanup skipped or failed:', e);
    }

    // Phase 415: Event listener cleanup verification (development mode)
    // Detect uncleared event listeners in development to catch memory leaks early
    if (import.meta.env.DEV) {
      try {
        const { getEventListenerStatus } = await import('@shared/utils/events');
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
      } catch (e) {
        logger.debug('[cleanup] Event listener status check skipped:', e);
      }
    }

    isStarted = false;
    logger.info('✅ Application cleanup complete');
  } catch (error) {
    logger.error('❌ Error during application cleanup:', error);
    throw error;
  }
}

/**
 * Main application entry point
 *
 * 📋 7-stage bootstrap process:
 * 1️⃣  Infrastructure initialization (Vendor load) - src/bootstrap/environment.ts
 * 2️⃣  Core systems (Core services + notification stack) - src/bootstrap/critical-systems.ts (Phase 2.1)
 * 3️⃣  Base services (Animation/Theme/Language) - src/bootstrap/base-services.ts (Phase 2.1)
 * 4️⃣  Feature service registration (lazy load) - src/bootstrap/features.ts
 * 5️⃣  Global event handler setup - src/bootstrap/events.ts
 * 6️⃣  Gallery app initialization - src/features/gallery/GalleryApp.ts
 * 7️⃣  Background system initialization (non-critical services)
 *
 * 💡 Critical vs Non-Critical:
 * - Critical: Needed immediately after page load (infrastructure, core, gallery)
 * - Non-Critical: Can wait until after user interaction (background timers)
 */
async function startApplication(): Promise<void> {
  if (isStarted) {
    logger.debug('Application: Already started');
    return;
  }

  if (startPromise) {
    logger.debug('Application: Start in progress - reusing promise');
    return startPromise;
  }

  startPromise = (async () => {
    logger.info('🚀 Starting X.com Enhanced Gallery...');

    // Load global styles (prevent import-time side effects)
    await import('./styles/globals');

    // Initialize development tools (dev environment only; skip in test mode to avoid leak scan interference)
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      await initializeDevTools();
    } else if (import.meta.env.DEV) {
      logger.debug('DevTools initialization skipped (test mode)');
    }

    // Phase 1: Initialize base infrastructure
    await initializeInfrastructure();

    // Phase 2: Initialize only critical systems (gallery excluded)
    await initializeCriticalSystems();

    // Phase 415: BaseService initialization moved to GalleryApp (deferred initialization)
    // Previously Phase A5.2 was here, now moved to GalleryApp.initialize() for lazy loading
    // This reduces initial bootstrap time by 5-10% since Theme/Language are not immediately needed

    // Phase 3: Register Feature Services lazily
    await registerFeatureServicesLazy();

    // Phase 4: Set up global event handlers
    setupGlobalEventHandlers();

    // Phase 5: Initialize gallery app (optionally delayed after window.load)
    // In test mode, Solid.js global event delegation listeners are registered,
    // which can interfere with leak scan tests (active EventTarget listeners), so skip this.
    if (import.meta.env.MODE !== 'test') {
      const appConfig = createAppConfig();
      if (appConfig.renderAfterLoad !== false) {
        await waitForWindowLoad({ timeoutMs: 8000 });
      }

      await initializeGalleryImmediately();
    } else {
      logger.debug('Gallery initialization skipped (test mode)');
    }

    // Phase 6: Initialize Non-Critical systems in background
    initializeNonCriticalSystems();

    // Phase 326: Code Splitting - Execute preload strategy
    // Preload optional feature (Settings, etc.) chunks during idle time
    if (import.meta.env.MODE !== 'test') {
      void (async () => {
        try {
          const { executePreloadStrategy } = await import('@/bootstrap/preload');
          await executePreloadStrategy();
        } catch (error) {
          logger.warn('[Phase 326] Error executing preload strategy:', error);
        }
      })();
    }

    isStarted = true;

    logger.info('✅ Application initialization complete');

    // Phase 290: Namespace isolation - provide single namespace for global access in dev environment
    setupDevNamespace(galleryApp);
  })()
    .catch(error => {
      logger.error('❌ Application initialization failed (lean mode, no retry):', error);
    })
    .finally(() => {
      // Release startPromise for next manual call (already started case is guarded by isStarted)
      startPromise = null;
    });

  return startPromise;
}

/**
 * Gallery immediate initialization (no delay)
 */
async function initializeGalleryImmediately(): Promise<void> {
  try {
    logger.debug('🎯 Starting gallery immediate initialization');

    // Phase 2.1: Initialization via bootstrap module
    galleryApp = await initializeGalleryApp();

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
setupDevNamespace();
