import { formatTweetText, shortenUrl } from '@shared/utils/text/formatting';

describe('formatting.extra', () => {
  it('should tokenize mixed content with mention, hashtag, cashtag and link', () => {
    const text = 'Hello @user, check #topic and $AAPL https://example.com/one/two/three';
    const tokens = formatTweetText(text);

    const types = tokens.map(t => t.type);
    expect(types).toContain('mention');
    expect(types).toContain('hashtag');
    expect(types).toContain('cashtag');
    expect(types).toContain('link');
  });

  it('should treat mentioned adjacent to punctuation as mention', () => {
    const text = 'Hi,@user!';
    const tokens = formatTweetText(text);
    expect(tokens.some(t => t.type === 'mention' && t.content === '@user')).toBe(true);
    expect(tokens.some(t => t.type === 'text' && t.content.includes(','))).toBe(true);
    expect(tokens.some(t => t.type === 'text' && t.content.includes('!'))).toBe(true);
  });

  it('shortenUrl returns original when shorter than maxLength', () => {
    const url = 'https://example.com/short';
    expect(shortenUrl(url, 100)).toBe(url);
  });

  it('shortenUrl returns domain+path when path length <= 20', () => {
    const url = 'https://example.com/shortpath';
    // path length is < 20
    expect(shortenUrl(url, 10)).toBe('https://example.com/shortpath');
  });

  it('shortenUrl shortens when segments > 2 and path is long', () => {
    const url = 'https://example.com/a/b/c/d/e/f/g/h';
    const shortened = shortenUrl(url, 20);
    expect(shortened).toMatch(/https:\/\/example.com\/.+\.\.\/.+/);
  });

  it('shortenUrl falls back to truncation for invalid URLs', () => {
    const url = 'not a url but very long string with many characters that exceeds max length';
    const s = shortenUrl(url, 10);
    expect(s.length).toBeGreaterThanOrEqual(10);
    expect(s.endsWith('...')).toBeTruthy();
  });
});
