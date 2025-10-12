/**
 * @file RED: MediaProcessor GIF 타입 감지 검증
 */
import { describe, it, expect } from 'vitest';

describe('MediaProcessor - GIF 타입 감지 (RED)', () => {
  it('tweet_video_thumb/tweet_video GIF 이미지를 gif 타입으로 분류해야 한다', async () => {
    const { processMedia } = await import('@shared/media/media-processor');

    const root = document.createElement('div');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/tweet_video_thumb/xyz987.jpg';
    root.appendChild(img);

    const result = processMedia(root);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      const item = result.data[0]!;
      expect(item.type).toBe('gif');
      // variants는 존재하나 원본 url은 name=orig를 포함할 수 있음
      expect(item.url).toMatch(
        /https:\/\/pbs\.twimg\.com\/tweet_video_thumb\/xyz987\.jpg|name=orig/
      );
    }
  });
});
