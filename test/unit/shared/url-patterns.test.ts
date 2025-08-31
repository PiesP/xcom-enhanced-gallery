import { expect, describe, test, it } from 'vitest';
import {
  URLPatterns,
  extractTweetInfoFromUrl,
  extractTweetInfoFromUrls,
} from '@shared/utils/patterns/url-patterns';

describe('URLPatterns.extractMediaIndexFromLink', () => {
  test('extract photo index from /photo/1', () => {
    const url = '/username/status/123/photo/1';
    const idx = URLPatterns.extractMediaIndexFromLink(url);
    expect(idx).toBe(0);
  });

  test('extract video index from /video/2', () => {
    const url = '/username/status/123/video/2';
    const idx = URLPatterns.extractMediaIndexFromLink(url);
    expect(idx).toBe(1);
  });

  test('extract index from query param media_index', () => {
    const url = '/username/status/123?media_index=3&other=1';
    const idx = URLPatterns.extractMediaIndexFromLink(url);
    expect(idx).toBe(3);
  });
});

describe('URLPatterns basic', () => {
  it('isXcomUrl and isTwitterUrl detect domains', () => {
    expect(URLPatterns.isXcomUrl('https://x.com/user/status/123')).toBe(true);
    expect(URLPatterns.isTwitterUrl('https://twitter.com/user/status/123')).toBe(true);
    expect(URLPatterns.isXcomUrl('https://example.com')).toBe(false);
  });

  it('extractTweetId extracts id or returns null', () => {
    expect(URLPatterns.extractTweetId('https://x.com/foo/status/987654321')).toBe('987654321');
    expect(URLPatterns.extractTweetId('https://x.com/not-a-status')).toBeNull();
  });

  it('extractTweetPhotoInfo parses photo url', () => {
    const info = URLPatterns.extractTweetPhotoInfo('https://x.com/foo/status/123/photo/2');
    expect(info).not.toBeNull();
    // implementation returns the parsed index as-is (1-based in this utility)
    expect(info?.photoIndex).toBe(2);
  });

  it('normalizeUrl and makeAbsoluteUrl basics', () => {
    expect(URLPatterns.normalizeUrl(' https://x.com/foo?utm_source=test ')).toBe(
      'https://x.com/foo'
    );
    expect(URLPatterns.makeAbsoluteUrl('/bar', 'https://x.com')).toBe('https://x.com/bar');
  });

  it('extractTweetInfoFromUrl rejects invalid usernames', () => {
    expect(extractTweetInfoFromUrl('https://x.com/i/status/123')).toBeNull();
    expect(extractTweetInfoFromUrl('https://x.com/valid_user/status/321')).not.toBeNull();
  });

  it('extractTweetInfoFromUrls returns first valid', () => {
    const arr = ['https://x.com/not-a-status', 'https://x.com/valid_user/status/555'];
    const res = extractTweetInfoFromUrls(arr);
    expect(res).not.toBeNull();
    expect(res?.tweetId).toBe('555');
  });
});
