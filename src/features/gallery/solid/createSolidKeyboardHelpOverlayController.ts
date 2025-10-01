import type { Accessor, Setter } from 'solid-js';
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

export interface SolidKeyboardHelpOverlayController {
  open(): void;
  close(): void;
  dispose(): void;
  isOpen(): boolean;
}

const noop = () => {};

const noopController: SolidKeyboardHelpOverlayController = {
  open: noop,
  close: noop,
  dispose: noop,
  isOpen: () => false,
};

export function createSolidKeyboardHelpOverlayController(): SolidKeyboardHelpOverlayController {
  if (typeof document === 'undefined' || typeof document.body === 'undefined') {
    return noopController;
  }

  const { render } = getSolidWeb();
  const { createSignal, createEffect, createComponent, createRoot } = getSolidCore();
  const container = document.createElement('div');
  container.setAttribute('data-xeg-solid-help-overlay', '');
  container.setAttribute('role', 'presentation');

  try {
    document.body.appendChild(container);
  } catch (error) {
    logger.warn('[SolidKeyboardHelpOverlay] Failed to append container', error);
    return noopController;
  }

  let isDisposed = false;
  let getIsOpen: Accessor<boolean> = () => false;
  let setIsOpen: Setter<boolean> | undefined;
  let disposeRoot: (() => void) | null = null;

  try {
    createRoot(dispose => {
      const [openSignal, setOpenSignal] = createSignal(false);
      getIsOpen = openSignal;
      setIsOpen = setOpenSignal;

      const OverlayHost = () => {
        createEffect(() => {
          if (isDisposed) {
            return;
          }
          const openState = openSignal();
          container.setAttribute('data-xeg-open', openState ? 'true' : 'false');
          if (openState) {
            container.removeAttribute('aria-hidden');
          } else {
            container.setAttribute('aria-hidden', 'true');
          }
        });

        return createComponent(KeyboardHelpOverlay, {
          get open() {
            return openSignal();
          },
          onClose: () => {
            if (!isDisposed) {
              setOpenSignal(false);
            }
          },
        });
      };

      let disposeRender: (() => void) | null = null;

      try {
        disposeRender = render(
          () => createComponent(OverlayHost, {} as Record<string, never>),
          container
        );
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
    logger.error('[SolidKeyboardHelpOverlay] initial render failed', error);
    try {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    } catch (removeError) {
      logger.warn('[SolidKeyboardHelpOverlay] Failed to remove container', removeError);
    }
    return noopController;
  }

  const close = () => {
    if (isDisposed) {
      return;
    }
    setIsOpen?.(false);
  };

  const open = () => {
    if (isDisposed || getIsOpen()) {
      return;
    }
    setIsOpen?.(true);
  };

  const dispose = () => {
    if (isDisposed) {
      return;
    }
    isDisposed = true;
    try {
      setIsOpen?.(false);
      disposeRoot?.();
    } catch (error) {
      logger.warn('[SolidKeyboardHelpOverlay] dispose render failed', error);
    }

    try {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    } catch (error) {
      logger.warn('[SolidKeyboardHelpOverlay] Failed to remove container', error);
    }
  };

  return {
    open,
    close,
    dispose,
    isOpen: () => getIsOpen(),
  };
}
