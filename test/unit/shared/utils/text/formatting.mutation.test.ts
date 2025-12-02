import { formatTweetText, shortenUrl } from '@shared/utils/text/formatting';

describe('formatting utils mutation tests', () => {
  describe('formatTweetText', () => {
    it('should not add break token for trailing empty line', () => {
      // Kills: if (i < lines.length - 1) -> true / i < lines.length + 1
      // Also kills: if (!line) { ... } block removal (if we check for break existence)
      const tokens = formatTweetText('line1\n');
      // Should be [text, break]
      // If trailing break added: [text, break, break]
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ type: 'text', content: 'line1' });
      expect(tokens[1]).toEqual({ type: 'break' });
    });

    it('should not add empty text token when entity is at start of line', () => {
      // Kills: if (textContent) -> true
      const tokens = formatTweetText('@mention');
      // Should be [mention]
      // If empty text added: [text(""), mention]
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.type).toBe('mention');
    });

    it('should not add a break token at the end of a single line', () => {
      const tokens = formatTweetText('Hello');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({ type: 'text', content: 'Hello' });
    });

    it('should not add a break token at the end of the last line in multi-line text', () => {
      const tokens = formatTweetText('Line 1\nLine 2');
      expect(tokens).toHaveLength(3);
      expect(tokens[2]).toEqual({ type: 'text', content: 'Line 2' });
    });

    it('should not produce empty text tokens before entities', () => {
      // @user is at start, so text before it is empty.
      const tokens = formatTweetText('@user');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.type).toBe('mention');
    });

    it('should not produce empty text tokens after entities', () => {
      // @user is at end, so text after it is empty.
      const tokens = formatTweetText('@user');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.type).toBe('mention');
    });

    it('should not produce empty text tokens between entities', () => {
      const tokens = formatTweetText('@user#tag');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]!.type).toBe('mention');
      expect(tokens[1]!.type).toBe('hashtag');
    });

    it('should identify cashtag and not hashtag for strings starting with $', () => {
      const tokens = formatTweetText('Invest in $AAPL and #AAPL');
      expect(tokens).toHaveLength(4);
      expect(tokens[0]).toEqual({ type: 'text', content: 'Invest in ' });
      expect(tokens[1]).toEqual({ type: 'cashtag', content: '$AAPL', href: 'https://x.com/search?q=%24AAPL' });
      expect(tokens[2]).toEqual({ type: 'text', content: ' and ' });
      expect(tokens[3]).toEqual({ type: 'hashtag', content: '#AAPL', href: 'https://x.com/hashtag/AAPL' });
    });

    it('should include trailing punctuation in link token by default', () => {
      const tokens = formatTweetText('Check https://example.com/test.');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ type: 'text', content: 'Check ' });
      expect(tokens[1]).toEqual({ type: 'link', content: 'https://example.com/test.', href: 'https://example.com/test.' });
    });

    it('should match both http and https links', () => {
      const input = 'Visit http://example.com and https://secure.example.com/path';
      const tokens = formatTweetText(input);
      const linkTokens = tokens.filter(t => t.type === 'link') as any[];
      expect(linkTokens).toHaveLength(2);
      expect(linkTokens[0].href).toBe('http://example.com');
      expect(linkTokens[1].href).toBe('https://secure.example.com/path');
    });

    it('should match mention names with underscores and digits up to 15 chars', () => {
      const longName = '@user_name_12345'; // 15 chars after @
      const tokens = formatTweetText(longName);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({ type: 'mention', content: longName, href: 'https://x.com/user_name_12345' });
    });

    it('should match unicode hashtags', () => {
      const tokens = formatTweetText('#こんにちは');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.type).toBe('hashtag');
    });

    it('should NOT match lowercase cashtags (only uppercase allowed)', () => {
      const tokens = formatTweetText('Invest in $aapl and $AAPL');
      // Should only detect cashtag for uppercase $AAPL and treat $aapl as text
      expect(tokens.some(t => t.type === 'cashtag' && t.content === '$AAPL')).toBe(true);
      expect(tokens.some(t => t.type === 'cashtag' && t.content === '$aapl')).toBe(false);
    });

    it('should parse cashtag with suffix e.g. $AAPL.NY correctly', () => {
      const tokens = formatTweetText('Invest in $AAPL.NY');
      expect(tokens).toHaveLength(2);
      expect(tokens[1]).toEqual({ type: 'cashtag', content: '$AAPL.NY', href: 'https://x.com/search?q=%24AAPL.NY' });
    });

    it('should match numeric-only mentions like @12345', () => {
      const tokens = formatTweetText('@12345');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({ type: 'mention', content: '@12345', href: 'https://x.com/12345' });
    });

    it('should match mention for first 15 chars and leave remainder as text if longer than 15 chars', () => {
      const long = '@' + 'a'.repeat(16); // 16 chars after @
      const tokens = formatTweetText(long);
      // Should produce mention token (first 15 chars) and remaining text
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ type: 'mention', content: '@' + 'a'.repeat(15), href: 'https://x.com/' + 'a'.repeat(15) });
      expect(tokens[1]).toEqual({ type: 'text', content: 'a' });
    });

    it('should match hashtags with underscores and numbers', () => {
      const tokens = formatTweetText('#tag_name_123');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({ type: 'hashtag', content: '#tag_name_123', href: 'https://x.com/hashtag/tag_name_123' });
    });

    it('should match hashtag for first 50 chars and leave remainder as text if longer than 50 chars', () => {
      const tag = '#' + 'a'.repeat(51);
      const tokens = formatTweetText(tag);
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ type: 'hashtag', content: `#${'a'.repeat(50)}`, href: `https://x.com/hashtag/${encodeURIComponent('a'.repeat(50))}` });
      expect(tokens[1]).toEqual({ type: 'text', content: 'a' });
    });
  });

  describe('shortenUrl', () => {
    it('should return invalid URL unchanged if length equals maxLength', () => {
      // Kills: url.length > maxLength -> url.length >= maxLength
      // Kills: url.length > maxLength -> true (for invalid URLs)
      // "12345" is invalid (no base), length 5. maxLength 5.
      const url = '12345';
      const result = shortenUrl(url, 5);
      expect(result).toBe('12345');
    });

    it('should return full URL if path length is exactly 20', () => {
      // Kills: path.length <= 20 -> path.length < 20
      // Path needs to be length 20 AND have > 2 segments to distinguish from segment check
      // /1/3/5/7/9/1/3/5/7/9 (20 chars)
      const path = '/1/3/5/7/9/1/3/5/7/9';
      const url = `https://example.com${path}`;
      const result = shortenUrl(url);
      expect(result).toBe(url);
    });

    it('should return full URL if segments length is exactly 2', () => {
      // Kills: segments.length <= 2 -> segments.length < 2
      const url = 'https://example.com/a/b';
      const result = shortenUrl(url);
      expect(result).toBe(url);
    });

    it('should return URL unchanged if length equals maxLength', () => {
      // Create a URL with exactly 50 chars
      // https://example.com/ (20 chars) + 30 chars path
      const path = 'a'.repeat(30);
      const url = `https://example.com/${path}`;
      expect(url.length).toBe(50);

      const result = shortenUrl(url, 50);
      expect(result).toBe(url);
    });

    it('should not shorten URLs with short paths even if they have many segments', () => {
      // Path length 8, but 4 segments.
      // Total length needs to be > maxLength (default 50) for this logic to matter?
      // No, shortenUrl checks total length first.
      // So we need a URL > 50 chars, BUT path <= 20 chars.
      // This implies domain is very long.
      const longDomain = 'very-long-domain-name-that-makes-url-exceed-fifty-chars.com';
      const url = `https://${longDomain}/a/b/c/d`;
      expect(url.length).toBeGreaterThan(50);

      // Path is /a/b/c/d (8 chars) <= 20.
      // Should return full URL.
      const result = shortenUrl(url);
      expect(result).toBe(url);
    });

    it('should return full url when base length >= maxLength', () => {
      const longDomain = 'this-is-an-exceedingly-long-domain-name-that-will-exceed-the-max-length.example.com';
      const url = `https://${longDomain}/a`;
      // Force a small maxLength, shorter than the protocol+domain base
      const result = shortenUrl(url, 20);
      expect(result).toBe(url);
    });

    it('should correctly handle path splitting (ignoring empty strings)', () => {
      // Need a URL > 50 chars, path > 20 chars, segments > 2.
      // And verify the first segment is not empty string (from leading slash).
      const url = 'https://example.com/first/segment/is/very/long/and/deep/structure';
      expect(url.length).toBeGreaterThan(50);

      const result = shortenUrl(url);
      // Should be https://example.com/first/.../structure
      // If split includes empty string, first would be empty, so https://example.com//.../structure
      expect(result).toContain('/first/');
      expect(result).not.toContain('//.../');
    });

    it('should shorten when path is long and has many segments', () => {
      const url = 'https://example.com/this/is/a/very/long/path/that/needs/shortening';
      const result = shortenUrl(url);
      expect(result).toContain('...');
      expect(result).toContain('/this/');
      expect(result).toContain('/shortening');
    });

    it('should correctly ignore empty segments when shortening', () => {
      const url = 'https://example.com//first//middle//last';
      // Choose a max length that will trigger shortening logic (url length > maxLength)
      const result = shortenUrl(url, 30);
      // Should include first non-empty segment and not leave empty segments as placeholders
      expect(result).toContain('/first/');
      expect(result).not.toContain('//first');
    });
  });
});
