/**
 * Domain validation hardening regression tests
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  URLPatterns,
  cleanUrl,
  extractTweetInfoFromUrl as extractTweetInfoFromPatterns,
} from '@shared/utils/patterns';
import { extractTweetInfoFromUrl as extractTweetInfoFromCore } from '@shared/utils/core-utils';
import * as htmlEntities from '@shared/utils/html/decode-html-entities';

const TRUSTED_TWITTER_URL = 'https://twitter.com/example/status/1234567890';
const TRUSTED_X_URL = 'https://x.com/example/status/1234567890';
const SPOOFED_TWITTER_URL = 'https://twitter.com.evil.com/example/status/1234567890';
const SPOOFED_X_URL = 'https://x.com.attacker.net/example/status/1234567890';
const SPOOFED_TWIMG_IMAGE = 'https://pbs.twimg.com.attacker.net/media/example.jpg:orig';
const TRUSTED_TWIMG_IMAGE = 'https://pbs.twimg.com/media/example.jpg:small';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('URLPatterns domain validation', () => {
  it('accepts official twitter hostnames', () => {
    expect(URLPatterns.isTwitterUrl(TRUSTED_TWITTER_URL)).toBe(true);
  });

  it('accepts official x.com hostnames', () => {
    expect(URLPatterns.isXcomUrl(TRUSTED_X_URL)).toBe(true);
  });

  it('rejects spoofed twitter hostnames', () => {
    expect(URLPatterns.isTwitterUrl(SPOOFED_TWITTER_URL)).toBe(false);
  });

  it('rejects spoofed x.com hostnames', () => {
    expect(URLPatterns.isXcomUrl(SPOOFED_X_URL)).toBe(false);
  });

  it('rejects spoofed twitter media hostnames for image detection', () => {
    expect(URLPatterns.isImageUrl(SPOOFED_TWIMG_IMAGE)).toBe(false);
    expect(URLPatterns.isImageUrl(TRUSTED_TWIMG_IMAGE)).toBe(true);
  });

  it('does not extract tweet info from spoofed hostnames (URLPatterns)', () => {
    expect(extractTweetInfoFromPatterns(SPOOFED_TWITTER_URL)).toBeNull();
    expect(extractTweetInfoFromPatterns(SPOOFED_X_URL)).toBeNull();
  });

  it('extracts tweet info from trusted hostnames (URLPatterns)', () => {
    const resultTwitter = extractTweetInfoFromPatterns(TRUSTED_TWITTER_URL);
    const resultX = extractTweetInfoFromPatterns(TRUSTED_X_URL);

    expect(resultTwitter).toEqual({
      username: 'example',
      tweetId: '1234567890',
      tweetUrl: TRUSTED_TWITTER_URL,
    });
    expect(resultX).toEqual({
      username: 'example',
      tweetId: '1234567890',
      tweetUrl: TRUSTED_X_URL,
    });
  });

  it('does not extract tweet info from spoofed hostnames (core utils)', () => {
    expect(extractTweetInfoFromCore(SPOOFED_TWITTER_URL)).toBeNull();
    expect(extractTweetInfoFromCore(SPOOFED_X_URL)).toBeNull();
  });

  it('extracts tweet info from trusted hostnames (core utils)', () => {
    const resultTwitter = extractTweetInfoFromCore(TRUSTED_TWITTER_URL);
    const resultX = extractTweetInfoFromCore(TRUSTED_X_URL);

    expect(resultTwitter).toEqual({ username: 'example', tweetId: '1234567890' });
    expect(resultX).toEqual({ username: 'example', tweetId: '1234567890' });
  });
});

describe('URL normalization double escaping hardening', () => {
  it('decodes double-encoded HTML tags only once via cleanUrl', () => {
    const payload = '&amp;lt;script&amp;gt;';
    const cleaned = cleanUrl(payload);

    expect(cleaned).toBe('&lt;script&gt;');
    expect(cleaned?.includes('<')).toBe(false);
    expect(cleaned?.includes('&amp')).toBe(false);
  });

  it('prevents colon activation from double-encoded script schemes (normalizeUrl)', () => {
    const payload = "javascript&amp;#x3a;alert('xeg')";
    const result = URLPatterns.normalizeUrl(payload);

    expect(result).toBe("javascript&#x3a;alert('xeg')");
    expect(result.includes(':')).toBe(false);
    expect(result.includes('&amp;#x3a;')).toBe(false);
  });

  it('decodes double-encoded ampersands only once during normalization', () => {
    const raw = 'https://x.com/example/status/1?foo=1&amp;amp;bar=2';
    const cleaned = URLPatterns.normalizeUrl(raw);

    expect(cleaned).toBe('https://x.com/example/status/1?foo=1&amp;bar=2');
  });

  it('still decodes single-encoded ampersand separators', () => {
    const raw = 'https://x.com/example/status/1?foo=1&amp;bar=2';
    const cleaned = URLPatterns.normalizeUrl(raw);

    expect(cleaned).toBe('https://x.com/example/status/1?foo=1&bar=2');
  });

  it('decodes numeric entities exactly once for cleanUrl', () => {
    const payload = '&#x3C;script&#x3E;';
    const cleaned = cleanUrl(payload);

    expect(cleaned).toBe('<script>');
  });

  it('falls back to the original URL when entity decoding fails', () => {
    const input = 'https://x.com/example/status/1';
    const spy = vi.spyOn(htmlEntities, 'decodeHtmlEntitiesSafely').mockReturnValueOnce(null);

    const result = URLPatterns.normalizeUrl(input);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toBe(input);
  });
});
