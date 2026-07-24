// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, expect, it } from 'vitest';
import { planBulkDownload } from '@shared/core/download/download-plan';

describe('download-plan', () => {
  it('plans a single download item', () => {
    const plan = planBulkDownload({
      mediaItems: [{ url: 'https://example.com/video.mp4', mediaType: 'video' }],
      targetDir: '/downloads',
    });
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].url).toBe('https://example.com/video.mp4');
  });

  it('handles empty media items', () => {
    const plan = planBulkDownload({
      mediaItems: [],
      targetDir: '/downloads',
    });
    expect(plan.items).toHaveLength(0);
  });
});