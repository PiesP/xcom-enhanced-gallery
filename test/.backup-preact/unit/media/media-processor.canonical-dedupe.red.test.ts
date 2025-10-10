/**
 * @file RED: MediaProcessor URL 정규화 및 dedupe 검증
 */
import { describe, it, expect } from 'vitest';

describe('MediaProcessor - URL 정규화 및 dedupe (RED)', () => {
  it('같은 트위터 이미지의 다른 quality URL들이 하나로 정규화(dedupe)되어야 한다', async () => {
    const { processMedia } = await import('@shared/media/MediaProcessor');

    const root = document.createElement('div');
    const img1 = document.createElement('img');
    img1.src = 'https://pbs.twimg.com/media/abc123?format=jpg&name=small';
    const img2 = document.createElement('img');
    img2.src = 'https://pbs.twimg.com/media/abc123?format=jpg&name=large';
    root.appendChild(img1);
    root.appendChild(img2);

    const result = processMedia(root);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      const item = result.data[0];
      // 정규화된 URL은 name=orig를 가져야 한다
      expect(item.url).toMatch(/name=orig/);
      // 변형(variants)에 small/large/orig가 포함되어야 한다
      const qualities = new Set((item.variants || []).map(v => v.quality));
      expect(qualities.has('orig')).toBe(true);
      expect(qualities.has('large')).toBe(true);
      expect(qualities.has('small')).toBe(true);
    }
  });
});
