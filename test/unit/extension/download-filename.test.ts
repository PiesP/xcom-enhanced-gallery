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

  it('waits for an exact native-ID binding even for concurrent identical URLs', async () => {
    const bound = new Map<number, string>();
    const policy = new OwnedDownloadFilenamePolicy('xeg', async (id, url) =>
      url === URL ? bound.get(id) : undefined
    );
    const first = policy.beginAllocation();
    const second = policy.beginAllocation();
    const suggest = vi.fn();
    expect(policy.listener(item, suggest)).toBe(true);
    await Promise.resolve();
    bound.set(8, 'other_123_2.jpg');
    second.bound(8);
    second.finish();
    expect(suggest).not.toHaveBeenCalled();
    bound.set(7, NAME);
    first.bound(7);
    first.finish();
    await vi.waitFor(() =>
      expect(suggest).toHaveBeenCalledExactlyOnceWith({
        filename: NAME,
        conflictAction: 'uniquify',
      })
    );
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
