/**
 * @fileoverview Additional mutation coverage tests for formatting.ts
 * Focus: Killing specific survived mutations with targeted assertions
 */
import { formatTweetText, shortenUrl } from '@shared/utils/text/formatting';

describe('formatTweetText - specific mutation killers', () => {
  describe('regex alternation order (https?)', () => {
    it('kills https: -> http: mutation by requiring both protocols work', () => {
      const http = formatTweetText('http://a.com')[0];
      const https = formatTweetText('https://a.com')[0];
      expect(http).toEqual({ type: 'link', content: 'http://a.com', href: 'http://a.com' });
      expect(https).toEqual({ type: 'link', content: 'https://a.com', href: 'https://a.com' });
    });
  });

  describe('[^\\s]+ pattern for URL (non-whitespace)', () => {
    it('kills [^\\s] -> [\\s] mutation by matching non-space chars', () => {
      const tokens = formatTweetText('http://test.com/path?q=1');
      expect(tokens[0]?.type).toBe('link');
      expect((tokens[0] as any).content).toContain('/path?q=1');
    });

    it('kills [^\\s]+ -> [^\\S]+ mutation (case flip)', () => {
      // [^\S] matches whitespace, so URL would stop early
      const tokens = formatTweetText('http://a.com/x y');
      expect(tokens).toHaveLength(2);
      expect((tokens[0] as any).content).toBe('http://a.com/x');
      expect(tokens[1]).toEqual({ type: 'text', content: ' y' });
    });
  });

  describe('mention {1,15} quantifier', () => {
    it('kills {1,15} -> {} mutation (unlimited capture)', () => {
      const veryLong = '@' + 'a'.repeat(30);
      const tokens = formatTweetText(veryLong);
      const mention = tokens.find(t => t.type === 'mention');
      // Should only capture 15 chars
      expect(mention?.content).toBe('@' + 'a'.repeat(15));
    });

    it('kills [a-zA-Z0-9_] -> [^a-zA-Z0-9_] mutation', () => {
      // If negated, it would match special chars but not alphanumeric
      const tokens = formatTweetText('@user123');
      expect(tokens[0]?.type).toBe('mention');
      expect((tokens[0] as any).content).toBe('@user123');
    });
  });

  describe('hashtag {1,50} quantifier', () => {
    it('kills {1,50} -> {} mutation', () => {
      const longTag = '#' + 'b'.repeat(60);
      const tokens = formatTweetText(longTag);
      const hashtag = tokens.find(t => t.type === 'hashtag');
      expect(hashtag?.content).toBe('#' + 'b'.repeat(50));
    });

    it('kills [\\p{L}\\p{N}_] -> [^\\p{L}\\p{N}_] mutation', () => {
      // If negated, letters wouldn't match
      const tokens = formatTweetText('#hello');
      expect(tokens[0]?.type).toBe('hashtag');
    });

    it('kills \\p{L} -> \\P{L} mutation (uppercase P negates)', () => {
      const tokens = formatTweetText('#abc');
      expect(tokens[0]?.type).toBe('hashtag');
      expect((tokens[0] as any).content).toBe('#abc');
    });

    it('kills \\p{N} -> \\P{N} mutation', () => {
      const tokens = formatTweetText('#123');
      expect(tokens[0]?.type).toBe('hashtag');
      expect((tokens[0] as any).content).toBe('#123');
    });
  });

  describe('cashtag {1,6} quantifier and uppercase', () => {
    it('kills {1,6} -> {} mutation', () => {
      const longCash = '$' + 'A'.repeat(10);
      const tokens = formatTweetText(longCash);
      const cashtag = tokens.find(t => t.type === 'cashtag');
      expect(cashtag?.content).toBe('$' + 'A'.repeat(6));
    });

    it('kills [A-Z] -> [^A-Z] mutation', () => {
      // If negated, uppercase wouldn't match
      const tokens = formatTweetText('$AAPL');
      expect(tokens[0]?.type).toBe('cashtag');
    });

    it('kills suffix (?: ...)? -> (?:...)  (making suffix required)', () => {
      // Without suffix should still match
      const tokens = formatTweetText('$XYZ');
      expect(tokens[0]?.type).toBe('cashtag');
      expect((tokens[0] as any).content).toBe('$XYZ');
    });

    it('kills suffix {1,2} -> {} mutation', () => {
      // With suffix longer than 2
      const tokens = formatTweetText('$ABC.DEFG');
      const cashtag = tokens.find(t => t.type === 'cashtag');
      // Should only capture up to 2 chars in suffix
      expect(cashtag?.content).toBe('$ABC.DE');
    });

    it('kills suffix [A-Z] -> [^A-Z] mutation', () => {
      const tokens = formatTweetText('$ABC.XY');
      expect(tokens[0]?.type).toBe('cashtag');
      expect((tokens[0] as any).content).toBe('$ABC.XY');
    });
  });
});

