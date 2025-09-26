import { beforeEach, describe, expect, it } from 'vitest';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';

describe('MediaClickDetector hostname hardening', () => {
  let detector: MediaClickDetector;

  beforeEach(() => {
    document.body.innerHTML = '';
    detector = MediaClickDetector.getInstance();
  });

  it('rejects spoofed twimg hosts even when selectors match', () => {
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com.attacker.net/media/attack.jpg';
    document.body.appendChild(img);

    const result = MediaClickDetector.isProcessableMedia(img);
    expect(result).toBe(false);
  });

  it('continues to allow genuine twimg media', () => {
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/safe.jpg';
    document.body.appendChild(img);

    const result = MediaClickDetector.isProcessableMedia(img);
    expect(result).toBe(true);
  });
});
