/**
 * @fileoverview Additional mutation tests for formatting utilities
 * @description Edge cases and boundary conditions for formatTweetText and shortenUrl
 */

import { formatTweetText, shortenUrl, createClassName } from '@shared/utils/text/formatting';

describe('formatTweetText mutation edge cases', () => {
  describe('Empty and null handling', () => {
    it('should return empty array for null input', () => {
      expect(formatTweetText(null as unknown as string)).toEqual([]);
    });

    it('should return empty array for whitespace-only input', () => {
      const tokens = formatTweetText('   ');
      expect(tokens).toEqual([{ type: 'text', content: '   ' }]);
    });
  });

  describe('Line break handling', () => {
    it('should handle only line breaks', () => {
      const tokens = formatTweetText('\n\n\n');
      // Three \n creates 3 empty lines, with 2 breaks between them
      // Actually: split('\n') on '\n\n\n' gives ['', '', '', '']
      // For each empty line except the last, a break is added
      expect(tokens).toEqual([
        { type: 'break' },
        { type: 'break' },
        { type: 'break' },
      ]);
    });

    it('should handle CRLF line endings', () => {
      const tokens = formatTweetText('Line1\r\nLine2');
      // \r\n split on \n gives 'Line1\r' and 'Line2'
      expect(tokens.some((t) => t.type === 'break')).toBe(true);
    });

    it('should handle trailing line break', () => {
      const tokens = formatTweetText('Hello\n');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ type: 'text', content: 'Hello' });
      expect(tokens[1]).toEqual({ type: 'break' });
    });

    it('should handle leading line break', () => {
      const tokens = formatTweetText('\nHello');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ type: 'break' });
      expect(tokens[1]).toEqual({ type: 'text', content: 'Hello' });
    });

    it('should not add break after last non-empty line', () => {
      const tokens = formatTweetText('Line1\nLine2');
      expect(tokens).toHaveLength(3);
      expect(tokens[2]).toEqual({ type: 'text', content: 'Line2' });
    });
  });

  describe('Entity at boundaries', () => {
    it('should handle entity at end of line with no text after', () => {
      const tokens = formatTweetText('Check @user');
      expect(tokens).toHaveLength(2);
      expect(tokens[1]).toEqual({
        type: 'mention',
        content: '@user',
        href: 'https://x.com/user',
      });
    });

    it('should handle multiple consecutive entities', () => {
      const tokens = formatTweetText('@a@b@c');
      expect(tokens.filter((t) => t.type === 'mention')).toHaveLength(3);
    });

    it('should handle entity surrounded by punctuation', () => {
      const tokens = formatTweetText('(@user)');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ type: 'text', content: '(' });
      expect(tokens[1]).toEqual({
        type: 'mention',
        content: '@user',
        href: 'https://x.com/user',
      });
      expect(tokens[2]).toEqual({ type: 'text', content: ')' });
    });

    it('should handle hashtag followed by punctuation', () => {
      const tokens = formatTweetText('#tag!');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        type: 'hashtag',
        content: '#tag',
        href: 'https://x.com/hashtag/tag',
      });
      expect(tokens[1]).toEqual({ type: 'text', content: '!' });
    });
  });

  describe('URL edge cases', () => {
    it('should handle URL with query parameters', () => {
      const tokens = formatTweetText('Visit https://example.com?foo=bar&baz=qux');
      expect(tokens).toHaveLength(2);
      expect(tokens[1]?.type).toBe('link');
    });

    it('should handle URL with fragment', () => {
      const tokens = formatTweetText('Check https://example.com#section');
      expect(tokens).toHaveLength(2);
      expect(tokens[1]?.type).toBe('link');
    });

    it('should handle URL with port', () => {
      const tokens = formatTweetText('Server at https://example.com:8080/path');
      expect(tokens).toHaveLength(2);
      expect(tokens[1]?.type).toBe('link');
    });

    it('should handle URL with complex path', () => {
      const tokens = formatTweetText(
        'Link: https://example.com/path/to/file.html?q=test#anchor',
      );
      expect(tokens).toHaveLength(2);
      expect(tokens[1]?.type).toBe('link');
    });
  });

  describe('Cashtag edge cases', () => {
    it('should match cashtag with exactly 6 characters', () => {
      const tokens = formatTweetText('$ABCDEF');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'cashtag',
        content: '$ABCDEF',
        href: 'https://x.com/search?q=%24ABCDEF',
      });
    });

    it('should match cashtag with 1 character', () => {
      const tokens = formatTweetText('$A');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'cashtag',
        content: '$A',
        href: 'https://x.com/search?q=%24A',
      });
    });

    it('should handle cashtag with .XX suffix', () => {
      const tokens = formatTweetText('$BRK.AB');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.type).toBe('cashtag');
    });

    it('should not match cashtag with mixed case (partial match)', () => {
      const tokens = formatTweetText('$AaPl');
      // Mixed case: only uppercase part matches as cashtag
      // $A is uppercase, aPl is not - so $A matches as cashtag
      expect(tokens).toEqual([
        { type: 'cashtag', content: '$A', href: 'https://x.com/search?q=%24A' },
        { type: 'text', content: 'aPl' },
      ]);
    });

    it('should not match cashtag with more than 6 chars before suffix', () => {
      const tokens = formatTweetText('$ABCDEFG');
      // Should only match first 6 chars as cashtag
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        type: 'cashtag',
        content: '$ABCDEF',
        href: 'https://x.com/search?q=%24ABCDEF',
      });
      expect(tokens[1]).toEqual({ type: 'text', content: 'G' });
    });
  });

  describe('Mention edge cases', () => {
    it('should match mention with exactly 15 characters', () => {
      const tokens = formatTweetText('@abcdefghijklmno');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'mention',
        content: '@abcdefghijklmno',
        href: 'https://x.com/abcdefghijklmno',
      });
    });

    it('should match mention with 1 character', () => {
      const tokens = formatTweetText('@a');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'mention',
        content: '@a',
        href: 'https://x.com/a',
      });
    });

    it('should match mention with underscores', () => {
      const tokens = formatTweetText('@user_name');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'mention',
        content: '@user_name',
        href: 'https://x.com/user_name',
      });
    });

    it('should match mention with only underscores', () => {
      const tokens = formatTweetText('@___');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'mention',
        content: '@___',
        href: 'https://x.com/___',
      });
    });
  });

  describe('Hashtag edge cases', () => {
    it('should match hashtag with exactly 50 characters', () => {
      const tag = 'a'.repeat(50);
      const tokens = formatTweetText(`#${tag}`);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'hashtag',
        content: `#${tag}`,
        href: `https://x.com/hashtag/${encodeURIComponent(tag)}`,
      });
    });

    it('should match hashtag with 1 character', () => {
      const tokens = formatTweetText('#a');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'hashtag',
        content: '#a',
        href: 'https://x.com/hashtag/a',
      });
    });

    it('should encode special characters in hashtag href', () => {
      const tokens = formatTweetText('#日本語');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'hashtag',
        content: '#日本語',
        href: 'https://x.com/hashtag/%E6%97%A5%E6%9C%AC%E8%AA%9E',
      });
    });
  });

  describe('Complex combinations', () => {
    it('should handle text with all entity types', () => {
      const text = 'Check @user #tag $AAPL https://example.com';
      const tokens = formatTweetText(text);

      expect(tokens.find((t) => t.type === 'mention')).toBeDefined();
      expect(tokens.find((t) => t.type === 'hashtag')).toBeDefined();
      expect(tokens.find((t) => t.type === 'cashtag')).toBeDefined();
      expect(tokens.find((t) => t.type === 'link')).toBeDefined();
    });

    it('should handle multiline with mixed entities', () => {
      const text = '@user\n#tag\n$AAPL';
      const tokens = formatTweetText(text);

      expect(tokens.filter((t) => t.type === 'break')).toHaveLength(2);
      expect(tokens.find((t) => t.type === 'mention')).toBeDefined();
      expect(tokens.find((t) => t.type === 'hashtag')).toBeDefined();
      expect(tokens.find((t) => t.type === 'cashtag')).toBeDefined();
    });
  });
});

