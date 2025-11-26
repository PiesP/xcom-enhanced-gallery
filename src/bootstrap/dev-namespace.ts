import type { IGalleryApp } from '@shared/container/app-container';
import { mutateDevNamespace } from '@shared/devtools/dev-namespace';
import type { createAppConfig } from '@/constants/app-config';

type DevActions = {
  start: () => Promise<void>;
  createConfig: typeof createAppConfig;
  cleanup: () => Promise<void>;
};

type DevMainNamespace = DevActions & {
  galleryApp?: IGalleryApp | null;
};

export function setupDevNamespace(
  galleryAppInstance: IGalleryApp | null | undefined,
  actions: DevActions,
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
