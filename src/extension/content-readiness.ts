// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { isHTMLElement } from '@shared/utils/types/guards';

interface PendingClick {
  readonly init: MouseEventInit;
  readonly target: HTMLElement;
}

export interface EarlyMediaClickReplay {
  complete(): void;
  dispose(): void;
}

function copyMouseEvent(event: MouseEvent): MouseEventInit {
  return {
    bubbles: true,
    button: event.button,
    buttons: event.buttons,
    cancelable: true,
    clientX: event.clientX,
    clientY: event.clientY,
    composed: true,
    ctrlKey: event.ctrlKey,
    detail: event.detail,
    metaKey: event.metaKey,
    screenX: event.screenX,
    screenY: event.screenY,
    shiftKey: event.shiftKey,
  };
}

/**
 * Capture the first valid media click while asynchronous extension bootstrap is
 * still installing the delegated gallery listener, then replay it exactly once.
 */
export function installEarlyMediaClickReplay(
  documentRef: Document = document
): EarlyMediaClickReplay {
  let pendingClick: PendingClick | null = null;
  let disposed = false;

  const handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!isHTMLElement(target) || !isProcessableMedia(target, event)) return;

    event.stopImmediatePropagation();
    event.preventDefault();
    pendingClick ??= { init: copyMouseEvent(event), target };
  };

  documentRef.addEventListener('click', handleClick, { capture: true });

  const removeListener = (): void => {
    documentRef.removeEventListener('click', handleClick, { capture: true });
  };

  return {
    complete(): void {
      if (disposed) return;
      disposed = true;
      removeListener();

      const click = pendingClick;
      pendingClick = null;
      if (click?.target.isConnected) {
        click.target.dispatchEvent(new MouseEvent('click', click.init));
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      pendingClick = null;
      removeListener();
    },
  };
}
