import type { createAppConfig } from '@constants/app-config';
import type { IGalleryApp } from '@shared/container/app-container';

type DevActions = {
  start: () => Promise<void>;
  createConfig: typeof createAppConfig;
  cleanup: () => Promise<void>;
};

export function setupDevNamespace(
  _galleryAppInstance: IGalleryApp | null | undefined,
  _actions: DevActions
): void {
  // No-op in production builds.
}
