// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaExtractionResult } from '@shared/types/media.types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extract: vi.fn(),
  httpGet: vi.fn(),
}));

vi.mock('@shared/services/media-extraction/media-extraction-service', () => ({
  MediaExtractionService: class {
    extractFromClickedElement = mocks.extract;
  },
}));

vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: mocks.httpGet }),
}));

import { MediaService } from '@shared/services/media-service';

describe('MediaService', () => {
  beforeEach(() => {
    mocks.extract.mockReset();
    mocks.httpGet.mockReset();
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
    expect(mocks.httpGet).not.toHaveBeenCalled();

    service.destroy();
  });
});
