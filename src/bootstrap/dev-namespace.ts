/**
 * @fileoverview Development namespace setup for debugging.
 *
 * Exposes application state and controls to the browser console via
 * `window.__xeg_dev__.main`. Only operates in development mode.
 */

import type { createAppConfig } from '@constants/app-config';
import type { IGalleryApp } from '@shared/container/app-container';
import { mutateDevNamespace } from '@shared/devtools/dev-namespace';

/**
 * Development actions exposed in the dev namespace.
 */
type DevActions = {
  start: () => Promise<void>;
  createConfig: typeof createAppConfig;
  cleanup: () => Promise<void>;
};

/**
 * Setup and populate the development namespace with app controls and state.
 *
 * Updates `window.__xeg_dev__.main` with action methods and optional gallery
 * app instance. Safe to call multiple times; updates incrementally.
 *
 * @param galleryAppInstance - Gallery app instance (undefined = no change, null = remove)
 * @param actions - Development actions to expose
 */
export function setupDevNamespace(
  galleryAppInstance: IGalleryApp | null | undefined,
  actions: DevActions
): void {
  mutateDevNamespace((namespace) => {
    const mainNamespace = (namespace.main ??= {
      ...actions,
    }) as typeof namespace.main;

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
