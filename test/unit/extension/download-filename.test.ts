// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { observeDownloadFilename, OwnedDownloadFilenamePolicy } from '@extension/download-filename';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const URL = 'https://pbs.twimg.com/media/fixture.jpg?name=orig';
const NAME = 'owner_123_1.jpg';
const item = { id: 7, url: URL, byExtensionId: 'xeg', filename: 'fixture.jpg' };

describe('owned filename determination', () => {
  afterEach(() => vi.useRealTimers());

  it('does not inspect or rename another initiator', () => {
    const lookup = vi.fn();
    const policy = new OwnedDownloadFilenamePolicy('xeg', lookup);
    const suggest = vi.fn();
    expect(policy.listener({ ...item, byExtensionId: 'other' }, suggest)).toBeUndefined();
    expect(suggest).toHaveBeenCalledExactlyOnceWith();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('binds an early filename event to one exclusive same-URL allocation', async () => {
    const bound = new Map<number, string>();
    const policy = new OwnedDownloadFilenamePolicy('xeg', async (id, url) =>
      url === URL ? bound.get(id) : undefined
    );
    let finishFirst!: (id: number) => void;
    const firstNative = new Promise<number>((resolve) => {
      finishFirst = resolve;
    });
    const firstStart = vi.fn(() => firstNative);
    const secondStart = vi.fn(async () => 8);
    const first = policy.allocate(URL, firstStart, async (id) => {
      bound.set(id, NAME);
      return true;
    });
    const second = policy.allocate(URL, secondStart, async (id) => {
      bound.set(id, 'owner_123_2.jpg');
      return true;
    });
    await vi.waitFor(() => expect(firstStart).toHaveBeenCalledOnce());
    expect(secondStart).not.toHaveBeenCalled();
    const suggest = vi.fn();
    expect(policy.listener({ ...item, startTime: new Date().toISOString() }, suggest)).toBe(true);
    await vi.waitFor(() =>
      expect(suggest).toHaveBeenCalledExactlyOnceWith({
        filename: NAME,
        conflictAction: 'uniquify',
      })
    );
    expect(secondStart).not.toHaveBeenCalled();
    finishFirst(7);
    await expect(first).resolves.toBe(7);
    await expect(second).resolves.toBe(8);
    expect(bound.get(7)).toBe(NAME);
    expect(bound.get(8)).toBe('owner_123_2.jpg');
  });

  it('never rebinds a timed-out event to the next same-URL request', async () => {
    vi.useFakeTimers();
    let releaseLookup!: (value: undefined) => void;
    const lookup = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<undefined>((resolve) => {
            releaseLookup = resolve;
          })
      )
      .mockResolvedValue(undefined);
    const policy = new OwnedDownloadFilenamePolicy('xeg', lookup);
    let releaseFirst!: (id: number) => void;
    let releaseSecond!: (id: number) => void;
    const firstBind = vi.fn(async () => true);
    const secondBind = vi.fn(async () => true);
    const first = policy.allocate(
      URL,
      () =>
        new Promise<number>((resolve) => {
          releaseFirst = resolve;
        }),
      firstBind
    );
    await vi.advanceTimersByTimeAsync(0);
    const suggest = vi.fn();
    policy.listener({ ...item, startTime: new Date().toISOString() }, suggest);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(suggest).toHaveBeenCalledExactlyOnceWith();
    releaseFirst(7);
    await first;
    const second = policy.allocate(
      URL,
      () =>
        new Promise<number>((resolve) => {
          releaseSecond = resolve;
        }),
      secondBind
    );
    await vi.advanceTimersByTimeAsync(0);
    releaseLookup(undefined);
    await vi.advanceTimersByTimeAsync(0);
    expect(secondBind).not.toHaveBeenCalled();
    releaseSecond(8);
    await second;
    expect(secondBind).toHaveBeenCalledExactlyOnceWith(8, true);
  });

  it('does not bind a stale same-source event from an earlier worker', async () => {
    const policy = new OwnedDownloadFilenamePolicy('xeg', async () => undefined);
    let finish!: (id: number) => void;
    const bind = vi.fn(async () => true);
    const pending = policy.allocate(
      URL,
      () =>
        new Promise<number>((resolve) => {
          finish = resolve;
        }),
      bind
    );
    await vi.waitFor(() => expect(finish).toBeDefined());
    const suggest = vi.fn();
    policy.listener({ ...item, startTime: new Date(Date.now() - 10_000).toISOString() }, suggest);
    await vi.waitFor(() => expect(suggest).toHaveBeenCalledExactlyOnceWith());
    expect(bind).not.toHaveBeenCalled();
    finish(8);
    await pending;
  });

  it('uses restored ownership and fails open without a matching native ID or URL', async () => {
    const policy = new OwnedDownloadFilenamePolicy('xeg', async (id, url) =>
      id === 7 && url === URL ? NAME : undefined
    );
    const restored = vi.fn();
    policy.listener(item, restored);
    await vi.waitFor(() =>
      expect(restored).toHaveBeenCalledExactlyOnceWith({
        filename: NAME,
        conflictAction: 'uniquify',
      })
    );
    const unknown = vi.fn();
    policy.listener({ ...item, id: 8 }, unknown);
    await vi.waitFor(() => expect(unknown).toHaveBeenCalledExactlyOnceWith());
    const wrongUrl = vi.fn();
    policy.listener({ ...item, url: `${URL}&other=true` }, wrongUrl);
    await vi.waitFor(() => expect(wrongUrl).toHaveBeenCalledExactlyOnceWith());
  });

  it('releases filename determination when ownership storage stalls', async () => {
    vi.useFakeTimers();
    const policy = new OwnedDownloadFilenamePolicy('xeg', () => new Promise(() => undefined));
    const suggest = vi.fn();
    policy.listener(item, suggest);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(suggest).toHaveBeenCalledExactlyOnceWith();
  });
});

describe('observed native basename', () => {
  it('separates requested and observed names and permits only native numeric conflict suffixes', () => {
    expect(observeDownloadFilename(NAME, `C:\\Private\\${NAME}`)).toEqual({
      requestedFilename: NAME,
      observedFilename: NAME,
      filenameConforms: true,
    });
    expect(observeDownloadFilename(NAME, 'C:\\Private\\owner_123_1 (2).jpg')).toMatchObject({
      filenameConforms: true,
    });
    expect(observeDownloadFilename(NAME, 'C:\\Private\\fixture.jpg')).toEqual({
      requestedFilename: NAME,
      observedFilename: 'fixture.jpg',
      filenameConforms: false,
    });
    expect(observeDownloadFilename(NAME, 'owner_123_1 (extra).jpg')).toMatchObject({
      filenameConforms: false,
    });
    expect(observeDownloadFilename(NAME, undefined)).toEqual({ requestedFilename: NAME });
  });
});
