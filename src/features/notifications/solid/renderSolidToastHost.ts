/**
 * @fileoverview Solid toast host renderer
 * @description FRAME-ALT-001 Stage C bridge utility for mounting SolidToastHost into DOM
 */

import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import { logger } from '@shared/logging';

import SolidToastHost, { type SolidToastHostProps } from './SolidToastHost.solid';

export interface SolidToastHostRenderOptions extends SolidToastHostProps {
  readonly container: HTMLElement;
}

export interface SolidToastHostHandle {
  dispose(): void;
}

export function renderSolidToastHost(options: SolidToastHostRenderOptions): SolidToastHostHandle {
  const { container, ...rest } = options;
  const { createComponent } = getSolidCore();
  const { render } = getSolidWeb();

  let disposed = false;

  const dispose = render(() => createComponent(SolidToastHost, rest), container);

  const cleanup = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    try {
      dispose();
    } catch (error) {
      logger.warn('[renderSolidToastHost] dispose failed:', error);
    }

    try {
      container.replaceChildren();
    } catch (error) {
      logger.warn('[renderSolidToastHost] container cleanup failed:', error);
    }
  };

  return {
    dispose: cleanup,
  };
}
