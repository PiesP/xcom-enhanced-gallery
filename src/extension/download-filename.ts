// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { ChromeDownloadItem } from '@platform/chrome.d.ts';

/** Only a basename crosses back to the content script; native paths stay privileged. */
export function observeDownloadFilename(
  requested: string,
  nativePath: string | undefined
): {
  requestedFilename: string;
  observedFilename?: string;
  filenameConforms?: boolean;
} {
  const observed = nativePath?.split(/[\\/]/u).at(-1);
  if (
    !observed ||
    observed.length > 255 ||
    [...observed].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  ) {
    return { requestedFilename: requested };
  }
  const desired = requested.split(/[\\/]/u).at(-1) ?? requested;
  const dot = desired.lastIndexOf('.');
  const stem = dot > 0 ? desired.slice(0, dot) : desired;
  const extension = dot > 0 ? desired.slice(dot) : '';
  const suffix =
    observed.startsWith(`${stem} (`) && observed.endsWith(`)${extension}`)
      ? observed.slice(stem.length + 2, observed.length - extension.length - 1)
      : '';
  return {
    requestedFilename: requested,
    observedFilename: observed,
    filenameConforms: observed === desired || /^[1-9][0-9]*$/u.test(suffix),
  };
}

/** Filename suggestions require the initiating extension AND an exact persisted native-ID binding. */
export class OwnedDownloadFilenamePolicy {
  private allocations = 0;
  private readonly waiters = new Map<number, Set<() => void>>();

  constructor(
    private readonly extensionId: string | undefined,
    private readonly findFilename: (id: number, url: string) => Promise<string | undefined>
  ) {}

  private async lookup(id: number, url: string, deadline: number): Promise<string | undefined> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        this.findFilename(id, url),
        new Promise<undefined>((resolve) => {
          timer = setTimeout(() => resolve(undefined), remaining);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  beginAllocation(): { bound: (id: number) => void; finish: () => void } {
    this.allocations += 1;
    let finished = false;
    return {
      bound: (id) => {
        for (const notify of this.waiters.get(id) ?? []) notify();
      },
      finish: () => {
        if (!finished) {
          finished = true;
          this.allocations -= 1;
        }
      },
    };
  }

  readonly listener = (
    item: ChromeDownloadItem,
    suggest: (value?: { filename: string; conflictAction: 'uniquify' }) => void
  ): boolean | void => {
    if (
      !this.extensionId ||
      item.byExtensionId !== this.extensionId ||
      !item.url ||
      !Number.isSafeInteger(item.id) ||
      item.id <= 0
    ) {
      suggest();
      return;
    }
    const url = item.url;
    const deadline = Date.now() + 2_000;
    void (async () => {
      let filename: string | undefined;
      try {
        // Subscribe before the first lookup to close the allocation/binding race.
        let notify: (() => void) | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const wait = new Promise<void>((resolve) => {
          notify = resolve;
          const pending = this.waiters.get(item.id) ?? new Set<() => void>();
          pending.add(resolve);
          this.waiters.set(item.id, pending);
          timer = setTimeout(resolve, 2_000);
        });
        try {
          filename = await this.lookup(item.id, url, deadline);
          if (filename === undefined) {
            if (this.allocations > 0) await wait;
            filename = await this.lookup(item.id, url, deadline);
          }
        } finally {
          clearTimeout(timer);
          if (notify) this.waiters.get(item.id)?.delete(notify);
          if (this.waiters.get(item.id)?.size === 0) this.waiters.delete(item.id);
        }
      } catch {
        // Missing ownership or unavailable storage must not rename or stall a download.
      } finally {
        if (filename) suggest({ filename, conflictAction: 'uniquify' });
        else suggest();
      }
    })();
    return true;
  };
}
