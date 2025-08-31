import { describe, it, expect } from 'vitest';
import { URLPatterns } from '@shared/utils/patterns/url-patterns';

describe('URLPatterns extras', () => {
  it('isImageUrl handles twimg and other domains', () => {
    expect(URLPatterns.isImageUrl('https://pbs.twimg.com/media/abc.jpg')).toBe(true);
    expect(URLPatterns.isImageUrl('https://example.com/image.png')).toBe(true);
    expect(URLPatterns.isImageUrl('https://example.com/file.txt')).toBe(false);
  });

  it('isVideoUrl detects video urls', () => {
    expect(URLPatterns.isVideoUrl('https://example.com/video.mp4')).toBe(true);
    expect(URLPatterns.isVideoUrl('https://video.twimg.com/abc.mp4')).toBe(true);
    expect(URLPatterns.isVideoUrl('https://example.com/page.html')).toBe(false);
  });

  it('getOriginalImageUrl transforms twitter image urls', () => {
    expect(URLPatterns.getOriginalImageUrl('https://pbs.twimg.com/media/abc.jpg:small')).toBe(
      'https://pbs.twimg.com/media/abc.jpg:orig'
    );
    // if extension present without size spec, :orig appended
    expect(URLPatterns.getOriginalImageUrl('https://pbs.twimg.com/media/abc.jpg')).toBe(
      'https://pbs.twimg.com/media/abc.jpg:orig'
    );
    // non-twitter left unchanged
    const other = 'https://example.com/a.png';
    expect(URLPatterns.getOriginalImageUrl(other)).toBe(other);
  });

  it('isValidUrl and resolveUrl basic behaviors', () => {
    expect(URLPatterns.isValidUrl('https://x.com/foo')).toBe(true);
    expect(URLPatterns.isValidUrl('ftp://x.com')).toBe(false);
    expect(URLPatterns.isValidUrl('not-a-url')).toBe(false);

    // resolve relative
    expect(URLPatterns.resolveUrl('/a/b', 'https://x.com')).toContain('/a/b');
    // resolve with ..
    const resolved = URLPatterns.resolveUrl('../c', 'https://x.com/a/b/');
    expect(resolved).toContain('/c');
  });

  it('findMatchingUrls filters lists', () => {
    const urls = ['https://x.com/a.jpg', 'https://x.com/b.mp4', 'https://x.com/c.txt'];
    const matches = URLPatterns.findMatchingUrls(urls, '\\.(jpg|png)$');
    expect(matches).toEqual(['https://x.com/a.jpg']);
  });

  it('extractMediaIndexFromLink finds photo/video/index', () => {
    expect(URLPatterns.extractMediaIndexFromLink('/user/status/123/photo/1')).toBe(0);
    expect(URLPatterns.extractMediaIndexFromLink('/user/status/123/video/2')).toBe(1);
    expect(URLPatterns.extractMediaIndexFromLink('/user/status/123?media_index=3')).toBe(3);
    expect(URLPatterns.extractMediaIndexFromLink('/no/media')).toBeUndefined();
  });
});
