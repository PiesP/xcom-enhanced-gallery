/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { formatTweetText, shortenUrl } from '../../../src/shared/utils/text-formatting';

describe('formatTweetText', () => {
  it('should return empty array for undefined text', () => {
    expect(formatTweetText(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(formatTweetText('')).toEqual([]);
  });

  it('should handle simple text without URLs or line breaks', () => {
    const result = formatTweetText('Hello world');
    expect(result).toEqual([{ type: 'text', content: 'Hello world' }]);
  });

  it('should handle line breaks correctly', () => {
    const result = formatTweetText('Line 1\nLine 2\nLine 3');
    expect(result).toEqual([
      { type: 'text', content: 'Line 1' },
      { type: 'break' },
      { type: 'text', content: 'Line 2' },
      { type: 'break' },
      { type: 'text', content: 'Line 3' },
    ]);
  });

  it('should detect and format HTTP URLs', () => {
    const result = formatTweetText('Check this out: http://example.com');
    expect(result).toEqual([
      { type: 'text', content: 'Check this out: ' },
      { type: 'link', content: 'http://example.com', href: 'http://example.com' },
    ]);
  });

  it('should detect and format HTTPS URLs', () => {
    const result = formatTweetText('Visit https://secure.example.com');
    expect(result).toEqual([
      { type: 'text', content: 'Visit ' },
      { type: 'link', content: 'https://secure.example.com', href: 'https://secure.example.com' },
    ]);
  });

  it('should handle multiple URLs in one line', () => {
    const result = formatTweetText('First http://one.com and second https://two.com');
    expect(result).toEqual([
      { type: 'text', content: 'First ' },
      { type: 'link', content: 'http://one.com', href: 'http://one.com' },
      { type: 'text', content: ' and second ' },
      { type: 'link', content: 'https://two.com', href: 'https://two.com' },
    ]);
  });

  it('should handle URLs with line breaks', () => {
    const result = formatTweetText('First line\nhttps://example.com\nLast line');
    expect(result).toEqual([
      { type: 'text', content: 'First line' },
      { type: 'break' },
      { type: 'link', content: 'https://example.com', href: 'https://example.com' },
      { type: 'break' },
      { type: 'text', content: 'Last line' },
    ]);
  });

  it('should handle empty lines', () => {
    const result = formatTweetText('Line 1\n\nLine 3');
    expect(result).toEqual([
      { type: 'text', content: 'Line 1' },
      { type: 'break' },
      { type: 'break' },
      { type: 'text', content: 'Line 3' },
    ]);
  });

  it('should handle URL at start of line', () => {
    const result = formatTweetText('https://example.com is great');
    expect(result).toEqual([
      { type: 'link', content: 'https://example.com', href: 'https://example.com' },
      { type: 'text', content: ' is great' },
    ]);
  });

  it('should handle URL at end of line', () => {
    const result = formatTweetText('Check out https://example.com');
    expect(result).toEqual([
      { type: 'text', content: 'Check out ' },
      { type: 'link', content: 'https://example.com', href: 'https://example.com' },
    ]);
  });

  it('should detect mentions and create profile links', () => {
    const result = formatTweetText('Thanks @example_user!');
    expect(result).toEqual([
      { type: 'text', content: 'Thanks ' },
      {
        type: 'mention',
        content: '@example_user',
        href: 'https://x.com/example_user',
      },
      { type: 'text', content: '!' },
    ]);
  });

  it('should detect hashtags and create hashtag links', () => {
    const result = formatTweetText('Launch day #XEG2025');
    expect(result).toEqual([
      { type: 'text', content: 'Launch day ' },
      {
        type: 'hashtag',
        content: '#XEG2025',
        href: 'https://x.com/hashtag/XEG2025',
      },
    ]);
  });

  it('should support multilingual hashtags', () => {
    const result = formatTweetText('업데이트 완료 #갤러리');
    expect(result).toEqual([
      { type: 'text', content: '업데이트 완료 ' },
      {
        type: 'hashtag',
        content: '#갤러리',
        href: `https://x.com/hashtag/${encodeURIComponent('갤러리')}`,
      },
    ]);
  });

  it('should detect cashtags and create search links', () => {
    const result = formatTweetText('Long $TSLA short $NVDA');
    expect(result).toEqual([
      { type: 'text', content: 'Long ' },
      {
        type: 'cashtag',
        content: '$TSLA',
        href: 'https://x.com/search?q=%24TSLA',
      },
      { type: 'text', content: ' short ' },
      {
        type: 'cashtag',
        content: '$NVDA',
        href: 'https://x.com/search?q=%24NVDA',
      },
    ]);
  });

  it('should handle complex real-world tweet', () => {
    const tweet = `Just launched our new product! 🚀

Check it out: https://example.com/product

Features:
- Fast
- Secure
- Easy to use

Learn more: https://docs.example.com`;

    const result = formatTweetText(tweet);

    expect(result).toContainEqual({ type: 'text', content: 'Just launched our new product! 🚀' });
    expect(result).toContainEqual({
      type: 'link',
      content: 'https://example.com/product',
      href: 'https://example.com/product',
    });
    expect(result).toContainEqual({
      type: 'link',
      content: 'https://docs.example.com',
      href: 'https://docs.example.com',
    });
    // Tweet has 9 line breaks: after each content line + empty lines
    expect(result.filter(t => t.type === 'break')).toHaveLength(9);
  });

  it('should handle URLs with query parameters', () => {
    const result = formatTweetText('Search: https://example.com/search?q=test&sort=date');
    expect(result).toEqual([
      { type: 'text', content: 'Search: ' },
      {
        type: 'link',
        content: 'https://example.com/search?q=test&sort=date',
        href: 'https://example.com/search?q=test&sort=date',
      },
    ]);
  });

  it('should handle URLs with fragments', () => {
    const result = formatTweetText('Jump to: https://example.com/page#section');
    expect(result).toEqual([
      { type: 'text', content: 'Jump to: ' },
      {
        type: 'link',
        content: 'https://example.com/page#section',
        href: 'https://example.com/page#section',
      },
    ]);
  });

  it('should not create link for non-HTTP protocols', () => {
    const result = formatTweetText('Email: mailto:test@example.com');
    expect(result).toEqual([
      { type: 'text', content: 'Email: mailto:test' },
      {
        type: 'mention',
        content: '@example',
        href: 'https://x.com/example',
      },
      { type: 'text', content: '.com' },
    ]);
    expect(result.some(token => token.type === 'link')).toBe(false);
  });
});

describe('shortenUrl', () => {
  it('should return original URL if already short', () => {
    const url = 'https://example.com';
    expect(shortenUrl(url, 50)).toBe(url);
  });

  it('should return original URL if exactly at max length', () => {
    const url = 'https://example.com/path';
    expect(shortenUrl(url, url.length)).toBe(url);
  });

  it('should shorten long URLs with many path segments', () => {
    const url = 'https://example.com/very/long/path/with/many/segments/file.html';
    const result = shortenUrl(url, 40);
    expect(result).toBe('https://example.com/very/.../file.html');
  });

  it('should keep short paths as-is', () => {
    const url = 'https://example.com/path';
    const result = shortenUrl(url, 50);
    expect(result).toBe('https://example.com/path');
  });

  it('should handle URLs with 2 segments', () => {
    const url = 'https://example.com/first/second';
    const result = shortenUrl(url, 100);
    expect(result).toBe('https://example.com/first/second');
  });

  it('should handle invalid URLs gracefully', () => {
    const invalidUrl = 'not a valid url at all';
    const result = shortenUrl(invalidUrl, 10);
    expect(result).toBe('not a vali...');
  });

  it('should truncate invalid URLs when too long', () => {
    const invalidUrl = 'this is a very long string that is not a URL';
    const result = shortenUrl(invalidUrl, 20);
    expect(result).toHaveLength(23); // 20 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should use custom maxLength parameter', () => {
    const url = 'https://example.com/very/long/path/to/resource.html';
    const result = shortenUrl(url, 30);
    expect(result).toBe('https://example.com/very/.../resource.html');
  });

  it('should handle URLs with query parameters', () => {
    const url = 'https://example.com/path/to/page?query=value&other=param';
    const result = shortenUrl(url, 35);
    // shortenUrl removes query parameters and keeps pathname if short enough
    expect(result).toBe('https://example.com/path/to/page');
    expect(result).toContain('https://');
  });
});
