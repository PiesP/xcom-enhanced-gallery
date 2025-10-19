import { afterEach, describe, expect, it } from 'vitest';

import {
  detectMediaFromClick,
  shouldBlockMediaTrigger,
} from '@shared/utils/media/media-click-detector';

const TWITTER_IMAGE_URL = 'https://pbs.twimg.com/media/sample-image.jpg';

describe('media-click-detector functional API', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('detects a direct twitter image element', () => {
    const image = document.createElement('img');
    image.src = TWITTER_IMAGE_URL;
    document.body.appendChild(image);

    const result = detectMediaFromClick(image);

    expect(result.type).toBe('image');
    expect(result.mediaUrl).toBe(TWITTER_IMAGE_URL);
    expect(result.method).toBe('direct_element');
  });

  it('blocks pure status links outside media containers', () => {
    const link = document.createElement('a');
    link.href = 'https://x.com/example/status/1234567890';
    link.textContent = 'open tweet';
    document.body.appendChild(link);

    expect(shouldBlockMediaTrigger(link)).toBe(true);
  });
});
