import { formatTweetText, shortenUrl } from '@shared/utils/text/formatting';

describe('formatTweetText - extended regex coverage', () => {
  it('matches mentions at start and after punctuation', () => {
    const tokensA = formatTweetText('@start hello');
    expect(tokensA[0]).toEqual({ type: 'mention', content: '@start', href: 'https://x.com/start' });

    const tokensB = formatTweetText('Hello,@mid!');
    expect(tokensB[1]).toEqual({ type: 'mention', content: '@mid', href: 'https://x.com/mid' });
  });

  it('enforces mention length (15 chars max)', () => {
    const sixteen = '@' + 'a'.repeat(16);
    const fifteen = '@' + 'a'.repeat(15);

    // 15 chars should match
    const tokens15 = formatTweetText(`${fifteen} trailing`);
    expect(tokens15[0]).toEqual({ type: 'mention', content: fifteen, href: `https://x.com/${'a'.repeat(15)}` });

    // 16 chars: only up to 15 characters should be captured
    const tokens16 = formatTweetText(`${sixteen} trailing`);
    // It should capture the first 15 characters as mention, then the remaining char as text
    expect(tokens16[0]).toEqual({ type: 'mention', content: fifteen, href: `https://x.com/${'a'.repeat(15)}` });
    // And the leftover 'a' should remain in a following text token (plus trailing space)
    expect(tokens16.some(t => t.type === 'text')).toBeTruthy();
  });

  it('matches unicode hashtags and refuses hyphens as part of tag', () => {
    const tokens = formatTweetText('#日本語 #hello-world');
    const tag1 = tokens.find(t => t.type === 'hashtag');
    expect(tag1).toEqual({ type: 'hashtag', content: '#日本語', href: 'https://x.com/hashtag/%E6%97%A5%E6%9C%AC%E8%AA%9E' });

    const tokens2 = formatTweetText('#hello-world');
    // '#' + 'hello' should be tokenized as hashtag, hyphen is treated as text
    const tag2 = tokens2.find(t => t.type === 'hashtag');
    expect(tag2).toEqual({ type: 'hashtag', content: '#hello', href: 'https://x.com/hashtag/hello' });
    expect(tokens2.some(t => t.type === 'text')).toBeTruthy();
  });

  it('matches uppercase cashtags with optional dot suffix and rejects lowercase', () => {
    const tk1 = formatTweetText('Invest $AAPL $BRK.A');
    expect(tk1.some(t => t.type === 'cashtag')).toBeTruthy();

    const tkLower = formatTweetText('Invest $goog');
    // Lowercase cashtag is not matched
    expect(tkLower).toEqual([{ type: 'text', content: 'Invest $goog' }]);
  });

  it('captures http and https links including query and hash', () => {
    const url = 'https://example.com/path/to/resource?query=1#frag';
    const tokens = formatTweetText(`Visit ${url} now`);
    expect(tokens.some(t => t.type === 'link' && t.href === url)).toBeTruthy();

    const url2 = 'http://localhost:8080/test?a=b';
    const tokens2 = formatTweetText(`Local ${url2}`);
    expect(tokens2.some(t => t.type === 'link' && t.href === url2)).toBeTruthy();
  });

  it('handles email-like addresses by tokenizing @username portion', () => {
    const tokens = formatTweetText('contact someone@example.com');
    // Should capture an @example mention within the email address due to the regex
    expect(tokens.some(t => t.type === 'mention' && t.content.startsWith('@example'))).toBeTruthy();
  });

  it('handles multiple adjacent entities without whitespace', () => {
    const tokens = formatTweetText('@u#$AAPL#taghttp://example.com');
    // Ensure three separate tokens extracted amongst text
    expect(tokens.filter(t => t.type === 'mention').length +
      tokens.filter(t => t.type === 'cashtag').length +
      tokens.filter(t => t.type === 'hashtag').length +
      tokens.filter(t => t.type === 'link').length).toBeGreaterThanOrEqual(3);
  });
});

describe('shortenUrl - edge cases', () => {
  it('returns full base+path unshortened when base length >= maxLength', () => {
    const url = 'https://averyveryverylonghostname-example.com/path/12345';
    // base is long, set a small maxLength to force base >= maxLength
    const maxLength = 10;
    const out = shortenUrl(url, maxLength);
    expect(out).toBe(`${new URL(url).protocol}//${new URL(url).hostname}${new URL(url).pathname}`);
  });

  it('does not shorten URLs with only two segments', () => {
    const url = 'https://example.com/first/second';
    expect(shortenUrl(url, 30)).toBe(url);
  });

  it('shortens long multi-segment URLs to first/.../last structure', () => {
    const long = 'https://example.com/a/b/c/d/e/f/g';
    // Use a smaller maxLength to ensure the URL will be shortened
    const out = shortenUrl(long, 30);
    expect(out).toContain('...');
    expect(out).toMatch(/^https?:\/\/example\.com\/a\/\.\.\.\/g$/);
  });

  it('truncates invalid URLs with ellipsis', () => {
    const long = 'not-a-valid-url-' + 'x'.repeat(100);
    const out = shortenUrl(long, 50);
    expect(out.endsWith('...')).toBeTruthy();
    expect(out.length).toBe(53);
  });
});
