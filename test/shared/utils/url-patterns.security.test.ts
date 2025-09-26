/**
 * Domain validation hardening regression tests
 */

import { describe, expect, it } from 'vitest';
import {
  URLPatterns,
  cleanUrl,
  extractTweetInfoFromUrl as extractTweetInfoFromPatterns,
} from '@shared/utils/patterns';
import { extractTweetInfoFromUrl as extractTweetInfoFromCore } from '@shared/utils/core-utils';

const TRUSTED_TWITTER_URL = 'https://twitter.com/example/status/1234567890';
const TRUSTED_X_URL = 'https://x.com/example/status/1234567890';
const SPOOFED_TWITTER_URL = 'https://twitter.com.evil.com/example/status/1234567890';
const SPOOFED_X_URL = 'https://x.com.attacker.net/example/status/1234567890';

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
  it('does not produce active colon sequences from double-encoded script schemes (cleanUrl)', () => {
    const payload = 'javascript&amp;colon;alert(1)';
    const result = cleanUrl(payload);

    expect(result).toBe(payload);
    expect(result?.includes('&colon;')).toBe(false);
    expect(result?.includes('&amp;colon;')).toBe(true);
  });

  it('does not produce active colon sequences from double-encoded script schemes (normalizeUrl)', () => {
    const payload = "javascript&amp;#x3a;alert('xeg')";
    const result = URLPatterns.normalizeUrl(payload);

    expect(result.startsWith('javascript')).toBe(true);
    expect(result.includes(':')).toBe(false);
    expect(result.includes('&colon;')).toBe(false);
    expect(result.includes('&amp;#x3a;')).toBe(false);
  });

  it('still decodes safe ampersand separators', () => {
    const raw = 'https://x.com/example/status/1?foo=1&amp;bar=2';
    const cleaned = URLPatterns.normalizeUrl(raw);

    expect(cleaned).toBe('https://x.com/example/status/1?foo=1&bar=2');
  });
});
