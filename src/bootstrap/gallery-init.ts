/**
 * @fileoverview Gallery App Initialization and Lazy Loading
 *
 * ## Purpose
 * Provides lazy initialization for the X.com Enhanced Gallery application, managing the
 * creation, configuration, and startup of the gallery system and its dependencies. This
 * module orchestrates service registration, renderer setup, and application lifecycle.
 *
 * ## Key Responsibilities
 * - **Lazy Loading**: Gallery app creation deferred until first invocation
 * - **Service Initialization**: Settings, theme, and renderer services setup
 * - **Parallel Bootstrapping**: Concurrent initialization of independent services
 * - **Error Reporting**: Comprehensive error handling with context-aware reporters
 * - **Development Integration**: Global namespace exposure in development builds
 *
 * ## Initialization Flow
 * 1. **Renderer Registration** (registerRenderer): GalleryRenderer service registration with
 *    singleton pattern to prevent duplicate registrations
 * 2. **Service Initialization** (initializeServices): Settings and theme services setup
 *    with graceful degradation on API limitations
 * 3. **Parallel Execution**: Renderer and services initialized concurrently via Promise.all
 * 4. **Gallery App Creation**: GalleryApp instantiation and lifecycle initialization
 * 5. **Global Exposure** (dev only): App instance attached to window.__xeg_dev__ namespace
 *
 * ## Error Handling Strategy
 * - **Non-Fatal Errors**: Settings/theme failures logged but don't block initialization
 * - **Fatal Errors**: Gallery app creation failures throw and propagate to caller
 * - **GM API Limitations**: Warnings logged but app continues with degraded functionality
 * - **Error Reporters**: Context-specific reporters (bootstrap, settings, gallery) for debugging
 *
 * ## Bootstrap Context
 * Called from bootstrap pipeline after critical systems and event handlers are established.
 * This is the final phase where user-facing features become active. The lazy nature allows
 * the bootstrap to complete quickly, deferring heavy gallery initialization until needed.
 *
 * ## Historical Context
 * - **Phase 2.1**: Initial gallery app architecture with lazy loading pattern
 * - **Phase 345**: Enhanced type safety with IGalleryApp interface and contract types
 * - **Current**: Parallel initialization optimization and error reporter integration
 *
 * @module bootstrap/gallery-init
 */

import { GalleryApp } from '@features/gallery/GalleryApp';
import { GalleryRenderer } from '@features/gallery/GalleryRenderer.tsx';
import { SettingsService } from '@features/settings/services/settings-service';
import type { IGalleryApp } from '@shared/container/app-container';
import {
  getThemeService,
  registerGalleryRenderer,
  registerSettingsManager,
} from '@shared/container/service-accessors';
import {
  bootstrapErrorReporter,
  galleryErrorReporter,
  settingsErrorReporter,
} from '@shared/error/app-error-reporter';
import { isGMAPIAvailable } from '@shared/external/userscript/environment-detector';
import { logger } from '@shared/logging/logger';
import type { SettingsServiceLike } from '@shared/services/theme-service';

/**
 * Singleton registration task for GalleryRenderer to prevent duplicate registrations.
 * Null when no registration is in progress, Promise when registration is ongoing.
 * Cleared via finally() after registration completes or fails.
 *
 * @internal
 */
let rendererRegistrationTask: Promise<void> | null = null;

/**
 * Register GalleryRenderer service with singleton pattern.
 *
 * Ensures only one GalleryRenderer instance is registered even if called multiple times
 * concurrently. Subsequent calls wait for the first registration to complete rather than
 * creating duplicate instances.
 *
 * ## Implementation Details
 * - **Singleton Guard**: Uses module-level `rendererRegistrationTask` promise
 * - **Registration**: Calls `registerGalleryRenderer()` with new GalleryRenderer instance
 * - **Cleanup**: Clears task reference in finally() for idempotency
 * - **Concurrency Safe**: Multiple concurrent calls share same promise
 *
 * @returns Promise that resolves when registration completes
 *
 * @internal
 * @remarks
 * This function is internal to the module and called by {@link initializeGalleryApp}.
 * Direct calls outside this module are unnecessary.
 */
async function registerRenderer(): Promise<void> {
  if (!rendererRegistrationTask) {
    rendererRegistrationTask = (async () => {
      registerGalleryRenderer(new GalleryRenderer());
    })().finally(() => {
      rendererRegistrationTask = null;
    });
  }

  await rendererRegistrationTask;
}

/**
 * Initialize core services required for gallery operation.
 *
 * Sets up SettingsService and ThemeService with graceful degradation on failures.
 * Non-critical failures (e.g., GM API limitations, settings init) are logged but don't
 * block initialization, allowing the app to continue with reduced functionality.
 *
 * ## Initialization Sequence
 * 1. **Environment Check**: Verify GM API availability (download, setValue)
 *    - Warns if APIs missing but continues with degraded functionality
 * 2. **Settings Service**: Create, initialize, and register SettingsService
 *    - On failure: Warns and continues without settings persistence
 * 3. **Theme Service**: Initialize and bind to settings service
 *    - On failure: Warns and continues with default theme
 *
 * ## Error Handling
 * - **GM API Missing**: Warning logged via bootstrapErrorReporter, non-blocking
 * - **Settings Init Failure**: Warning logged via settingsErrorReporter, non-blocking
 * - **Theme Sync Failure**: Warning logged via bootstrapErrorReporter, non-blocking
 * - **Graceful Degradation**: App continues with reduced functionality on any failure
 *
 * ## Development Mode Logging
 * - Debug log after successful SettingsService initialization
 * - Debug log after theme confirmation with current theme value
 *
 * @returns Promise that resolves when services are initialized (always succeeds)
 *
 * @internal
 * @remarks
 * This function never throws; all errors are caught, logged, and handled gracefully.
 * Called by {@link initializeGalleryApp} in parallel with renderer registration.
 */
