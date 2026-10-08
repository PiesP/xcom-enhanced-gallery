// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { isHTMLElement } from '@shared/utils/types/guards';

export interface EarlyMediaClickReplay {
  complete(resume: (event: MouseEvent) => Promise<void>): Promise<void>;
  dispose(): void;
}

/**
 * Capture the first valid media click while asynchronous extension bootstrap is
 * still installing the gallery listener. Retain the original trusted event for
 * a private application callback; redispatching it would lose its trusted state.
 */
export function installEarlyMediaClickReplay(
  documentRef: Document = document
): EarlyMediaClickReplay {
  let pendingClick: MouseEvent | null = null;
  let disposed = false;

  const handleClick = (event: MouseEvent): void => {
    if (!event.isTrusted) return;
    const target = event.target;
    if (!isHTMLElement(target) || !isProcessableMedia(target, event)) return;

    event.stopImmediatePropagation();
    event.preventDefault();
    pendingClick ??= event;
  };

  documentRef.addEventListener('click', handleClick, { capture: true });

  const removeListener = (): void => {
    documentRef.removeEventListener('click', handleClick, { capture: true });
  };

  return {
    async complete(resume): Promise<void> {
      if (disposed) return;
      disposed = true;
      removeListener();

      const click = pendingClick;
      pendingClick = null;
      if (click && isHTMLElement(click.target) && click.target.isConnected) {
        await resume(click);
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
