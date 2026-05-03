/**
 * @fileoverview Development namespace setup for debugging.
 *
 * Exposes application state and controls to the browser console via
 * `window.__xeg_dev__.main`. Only operates in development mode.
 */

import type { createAppConfig } from '@constants/app-config';
import { mutateDevNamespace } from '@shared/devtools/dev-namespace';

interface GalleryAppLike {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

type DevActions = {
  start: () => Promise<void>;
  createConfig: typeof createAppConfig;
  cleanup: () => Promise<void>;
};

export function setupDevNamespace(
  galleryAppInstance: GalleryAppLike | null | undefined,
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
