/**
 * @file RED: MediaProcessor variants 생성 검증
 */
import { describe, it, expect } from 'vitest';

describe('MediaProcessor - variants 생성 (RED)', () => {
  it('pbs.twimg.com 이미지에서 small/large/orig variants를 생성해야 한다', async () => {
    const { processMedia } = await import('@shared/media/MediaProcessor');

    const root = document.createElement('div');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/abc123?format=jpg&name=small';
    root.appendChild(img);

    const result = processMedia(root);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      const item = result.data[0]!;
      expect(item.type === 'image' || item.type === 'gif').toBe(true);
      // variants 기대: orig/large/small
      expect(item.variants && item.variants.length >= 3).toBe(true);
      const qualities = new Set((item.variants ?? []).map(v => v.quality));
      expect(qualities.has('orig')).toBe(true);
      expect(qualities.has('large')).toBe(true);
      expect(qualities.has('small')).toBe(true);

      // URL 형태 검증(대략): name=orig/large/small 포함
      const byQ = Object.fromEntries((item.variants ?? []).map(v => [v.quality, v.url])) as Record<
        string,
        string
      >;
      expect(byQ.orig).toMatch(/name=orig/);
      expect(byQ.large).toMatch(/name=large/);
      expect(byQ.small).toMatch(/name=small/);
    }
  });
});
