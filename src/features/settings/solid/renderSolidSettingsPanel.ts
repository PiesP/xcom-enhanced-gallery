/**
 * @fileoverview Solid settings panel renderer
 * @description FRAME-ALT-001 Stage B - Solid 기반 설정 패널 마운트 유틸리티
 */

import type { Accessor, Setter } from 'solid-js';
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import { logger } from '@shared/logging';

import SolidSettingsPanel, { type SolidSettingsPanelProps } from './SolidSettingsPanel.solid';

export interface SolidSettingsPanelRenderOptions extends Omit<SolidSettingsPanelProps, 'isOpen'> {
  readonly container: HTMLElement;
  readonly defaultOpen?: boolean;
}

export interface SolidSettingsPanelInstance {
  dispose(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
}

export function renderSolidSettingsPanel(
  options: SolidSettingsPanelRenderOptions
): SolidSettingsPanelInstance {
  const { container, defaultOpen = true, onClose, position, testId } = options;

  const { render } = getSolidWeb();
  const { createComponent, createSignal, createRoot, batch } = getSolidCore();

  let disposed = false;
  let getIsOpen: Accessor<boolean> = () => defaultOpen;
  let setIsOpen: Setter<boolean> | undefined;
  let disposeRoot: (() => void) | null = null;

  const safelyRun = (action: () => void) => {
    try {
      action();
    } catch (error) {
      logger.warn('[renderSolidSettingsPanel] Action execution failed:', error);
    }
  };

  const notifyClose = () => {
    safelyRun(onClose);
  };

  const internalClose = () => {
    if (!getIsOpen()) {
      return;
    }
    batch(() => {
      if (setIsOpen) {
        setIsOpen(false);
      }
      notifyClose();
    });
  };

  try {
    createRoot(dispose => {
      const [isOpenSignal, setIsOpenSignal] = createSignal<boolean>(defaultOpen);
      getIsOpen = isOpenSignal;
      setIsOpen = setIsOpenSignal;

      const panelProps: SolidSettingsPanelProps = {
        isOpen: isOpenSignal,
        onClose: internalClose,
        ...(position !== undefined ? { position } : {}),
        ...(testId !== undefined ? { testId } : {}),
      };

      let disposeRender: (() => void) | null = null;
      try {
        disposeRender = render(() => createComponent(SolidSettingsPanel, panelProps), container);
      } catch (error) {
        dispose();
        throw error;
      }

      disposeRoot = () => {
        disposeRender?.();
        dispose();
      };
    });
  } catch (error) {
    safelyRun(() => {
      container.replaceChildren();
    });
    throw error;
  }

  const cleanup = () => {
    if (disposed) {
      return;
    }
    disposed = true;

    safelyRun(() => {
      disposeRoot?.();
      disposeRoot = null;
    });

    safelyRun(() => {
      container.replaceChildren();
    });
  };

  return {
    dispose: cleanup,
    open: () => {
      if (disposed) {
        return;
      }
      setIsOpen?.(true);
    },
    close: () => {
      if (disposed) {
        return;
      }
      internalClose();
    },
    isOpen: () => getIsOpen(),
  };
}
