// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import type {
  MediaExtractionCollaborators,
  MediaExtractionResult,
  TweetClickContext,
} from '@shared/types/media.types';
import { createFailureResult, ErrorCode } from '@shared/types/media.types';
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
  it('identifies an already aborted extraction without dispatching to its collaborators', async () => {
    const ports = collaborators();
    const session = new MediaExtractionService(ports);
    const controller = new AbortController();
    controller.abort();
    const result = await session.extractFromClickedElement(document.createElement('img'), {
      signal: controller.signal,
    });
    expect(result).toMatchObject({ success: false, failureKind: 'cancelled' });
    expect(result.errors?.[0]?.code).toBe(ErrorCode.CANCELLED);
    expect(ports.readContext).not.toHaveBeenCalled();
    expect(ports.api.extract).not.toHaveBeenCalled();
    expect(ports.dom.extract).not.toHaveBeenCalled();
    session.dispose();
  });

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
    expect(late.failureKind).toBe('cancelled');
    expect(late.errors?.[0]?.code).toBe(ErrorCode.CANCELLED);
    expect(ports.dom.extract).not.toHaveBeenCalled();
    expect(ports.api.dispose).toHaveBeenCalledTimes(1);
    expect(ports.api.invalidateMetadata).not.toHaveBeenCalled();
    const retired = await session.extractFromClickedElement(element);
    expect(retired).toMatchObject({ success: false, failureKind: 'cancelled' });
    expect(retired.errors?.[0]?.code).toBe(ErrorCode.CANCELLED);
  });

  it('cancels while waiting to start DOM recovery without invoking the DOM extractor', async () => {
    const ports = collaborators();
    ports.api.extract.mockResolvedValue(
      createFailureResult('provider unavailable', 'twitter-api', 'api-failed')
    );
    let releaseYield!: () => void;
    let enteredYield!: () => void;
    const entered = new Promise<void>((resolve) => {
      enteredYield = resolve;
    });
    vi.stubGlobal('scheduler', {
      yield: () => {
        enteredYield();
        return new Promise<void>((resolve) => {
          releaseYield = resolve;
        });
      },
    });
    const session = new MediaExtractionService(ports);
    const controller = new AbortController();
    try {
      const pending = session.extractFromClickedElement(document.createElement('img'), {
        signal: controller.signal,
      });
      await entered;
      controller.abort();
      releaseYield();
      const result = await pending;
      expect(result).toMatchObject({ success: false, failureKind: 'cancelled' });
      expect(result.errors?.[0]?.code).toBe(ErrorCode.CANCELLED);
      expect(ports.dom.extract).not.toHaveBeenCalled();
    } finally {
      session.dispose();
      vi.unstubAllGlobals();
    }
  });

  it('does not return DOM media after its caller cancels while recovery is pending', async () => {
    const ports = collaborators();
    ports.api.extract.mockResolvedValue(
      createFailureResult('provider unavailable', 'twitter-api', 'api-failed')
    );
    let complete!: (value: MediaExtractionResult) => void;
    ports.dom.extract.mockImplementationOnce(
      () =>
        new Promise<MediaExtractionResult>((resolve) => {
          complete = resolve;
        })
    );
    const session = new MediaExtractionService(ports);
    const controller = new AbortController();
    try {
      const pending = session.extractFromClickedElement(document.createElement('img'), {
        signal: controller.signal,
      });
      await vi.waitFor(() => expect(ports.dom.extract).toHaveBeenCalledTimes(1));
      controller.abort();
      complete(selected);
      const result = await pending;
      expect(result).toMatchObject({ success: false, failureKind: 'cancelled' });
      expect(result.errors?.[0]?.code).toBe(ErrorCode.CANCELLED);
    } finally {
      session.dispose();
    }
  });
});
