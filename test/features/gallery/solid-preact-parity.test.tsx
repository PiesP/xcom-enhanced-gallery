import { describe, expect, it } from 'vitest';

import { createGalleryParitySnapshot } from '@/features/gallery/solid/createParitySnapshot';

const SAMPLE_MEDIA = [
  {
    id: '111',
    url: 'https://pbs.twimg.com/media/111?format=jpg&name=orig',
    filename: '111.jpg',
    type: 'image' as const,
    alt: 'sample image 111',
  },
  {
    id: '222',
    url: 'https://pbs.twimg.com/media/222?format=jpg&name=orig',
    filename: '222.jpg',
    type: 'image' as const,
    alt: 'sample image 222',
  },
  {
    id: '333',
    url: 'https://pbs.twimg.com/media/333?format=jpg&name=orig',
    filename: '333.jpg',
    type: 'gif' as const,
    alt: 'sample gif 333',
  },
];

describe('FRAME-ALT-001 Stage B — Solid vs Preact gallery parity', () => {
  it('produces matching gallery snapshots for Solid and Preact renderers', async () => {
    const snapshot = await createGalleryParitySnapshot({
      mediaItems: SAMPLE_MEDIA,
      startIndex: 1,
    });

    expect(snapshot.solid.positionText).toBe('2/3');
    expect(snapshot.preact.positionText).toBe('2/3');
    expect(snapshot.solid.statusText).toBe(snapshot.preact.statusText);

    expect(snapshot.solid.items).toHaveLength(SAMPLE_MEDIA.length);
    expect(snapshot.preact.items).toHaveLength(SAMPLE_MEDIA.length);

    snapshot.solid.items.forEach((item, index) => {
      const counterpart = snapshot.preact.items[index];
      expect(counterpart).toBeDefined();
      expect(item.mediaId).toBe(counterpart.mediaId);
      expect(item.active).toBe(counterpart.active);
      expect(item.mediaType).toBe(counterpart.mediaType);
    });

    expect(snapshot.solid.downloadDisabled).toBe(false);
    expect(snapshot.preact.downloadDisabled).toBe(false);
  });
});
