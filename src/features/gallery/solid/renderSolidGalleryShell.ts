/**
 * @fileoverview Solid gallery shell renderer
 * @description Provides factory to mount the Solid-based gallery shell into a host container.
 */

import { getSolidCore } from '@shared/external/vendors';
import { mountGallery, unmountGallery } from '@shared/components/isolation';

import SolidGalleryShell, { type SolidGalleryShellProps } from './SolidGalleryShell.solid';

export interface SolidGalleryShellRenderOptions extends SolidGalleryShellProps {
  readonly container: HTMLElement;
}

export interface SolidGalleryShellInstance {
  dispose(): void;
}

export function renderSolidGalleryShell(
  options: SolidGalleryShellRenderOptions
): SolidGalleryShellInstance {
  const { container, ...props } = options;
  const { createComponent } = getSolidCore();
  const useShadowDom = props.uiOverrides?.useShadowDom ?? true;

  let disposed = false;

  mountGallery(container, () => createComponent(SolidGalleryShell, props), useShadowDom);

  return {
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      try {
        unmountGallery(container);
      } catch {
        // ignore cleanup errors
      }
    },
  };
}
