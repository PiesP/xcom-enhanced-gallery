// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { setTypedSetting } from '@shared/container/settings-registry';
import { withTrustedEvent } from '@shared/utils/events/trusted-event';

interface NativeVideoRecoveryOptions {
  readonly isCurrent: () => boolean;
  readonly onEnabled: () => void;
  readonly onError: (error: unknown) => void;
}

/** A failed video may offer one explicit, trusted switch to the existing native mode. */
export function startNativeVideoRecovery(options: NativeVideoRecoveryOptions): () => void {
  let active = true;
  let saving = false;
  const listener = withTrustedEvent((event: KeyboardEvent): void => {
    if (!active || saving || !options.isCurrent()) {
      return;
    }
    if (
      event.code !== 'KeyV' ||
      !event.altKey ||
      !event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.repeat ||
      event.isComposing
    ) {
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
      )
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    saving = true;
    void Promise.resolve()
      .then(() => {
        if (active && options.isCurrent()) {
          return setTypedSetting('gallery.videoClickMode', 'block-all');
        }
        return undefined;
      })
      .then(
        () => {
          if (active && options.isCurrent()) {
            dispose();
            options.onEnabled();
          }
        },
        (error: unknown) => {
          saving = false;
          if (active && options.isCurrent()) {
            options.onError(error);
          }
        }
      );
  });
  const dispose = (): void => {
    if (!active) {
      return;
    }
    active = false;
    document.removeEventListener('keydown', listener, true);
  };
  document.addEventListener('keydown', listener, true);
  return dispose;
}
