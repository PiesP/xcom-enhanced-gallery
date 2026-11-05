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
    observed.split('').some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
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
  private readonly queues = new Map<string, Promise<void>>();
  private readonly pending = new Map<
    string,
    {
      bind: (id: number, confirmed: boolean) => Promise<boolean>;
      id: number | undefined;
      startedAt: number;
    }
  >();

  constructor(
    private readonly extensionId: string | undefined,
    private readonly findFilename: (id: number, url: string) => Promise<string | undefined>
  ) {}

  /** Serialize allocation for an identical source until its native ID is bound. Transfers remain native. */
  async allocate(
    url: string,
    download: () => Promise<number>,
    bind: (id: number, confirmed: boolean) => Promise<boolean>
  ): Promise<number> {
    const previous = this.queues.get(url) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => gate);
    this.queues.set(url, queued);
    await previous;
    const allocation = { bind, id: undefined as number | undefined, startedAt: Date.now() };
    this.pending.set(url, allocation);
    try {
      const id = await download();
      if (Number.isSafeInteger(id) && id > 0) {
        await bind(id, true);
      }
      return id;
    } finally {
      if (this.pending.get(url) === allocation) {
        this.pending.delete(url);
      }
      release();
      if (this.queues.get(url) === queued) {
        this.queues.delete(url);
      }
    }
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
    const allocation = this.pending.get(url);
    const startedAt = item.startTime === undefined ? Number.NaN : Date.parse(item.startTime);
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const determine = async (): Promise<string | undefined> => {
      let filename = await this.findFilename(item.id, url);
      if (
        !settled &&
        filename === undefined &&
        allocation &&
        this.pending.get(url) === allocation &&
        Number.isFinite(startedAt) &&
        startedAt >= allocation.startedAt &&
        (allocation.id === undefined || allocation.id === item.id)
      ) {
        // Chrome may determine the target before download() resolves. One exclusive
        // same-URL allocation binds this exact owned native ID before suggesting.
        allocation.id = item.id;
        if ((await allocation.bind(item.id, false)) && !settled) {
          filename = await this.findFilename(item.id, url);
        }
      }
      return filename;
    };
    void Promise.race([
      determine(),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => {
          settled = true;
          resolve(undefined);
        }, 2_000);
      }),
    ])
      .then(
        (filename) => {
          settled = true;
          if (filename) {
            suggest({ filename, conflictAction: 'uniquify' });
          } else {
            suggest();
          }
        },
        () => {
          settled = true;
          suggest();
        }
      )
      .finally(() => clearTimeout(timer));
    return true;
  };
}
