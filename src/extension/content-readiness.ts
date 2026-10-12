// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { getMediaClickTarget } from '@shared/utils/media/media-click-target';

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
  let pendingTarget: HTMLElement | null = null;
  let disposed = false;

  const handleClick = (event: MouseEvent): void => {
    if (!event.isTrusted) return;
    const target = getMediaClickTarget(event);
    if (!target?.isConnected || !isProcessableMedia(target, event)) return;

    event.stopImmediatePropagation();
    event.preventDefault();
    if (!pendingClick) {
      pendingClick = event;
      pendingTarget = target;
    }
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
      const target = pendingTarget;
      pendingClick = null;
      pendingTarget = null;
      if (click && target?.isConnected && getMediaClickTarget(click) === target) {
        await resume(click);
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      pendingClick = null;
      pendingTarget = null;
      removeListener();
    },
  };
}
