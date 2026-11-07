// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import type {
  MediaExtractionCollaborators,
  MediaExtractionResult,
  TweetClickContext,
} from '@shared/types/media.types';
import { createFailureResult } from '@shared/types/media.types';
import { describe, expect, it, vi } from 'vite-plus/test';

const context: TweetClickContext = {
  tweetInfo: {
    tweetId: '222',
    username: 'owner',
    tweetUrl: 'https://x.com/owner/status/222',
    extractionMethod: 'fixture',
    confidence: 1,
  },
  ownership: { requestTweetId: '222', ownerTweetId: '222', scope: 'owned' },
};

const selected: MediaExtractionResult = {
  success: true,
  mediaItems: [
    { id: 'first', type: 'image', url: 'https://pbs.twimg.com/media/first.jpg', tweetId: '222' },
  ],
  clickedIndex: 0,
};

function collaborators() {
  const readContext = vi.fn(() => context);
  const api = {
    extract: vi.fn(),
    invalidateMetadata: vi.fn(),
    dispose: vi.fn(),
  };
  const dom = { extract: vi.fn() };
  return { readContext, api, dom } satisfies MediaExtractionCollaborators;
}

describe('composed extraction session', () => {
  it('passes click ownership to the API and uses DOM recovery only after API failure', async () => {
    const ports = collaborators();
    ports.api.extract
      .mockResolvedValueOnce({ ...selected, apiRequestOutcome: 'healthy', apiRequestToken: {} })
      .mockResolvedValueOnce(
        createFailureResult('provider unavailable', 'twitter-api', 'api-failed')
      );
    ports.dom.extract.mockResolvedValue(selected);
    const session = new MediaExtractionService(ports);
    const element = document.createElement('img');
    element.src = 'https://pbs.twimg.com/media/first.jpg';
    try {
      const direct = await session.extractFromClickedElement(element);
      expect(direct.success).toBe(true);
      expect(direct.mediaItems[0]?.url).toBe(selected.mediaItems[0]?.url);
      expect(ports.dom.extract).not.toHaveBeenCalled();
      expect(ports.api.extract.mock.calls[0]?.[2].clickedMediaEvidence?.ownership).toEqual(
        context.ownership
      );

      const recovered = await session.extractFromClickedElement(element);
      expect(recovered.success).toBe(true);
      expect(recovered.mediaItems[0]?.url).toBe(selected.mediaItems[0]?.url);
      expect(ports.dom.extract).toHaveBeenCalledTimes(1);
      expect(ports.readContext).toHaveBeenCalledTimes(2);
    } finally {
      session.dispose();
    }
  });

  it('retires its API owner once and rejects a late result without reaching DOM fallback', async () => {
    const ports = collaborators();
    let complete!: (value: MediaExtractionResult) => void;
    ports.api.extract.mockImplementationOnce(
      () =>
        new Promise<MediaExtractionResult>((resolve) => {
          complete = resolve;
        })
    );
    const session = new MediaExtractionService(ports);
    const element = document.createElement('img');
    const pending = session.extractFromClickedElement(element);
    expect(ports.api.extract).toHaveBeenCalledTimes(1);
    session.dispose();
    session.dispose();
    session.invalidateApiMetadata();
    complete({ ...selected, apiRequestOutcome: 'healthy', apiRequestToken: {} });

    const late = await pending;
    expect(late.success).toBe(false);
    expect(late.metadata?.error).toBe('Extraction cancelled');
    expect(ports.dom.extract).not.toHaveBeenCalled();
    expect(ports.api.dispose).toHaveBeenCalledTimes(1);
    expect(ports.api.invalidateMetadata).not.toHaveBeenCalled();
    expect((await session.extractFromClickedElement(element)).metadata?.error).toBe(
      'Extraction cancelled'
    );
  });
});