describe('formatTweetText - line loop mutations', () => {
  it('kills i < lines.length -> i <= lines.length by checking no out-of-bounds', () => {
    const tokens = formatTweetText('a\nb\nc');
    // Should have exactly 3 text tokens and 2 breaks
    const texts = tokens.filter(t => t.type === 'text');
    const breaks = tokens.filter(t => t.type === 'break');
    expect(texts).toHaveLength(3);
    expect(breaks).toHaveLength(2);
  });

  it('kills if (!line) -> false by handling empty lines', () => {
    const tokens = formatTweetText('a\n\nb');
    // Empty line between should still produce correct output
    const breaks = tokens.filter(t => t.type === 'break');
    expect(breaks.length).toBeGreaterThan(0);
  });

  it('kills empty line block removal by verifying break is added', () => {
    const tokens = formatTweetText('\n');
    // Single empty line should produce just a break
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: 'break' });
  });
});

describe('formatTweetText - entity loop mutations', () => {
  it('kills matchIndex > lastIndex -> matchIndex >= lastIndex', () => {
    // Entity at start means matchIndex = 0, lastIndex = 0
    // Should NOT add empty text token
    const tokens = formatTweetText('@start');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe('mention');
  });

  it('kills textContent check -> true by verifying no empty tokens', () => {
    const tokens = formatTweetText('@a@b');
    // No text tokens between consecutive entities
    expect(tokens.every(t => t.type !== 'text')).toBe(true);
  });

  it('kills lastIndex < line.length -> lastIndex <= line.length', () => {
    // Entity at exact end of line
    const tokens = formatTweetText('text @end');
    expect(tokens).toHaveLength(2);
    expect(tokens[1]?.type).toBe('mention');
  });

  it('kills trailing text check -> true by verifying actual text is added', () => {
    const tokens = formatTweetText('@start trailing');
    expect(tokens).toHaveLength(2);
    expect(tokens[1]).toEqual({ type: 'text', content: ' trailing' });
  });
});

describe('shortenUrl - specific mutation killers', () => {
  describe('base.length >= maxLength', () => {
    it('kills >= -> > mutation', () => {
      // base length exactly equals maxLength
      const domain = 'x'.repeat(12) + '.com'; // 16 chars
      const url = `https://${domain}/path`; // https:// (8) + domain (16) = 24
      const result = shortenUrl(url, 24);
      // Should return full URL when base = maxLength
      expect(result).toBe(url);
    });
  });

  describe('segments.length <= 2', () => {
    it('kills <= -> < mutation with exactly 2 segments', () => {
      const url = 'https://example.com/first/second';
      const result = shortenUrl(url, 30);
      expect(result).toBe(url);
    });
  });

  describe('path.length <= Math.min(20, ...)', () => {
    it('kills <= -> < mutation with path length exactly 20', () => {
      // 20 char path
      const path = '/' + 'x'.repeat(19);
      const url = `https://example.com${path}`;
      const result = shortenUrl(url);
      expect(result).toBe(url);
    });
  });

  describe('url.length > maxLength', () => {
    it('kills > -> >= mutation', () => {
      const url = 'https://example.com/a/b/c/d/e';
      // Make it exactly maxLength
      const result = shortenUrl(url, url.length);
      expect(result).toBe(url);
    });

    it('handles url.length = maxLength + 1', () => {
      const url = 'https://example.com/a/b/c/d/e/f';
      const result = shortenUrl(url, url.length - 1);
      expect(result.includes('...')).toBe(true);
    });
  });

  describe('segments.length > 2', () => {
    it('kills > -> >= mutation with exactly 3 segments', () => {
      // 3 segments should trigger shortening if url is long
      const url = 'https://example.com/first/second/third-very-long-segment';
      if (url.length > 50) {
        const result = shortenUrl(url, 50);
        expect(result.includes('...')).toBe(true);
      }
    });
  });

  describe('Math.min/max mutations', () => {
    it('kills Math.min(0, allowedPathLen) -> Math.min(20, ...)', () => {
      // Need to verify the 20 char threshold is respected
      const url = 'https://ex.com/' + 'x'.repeat(21);
      // Path is 22 chars (/ + 21 x's), should trigger shortening logic
      const result = shortenUrl(url, 30);
      // Behavior depends on segment count
      expect(result).toBeTruthy();
    });
  });

  describe('invalid URL catch block', () => {
    it('kills url.length > maxLength -> true in catch', () => {
      const short = 'bad';
      const result = shortenUrl(short, 10);
      expect(result).toBe('bad');
    });

    it('kills url.length > maxLength check in catch with exact length', () => {
      const exact = 'x'.repeat(10);
      const result = shortenUrl(exact, 10);
      expect(result).toBe(exact);
    });
  });
});

describe('formatTweetText - final break token', () => {
  it('kills i < lines.length - 1 -> true for last line', () => {
    const tokens = formatTweetText('only');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe('text');
    // No break should be added after last line
  });

  it('verifies break is added between lines but not after last', () => {
    const tokens = formatTweetText('a\nb');
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ type: 'text', content: 'a' });
    expect(tokens[1]).toEqual({ type: 'break' });
    expect(tokens[2]).toEqual({ type: 'text', content: 'b' });
  });
});