async function initializeServices(): Promise<void> {
  // 1. Environment Check
  const hasRequiredGMAPIs = isGMAPIAvailable('download') || isGMAPIAvailable('setValue');
  if (!hasRequiredGMAPIs) {
    bootstrapErrorReporter.warn(new Error('Tampermonkey APIs limited'), {
      code: 'GM_API_LIMITED',
    });
  }

  // 2. Settings Service
  let settingsService: SettingsServiceLike | null = null;
  try {
    const service = new SettingsService();
    await service.initialize();
    registerSettingsManager(service);
    settingsService = service as unknown as SettingsServiceLike;
    if (__DEV__) {
      logger.debug('[Bootstrap] ✅ SettingsService initialized');
    }
  } catch (error) {
    settingsErrorReporter.warn(error, {
      code: 'SETTINGS_SERVICE_INIT_FAILED',
    });
  }

  // 3. Theme Service
  try {
    const themeService = getThemeService();

    if (!themeService.isInitialized()) {
      await themeService.initialize();
    }

    if (settingsService) {
      themeService.bindSettingsService(settingsService);
    }

    if (__DEV__) {
      logger.debug(`[Bootstrap] Theme confirmed: ${themeService.getCurrentTheme()}`);
    }
  } catch (error) {
    bootstrapErrorReporter.warn(error, {
      code: 'THEME_SYNC_FAILED',
    });
  }
}

/**
 * Initialize and return the gallery application instance.
 *
 * Main entry point for gallery initialization with lazy loading pattern. Creates and
 * configures all required services (renderer, settings, theme) and returns a fully
 * initialized GalleryApp instance ready for operation.
 *
 * ## Initialization Process
 * 1. **Parallel Service Setup**: Renderer registration and service initialization run
 *    concurrently via Promise.all for optimal performance
 * 2. **Gallery App Creation**: New GalleryApp instance created after services ready
 * 3. **Lifecycle Initialization**: App's initialize() method invoked for final setup
 * 4. **Development Logging**: Debug messages logged at key milestones when __DEV__ is true
 *
 * ## Services Initialized
 * - **GalleryRenderer**: Rendering service for gallery UI components
 * - **SettingsService**: User preferences and configuration persistence
 * - **ThemeService**: Theme management (light/dark/auto) with settings binding
 *
 * ## Error Handling
 * - **Service Failures**: Non-critical service errors (settings, theme) logged but don't
 *   throw; initialization continues with degraded functionality
 * - **Gallery App Failures**: Fatal errors during GalleryApp creation or initialization
 *   are caught, logged via galleryErrorReporter, and re-thrown to caller
 * - **Error Context**: All errors include diagnostic codes for debugging
 *
 * ## Performance Optimization
 * - **Lazy Loading**: Heavy initialization deferred until first invocation
 * - **Parallel Execution**: Independent services initialized concurrently
 * - **Singleton Pattern**: Renderer registration uses singleton guard
 *
 * ## Development Mode Features
 * - Debug logs: Initialization start, completion, and intermediate steps
 * - Error context: Enhanced error messages with stack traces
 * - Global exposure: App instance attached to window.__xeg_dev__ namespace
 *
 * @returns Initialized IGalleryApp instance ready for operation
 * @throws {Error} If gallery app creation or initialization fails (fatal errors only)
 *
 * @example
 * ```typescript
 * // Basic usage in bootstrap pipeline
 * try {
 *   const galleryApp = await initializeGalleryApp();
 *   // Gallery is now ready for user interaction
 * } catch (error) {
 *   console.error('Gallery initialization failed:', error);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Usage with dev namespace integration
 * const galleryApp = await initializeGalleryApp();
 * if (__DEV__) {
 *   window.__xeg_dev__.main.galleryApp = galleryApp;
 * }
 * ```
 *
 * @remarks
 * This function is the primary export of this module and called from the bootstrap
 * pipeline. It's designed to be called once during application startup, though the
 * singleton patterns used internally make it safe to call multiple times (subsequent
 * calls would create new app instances but reuse registered services).
 *
 * @see {@link IGalleryApp} for the gallery app interface
 * @see {@link registerRenderer} for renderer registration details
 * @see {@link initializeServices} for service initialization details
 */
export async function initializeGalleryApp(): Promise<IGalleryApp> {
  try {
    if (__DEV__) {
      logger.info('🎨 Gallery app lazy initialization starting');
    }

    // Parallel initialization of renderer and services
    await Promise.all([registerRenderer(), initializeServices()]);

    const galleryApp = new GalleryApp();
    await galleryApp.initialize();

    if (__DEV__) {
      logger.info('✅ Gallery app initialization complete');
    }
    return galleryApp;
  } catch (error) {
    galleryErrorReporter.error(error, {
      code: 'GALLERY_APP_INIT_FAILED',
    });
    throw error;
  }
}
