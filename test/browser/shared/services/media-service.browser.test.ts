// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaExtractionResult } from '@shared/types/media.types';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  extract: vi.fn(),
  httpGetOwnedBinary: vi.fn(),
}));

vi.mock('@shared/services/media-extraction/media-extraction-service', () => ({
  MediaExtractionService: class {
    extractFromClickedElement = mocks.extract;
    dispose = vi.fn();
    invalidateApiMetadata = vi.fn();
  },
}));

vi.mock('@shared/services/http-request-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/services/http-request-service')>()),
  getHttpRequestService: () => ({ getOwnedBinary: mocks.httpGetOwnedBinary }),
}));

import { downloadLiveByteBudget } from '@shared/services/download/live-byte-budget';
import { MediaService } from '@shared/services/media-service';
import type { OwnedMediaExtractionSession } from '@shared/types/media.types';

describe('MediaService', () => {
  beforeEach(() => {
    mocks.extract.mockReset();
    mocks.httpGetOwnedBinary.mockReset();
  });

  it('does not download media while opening a gallery', async () => {
    const result: MediaExtractionResult = {
      success: true,
      clickedIndex: 0,
      mediaItems: [
        { id: 'first', type: 'image', url: 'https://pbs.twimg.com/media/first.jpg' },
        { id: 'second', type: 'image', url: 'https://pbs.twimg.com/media/second.jpg' },
      ],
    };
    mocks.extract.mockResolvedValue(result);
    const service = new MediaService();
    await service.initialize();

    await expect(service.extractFromClickedElement(document.createElement('img'))).resolves.toBe(
      result
    );
    expect(mocks.httpGetOwnedBinary).not.toHaveBeenCalled();

    service.destroy();
  });

  it('clears completed download Blobs on global teardown and recreates the cache on restart', async () => {
    mocks.httpGetOwnedBinary.mockImplementation(async () => {
      const data = new Blob(['cached-image']);
      return { ok: true, status: 200, data, lease: downloadLiveByteBudget.reserve(data.size) };
    });
    const service = new MediaService();
    const item = {
      id: 'cached',
      type: 'image' as const,
      url: 'https://pbs.twimg.com/media/cached.jpg',
    };
    const beforeBytes = downloadLiveByteBudget.usedBytes;

    await service.initialize();
    const first = await service.getDownloadMedia(item);
    service.destroy();
    expect(downloadLiveByteBudget.usedBytes).toBe(beforeBytes + 'cached-image'.length);

    expect(service.getDownloadMedia(item)).toBeNull();

    await service.initialize();
    const second = await service.getDownloadMedia(item);
    expect(mocks.httpGetOwnedBinary).toHaveBeenCalledTimes(2);
    first?.lease.release();
    second?.lease.release();
    service.destroy();
    expect(downloadLiveByteBudget.usedBytes).toBe(beforeBytes);
  });

  it('keeps one owned extraction session across repeated use and creates a usable replacement after teardown', async () => {
    const result: MediaExtractionResult = {
      success: true,
      mediaItems: [{ id: 'image', type: 'image', url: 'https://pbs.twimg.com/media/image.jpg' }],
    };
    const sessions = [0, 1].map((): OwnedMediaExtractionSession => ({
      extractFromClickedElement: vi.fn(async () => result),
      invalidateApiMetadata: vi.fn(),
      dispose: vi.fn(),
    }));
    let nextSession = 0;
    const service = new MediaService(() => sessions[nextSession++]!);
    const target = document.createElement('img');
    await service.initialize();
    await service.initialize();
    expect(await service.extractFromClickedElement(target)).toBe(result);
    service.refreshApiMetadata();
    expect(sessions[0]?.invalidateApiMetadata).toHaveBeenCalledTimes(1);
    service.destroy();
    service.destroy();
    expect(sessions[0]?.dispose).toHaveBeenCalledTimes(1);

    await service.initialize();
    expect(await service.extractFromClickedElement(target)).toBe(result);
    expect(nextSession).toBe(2);
    service.destroy();
    expect(sessions[1]?.dispose).toHaveBeenCalledTimes(1);
  });
});
