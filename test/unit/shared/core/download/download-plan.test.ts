// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, expect, it, vi } from 'vitest';
import { LiveByteBudget } from '@shared/services/download/live-byte-budget';
import { planBulkDownload } from '@shared/core/download/download-plan';

describe('download-plan', () => {
  it('plans a single download item', () => {
    const plan = planBulkDownload({
      mediaItems: [
        { id: 'video', url: 'https://example.com/video.mp4', type: 'video' },
      ],
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
    const provider = vi.fn(async () => ({value: new Blob(['lazy']), lease: budget.reserve(4)}));
    const plan = planBulkDownload({ mediaItems: [media], mediaBlobProvider: provider });

    expect(provider).not.toHaveBeenCalled();
    const owned = await plan.items[0]?.getBlob?.();
    expect(owned?.value).toBeInstanceOf(Blob);
    owned?.lease.release();
    expect(provider).toHaveBeenCalledWith(media, undefined);
  });
});
