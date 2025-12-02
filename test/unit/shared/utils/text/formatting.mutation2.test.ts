import { formatTweetText, shortenUrl } from '@shared/utils/text/formatting';

describe('formatTweetText additional regex cases', () => {
  it('should detect http and https links', () => {
    expect(formatTweetText('http://example.com')[0]).toEqual({ type: 'link', content: 'http://example.com', href: 'http://example.com' });
    expect(formatTweetText('https://example.com')[0]).toEqual({ type: 'link', content: 'https://example.com', href: 'https://example.com' });
  });

  it('should not detect ftp links as links', () => {
    const tokens = formatTweetText('ftp://example.com is ftp');
    // ftp should not match as link
    expect(tokens).toEqual([{ type: 'text', content: 'ftp://example.com is ftp' }]);
  });

  it('should only capture allowed mention characters and limit to 15 chars', () => {
    const username = 'a'.repeat(20); // 20 chars
    const text = `@${username} more`;
    const tokens = formatTweetText(text);

    // The mention should be truncated to 15 chars by the regex
    const mention = tokens.find(t => t.type === 'mention');
    expect(mention).toBeDefined();
    expect((mention as any).content.length).toBeLessThanOrEqual(16); // @ + 15 chars
    expect((mention as any).content).toMatch(/^@[a-zA-Z0-9_]{1,15}$/);
  });

  it('should preserve casing for cashtags and only uppercase allowed', () => {
    const upper = formatTweetText('Invest in $AAPL today');
    expect(upper).toEqual([
      { type: 'text', content: 'Invest in ' },
      { type: 'cashtag', content: '$AAPL', href: 'https://x.com/search?q=%24AAPL' },
      { type: 'text', content: ' today' },
    ]);

    const lower = formatTweetText('Invest in $aapl today');
    // Lowercase should not be captured by cashtag regex
    expect(lower).toEqual([{ type: 'text', content: 'Invest in $aapl today' }]);
  });

  it('should not insert extra text tokens for adjacent entities (no spaces)', () => {
    const tokens = formatTweetText('@a@b');
    // Should be two mentions and no text node between them
    expect(tokens.filter(t => t.type === 'mention')).toHaveLength(2);
    expect(tokens.filter(t => t.type === 'text')).toHaveLength(0);
  });
});


describe('shortenUrl edge cases', () => {
  it('returns base + path when base length >= maxLength', () => {
    const domain = 'a'.repeat(80) + '.com';
    const url = `https://${domain}/path/to/resource`;
    const res = shortenUrl(url, 20);

    expect(res).toBe(`https://${domain}/path/to/resource`);
  });

  it('does not shorten when segments length <= 2 even if url > maxLength', () => {
    const url = 'https://example.com/first/second';
    // Make sure the URL length is artificially small but we force a small maxLength
    const out = shortenUrl(url, 10);
    expect(out).toBe(url);
  });

  it('shortens when url length > maxLength and segments > 2', () => {
    const url = 'https://example.com/a/b/c/d/e';
    const out = shortenUrl(url, 20);
    expect(out.includes('...')).toBe(true);
    expect(out.startsWith('https://example.com/')).toBe(true);
  });

  it('ignores empty path segments (double slashes) when determining segments', () => {
    const url = 'https://example.com//a///b/c/d//e';
    const out = shortenUrl(url, 30);
    expect(out.includes('...')).toBe(true);
  });

  it('does not shorten when path length equals 20 boundary', () => {
    // Build a path with exactly 20 chars including leading slash
    const path = '/' + 'a'.repeat(19); // 1 + 19 = 20
    const url = `https://example.com${path}`;
    const maxLength = 100;
    const out = shortenUrl(url, maxLength);
    expect(out).toBe(url);
  });

  it('returns truncated ellipsis when URL is invalid and larger than maxLength', () => {
    const invalid = 'not-a-url-' + 'x'.repeat(200);
    const out = shortenUrl(invalid, 20);
    expect(out).toBe(invalid.slice(0, 20) + '...');
  });
});
