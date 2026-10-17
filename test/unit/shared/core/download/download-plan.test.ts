// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { planBulkDownload } from '@shared/core/download/download-plan';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { LiveByteBudget } from '@shared/services/download/live-byte-budget';
import type { MediaBlobProvider } from '@shared/services/download/types';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('download-plan', () => {
  it('plans a single download item', () => {
    const plan = planBulkDownload({
      mediaItems: [{ id: 'video', url: 'https://example.com/video.mp4', type: 'video' }],
    });
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]?.url).toBe('https://example.com/video.mp4');
  });

  it('handles empty media items', () => {
    const plan = planBulkDownload({
      mediaItems: [],
    });
    expect(plan.items).toHaveLength(0);
  });

  it('defers Blob loading until a ZIP worker requests the planned item', async () => {
    const media = { id: 'lazy', type: 'image' as const, url: 'https://example.com/lazy.jpg' };
    const budget = new LiveByteBudget(32);
    const provider = vi.fn(async () => ({ value: new Blob(['lazy']), lease: budget.reserve(4) }));
    const plan = planBulkDownload({ mediaItems: [media], mediaBlobProvider: provider });

    expect(provider).not.toHaveBeenCalled();
    const owned = await plan.items[0]?.getBlob?.();
    expect(owned?.value).toBeInstanceOf(Blob);
    owned?.lease.release();
    expect(provider).toHaveBeenCalledWith(media, undefined);
  });

  it('keeps owned Blob precedence and gates only supported media without changing order or names', () => {
    const mediaItems = [
      {
        id: 'photo',
        type: 'image' as const,
        url: 'https://example.com/photo.jpg',
        filename: 'photo.jpg',
      },
      {
        id: 'clip',
        type: 'video' as const,
        url: 'https://example.com/clip.mp4',
        filename: 'clip.mp4',
      },
      {
        id: 'animation',
        type: 'gif' as const,
        url: 'https://example.com/animation.gif',
        filename: 'animation.gif',
      },
      {
        id: 'cached',
        type: 'image' as const,
        url: 'https://example.com/cached.jpg',
        filename: 'cached.jpg',
      },
    ];
    const owner = { value: new Blob(['cached']), lease: new LiveByteBudget(6).reserve(6) };
    const provider = vi.fn(async () => owner) as MediaBlobProvider;
    const supports = vi.fn((media: (typeof mediaItems)[number]) => media.type === 'image');
    Object.assign(provider, { supports });
    const plan = planBulkDownload({
      mediaItems,
      cachedBlobs: new Map([[mediaItems[3]!.url, owner]]),
      mediaBlobProvider: provider,
      nowMs: 1,
    });

    expect(
      plan.items.map(({ url, desiredName, inputKind }) => ({ url, desiredName, inputKind }))
    ).toEqual(
      mediaItems.map((media, index) => ({
        url: media.url,
        desiredName: generateMediaFilename(media, { nowMs: 1 }),
        inputKind: index === 0 ? 'blob-provider' : index === 3 ? 'owned-blob' : 'direct-url',
      }))
    );
    expect(plan.items[3]?.blob).toBe(owner);
    expect(plan.items[3]?.getBlob).toBeUndefined();
    expect(supports.mock.calls.map(([media]) => media.id)).toEqual(['photo', 'clip', 'animation']);
    expect(provider).not.toHaveBeenCalled();
    owner.lease.release();
  });

  it('keeps a legacy provider without supports available across media kinds', () => {
    const mediaItems = [
      { id: 'clip', type: 'video' as const, url: 'https://example.com/clip.mp4' },
      { id: 'animation', type: 'gif' as const, url: 'https://example.com/animation.gif' },
    ];
    const provider = vi.fn(async () => null);
    const plan = planBulkDownload({ mediaItems, mediaBlobProvider: provider });

    expect(plan.items.map((item) => item.inputKind)).toEqual(['blob-provider', 'blob-provider']);
    expect(provider).not.toHaveBeenCalled();
  });
});
