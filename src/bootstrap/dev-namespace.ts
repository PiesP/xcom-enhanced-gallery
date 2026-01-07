/**
 * @fileoverview Development namespace setup and exposure for debugging
 *
 * Provides a mechanism to expose application state and control functions to the browser's
 * global scope during development. This enables interactive debugging, testing, and
 * runtime introspection via the browser console.
 *
 * ## Purpose
 *
 * - **Debug Access**: Expose application state and methods to browser console
 * - **Runtime Control**: Enable start/stop/cleanup operations from console
 * - **State Inspection**: Provide direct access to gallery app instance
 * - **Dev Tools**: Support development and debugging workflows
 *
 * ## Namespace Structure
 *
 * The dev namespace (`window.__xeg_dev__`) is organized as:
 * ```
 * window.__xeg_dev__.main = {
 *   start: () => Promise<void>      // Start the application
 *   cleanup: () => Promise<void>    // Clean up and teardown
 *   createConfig: typeof createAppConfig  // Config factory
 *   galleryApp?: IGalleryApp | null // Gallery app instance (if available)
 * }
 * ```
 *
 * ## Security Notes
 *
 * This module only operates in development mode (`__DEV__` flag). Production builds
 * should tree-shake this code entirely. The namespace mutation is performed via
 * the `mutateDevNamespace` utility which provides safe access patterns.
 *
 * @see {@link mutateDevNamespace} for namespace mutation implementation
 */

import type { createAppConfig } from '@constants/app-config';
import type { IGalleryApp } from '@shared/container/app-container';
import { mutateDevNamespace } from '@shared/devtools/dev-namespace';

/**
 * Core development actions exposed in the dev namespace
 *
 * @property start - Asynchronously start the application
 * @property createConfig - Factory function to create app configuration
 * @property cleanup - Asynchronously clean up and teardown the application
 */
type DevActions = {
  start: () => Promise<void>;
  createConfig: typeof createAppConfig;
  cleanup: () => Promise<void>;
};

/**
 * Main development namespace structure
 *
 * Extends DevActions with an optional gallery app instance reference.
 *
 * @property galleryApp - Reference to gallery app instance (optional, null when not initialized)
 */
type DevMainNamespace = DevActions & {
  galleryApp?: IGalleryApp | null;
};

/**
 * Setup and populate the development namespace with app controls and state
 *
 * Configures the global development namespace (`window.__xeg_dev__.main`) with:
 * 1. Action methods (start, cleanup, createConfig)
 * 2. Gallery app instance reference (if available)
 *
 * The function handles three scenarios for the gallery app instance:
 * - `undefined`: No change to existing galleryApp property
 * - `non-null`: Set galleryApp to the provided instance
 * - `null`: Remove galleryApp property from namespace
 *
 * This mutation is safe and uses the devtools namespace accessor pattern to ensure
 * proper initialization. Multiple calls to this function will update the namespace
 * incrementally without losing existing state.
 *
 * @param galleryAppInstance - Gallery app instance (undefined = no change, null = remove, value = set)
 * @param actions - Development actions to expose (start, cleanup, createConfig)
 *
 * @example
 * ```typescript
 * // During bootstrap, expose actions without gallery app
 * setupDevNamespace(undefined, {
 *   start: () => startApplication(),
 *   cleanup: () => cleanup(),
 *   createConfig
 * });
 *
 * // After gallery initialization, add the instance
 * setupDevNamespace(galleryApp, actions);
 *
 * // On cleanup, remove the instance
 * setupDevNamespace(null, actions);
 * ```
 *
 * @remarks
 * This function only has effect in development builds. Production builds should
 * optimize away all calls to this function via dead code elimination.
 */
export function setupDevNamespace(
  galleryAppInstance: IGalleryApp | null | undefined,
  actions: DevActions
): void {
  mutateDevNamespace((namespace) => {
    const mainNamespace =
      (namespace.main as DevMainNamespace | undefined) ??
      (namespace.main = {
        ...actions,
      } as DevMainNamespace);

    mainNamespace.start = actions.start;
    mainNamespace.createConfig = actions.createConfig;
    mainNamespace.cleanup = actions.cleanup;

    if (galleryAppInstance !== undefined) {
      if (galleryAppInstance) {
        mainNamespace.galleryApp = galleryAppInstance;
      } else {
        delete mainNamespace.galleryApp;
      }
    }
  });
}