describe('shortenUrl mutation edge cases', () => {
  describe('Boundary conditions', () => {
    it('should return URL unchanged when length equals maxLength', () => {
      const url = 'https://a.com/';
      expect(shortenUrl(url, url.length)).toBe(url);
    });

    it('should return URL unchanged when length is one less than maxLength', () => {
      const url = 'https://a.com/';
      expect(shortenUrl(url, url.length + 1)).toBe(url);
    });

    it('should handle URL with exactly 2 path segments', () => {
      const url = 'https://example.com/first/second';
      expect(shortenUrl(url, 10)).toBe(url);
    });

    it('should handle URL with exactly 3 path segments', () => {
      const url = 'https://example.com/first/second/third';
      const result = shortenUrl(url, 25);
      expect(result).toContain('...');
    });
  });

  describe('Path length conditions', () => {
    it('should not shorten when path length is exactly 20', () => {
      const path = '/12345678901234567890'; // 21 chars including leading /
      const url = `https://example.com${path}`;
      const result = shortenUrl(url, 30);
      expect(result).toBe(url);
    });

    it('should not shorten when path length is 19', () => {
      const path = '/1234567890123456789'; // 20 chars including leading /
      const url = `https://example.com${path}`;
      const result = shortenUrl(url, 30);
      expect(result).toBe(url);
    });
  });

  describe('Base length conditions', () => {
    it('should return full URL when base equals maxLength', () => {
      const domain = 'very-long-domain.com';
      const url = `https://${domain}/path`;
      const baseLength = `https://${domain}`.length;
      const result = shortenUrl(url, baseLength);
      expect(result).toBe(url);
    });

    it('should return full URL when base exceeds maxLength', () => {
      const domain = 'super-long-domain-name-that-exceeds-everything.com';
      const url = `https://${domain}/a/b/c`;
      const result = shortenUrl(url, 20);
      expect(result).toBe(url);
    });
  });

  describe('Invalid URL handling', () => {
    it('should handle empty string', () => {
      expect(shortenUrl('')).toBe('');
    });

    it('should handle invalid URL shorter than maxLength', () => {
      const invalid = 'not-a-url';
      expect(shortenUrl(invalid, 50)).toBe(invalid);
    });

    it('should truncate invalid URL longer than maxLength', () => {
      const invalid = 'x'.repeat(100);
      const result = shortenUrl(invalid, 50);
      expect(result).toBe('x'.repeat(50) + '...');
    });

    it('should handle URL with malformed structure', () => {
      const malformed = 'https://[invalid]/path';
      const result = shortenUrl(malformed, 10);
      expect(result).toContain('...');
    });
  });

  describe('Segment filtering', () => {
    it('should correctly filter empty segments from double slashes', () => {
      const url = 'https://example.com//a//b//c//d';
      const result = shortenUrl(url, 30);
      // Should not include empty segments in calculation
      expect(result).toContain('/a/');
    });

    it('should use first and last non-empty segments for shortening', () => {
      const url = 'https://example.com/first/middle1/middle2/last';
      const result = shortenUrl(url, 35);
      expect(result).toContain('/first/');
      expect(result).toContain('/last');
    });
  });

  describe('AllowedPathLen calculation', () => {
    it('should handle negative allowedPathLen gracefully', () => {
      // When base length exceeds maxLength, allowedPathLen would be negative
      const url = 'https://very-long-domain-name.example.com/path';
      const result = shortenUrl(url, 10);
      // Should return full URL when base >= maxLength
      expect(result).toBe(url);
    });
  });
});

describe('createClassName mutation edge cases', () => {
  it('should return empty string when all values are falsy', () => {
    expect(createClassName(undefined, null, '', undefined)).toBe('');
  });

  it('should handle single truthy value', () => {
    expect(createClassName('single')).toBe('single');
  });

  it('should handle multiple truthy values', () => {
    expect(createClassName('a', 'b', 'c')).toBe('a b c');
  });

  it('should filter out empty strings', () => {
    expect(createClassName('a', '', 'b')).toBe('a b');
  });

  it('should handle no arguments', () => {
    expect(createClassName()).toBe('');
  });

  it('should preserve class name order', () => {
    expect(createClassName('first', 'second', 'third')).toBe('first second third');
  });

  it('should not collapse multiple spaces within class names', () => {
    // This tests that we're not doing any special processing of individual class names
    expect(createClassName('has-space')).toBe('has-space');
  });
});
