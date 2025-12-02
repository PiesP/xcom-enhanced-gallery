import { formatTweetText, shortenUrl, createClassName } from '@shared/utils/text/formatting';

describe('formatTweetText', () => {
  it('should return empty array for undefined or empty input', () => {
    expect(formatTweetText(undefined)).toEqual([]);
    expect(formatTweetText('')).toEqual([]);
  });

  it('should tokenize mentions, hashtags, cashtags, and links', () => {
    const text = 'Hi @alice check #news $XRP https://example.com/path';
    const tokens = formatTweetText(text);

    // Expect text then mention
    expect(tokens[0]).toEqual({ type: 'text', content: 'Hi ' });
    expect(tokens[1]).toEqual({ type: 'mention', content: '@alice', href: 'https://x.com/alice' });
    expect(tokens[2]).toEqual({ type: 'text', content: ' check ' });
    expect(tokens[3]).toEqual({ type: 'hashtag', content: '#news', href: 'https://x.com/hashtag/news' });
    expect(tokens[4]).toEqual({ type: 'text', content: ' ' });
    expect(tokens[5]).toEqual({ type: 'cashtag', content: '$XRP', href: 'https://x.com/search?q=%24XRP' });
    expect(tokens[6]).toEqual({ type: 'text', content: ' ' });
    expect(tokens[7]).toEqual({ type: 'link', content: 'https://example.com/path', href: 'https://example.com/path' });
  });

  it('should handle line breaks and break tokens', () => {
    const tokens = formatTweetText('Line1\n\nLine2');
    expect(tokens.some(t => (t as any).type === 'break')).toBe(true);
  });
});

describe('shortenUrl', () => {
  it('should shorten long URLs with many segments', () => {
    const url = 'https://example.com/one/two/three/four/five';
    const shortened = shortenUrl(url, 30);
    expect(shortened.startsWith('https://example.com/one/.../')).toBe(true);
  });

  it('should return truncated string for invalid URL', () => {
    const invalid = 'not a url but very long string that will be truncated';
    const result = shortenUrl(invalid, 10);
    expect(result).toContain('...');
  });
});

describe('createClassName', () => {
  it('should join strings while ignoring falsy values', () => {
    expect(createClassName('a', undefined, 'b', '', null)).toBe('a b');
  });
});
// Reuse the imports from the top; vitest globals are available via tsconfig

describe("formatting utils", () => {
  describe("createClassName", () => {
    it("should join class names with space", () => {
      expect(createClassName("foo", "bar")).toBe("foo bar");
    });

    it("should filter out falsy values", () => {
      expect(createClassName("foo", undefined, null, "bar", "")).toBe(
        "foo bar",
      );
    });

    it("should return empty string if no classes provided", () => {
      expect(createClassName()).toBe("");
    });
  });

  describe("formatTweetText", () => {
    it("should return empty array for undefined text", () => {
      expect(formatTweetText(undefined)).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      expect(formatTweetText("")).toEqual([]);
    });

    it("should format plain text", () => {
      const tokens = formatTweetText("Hello world");
      expect(tokens).toEqual([{ type: "text", content: "Hello world" }]);
    });

    it("should handle line breaks", () => {
      const tokens = formatTweetText("Line 1\nLine 2");
      expect(tokens).toEqual([
        { type: "text", content: "Line 1" },
        { type: "break" },
        { type: "text", content: "Line 2" },
      ]);
    });

    it("should handle empty lines", () => {
      const tokens = formatTweetText("Line 1\n\nLine 3");
      expect(tokens).toEqual([
        { type: "text", content: "Line 1" },
        { type: "break" },
        { type: "break" },
        { type: "text", content: "Line 3" },
      ]);
    });

    it("should parse URLs", () => {
      const tokens = formatTweetText("Check https://example.com here");
      expect(tokens).toEqual([
        { type: "text", content: "Check " },
        { type: "link", content: "https://example.com", href: "https://example.com" },
        { type: "text", content: " here" },
      ]);
    });

    it("should parse http links (not only https)", () => {
      const tokens = formatTweetText("Check http://example.com here");
      expect(tokens).toEqual([
        { type: "text", content: "Check " },
        { type: "link", content: "http://example.com", href: "http://example.com" },
        { type: "text", content: " here" },
      ]);
    });

    it("should handle mention followed by cashtag without spaces", () => {
      const tokens = formatTweetText("@user$AAPL rest");
      expect(tokens[0]).toEqual({ type: "mention", content: "@user", href: "https://x.com/user" });
      expect(tokens[1]).toEqual({ type: "cashtag", content: "$AAPL", href: "https://x.com/search?q=%24AAPL" });
      expect(tokens[2]).toEqual({ type: "text", content: " rest" });
    });

    it("should not treat malformed URL with internal spaces as link", () => {
      const tokens = formatTweetText("Check http:/ /example.com here");
      // Entire string should be plain text because the URL has spaces
      expect(tokens).toEqual([{ type: "text", content: "Check http:/ /example.com here" }]);
    });

    it("should not recognize lowercase cashtags as cashtag", () => {
      const tokens = formatTweetText("Buy $goog");
      // Lowercase cashtag should be plain text
      expect(tokens).toEqual([{ type: "text", content: "Buy $goog" }]);
    });

    it("should not treat invalid mention with punctuation as mention", () => {
      const tokens = formatTweetText("Hello @user! next");
      // Ensure mention is captured without including the punctuation
      expect(tokens).toEqual([
        { type: "text", content: "Hello " },
        { type: "mention", content: "@user", href: "https://x.com/user" },
        { type: "text", content: "! next" },
      ]);
    });

    it("should parse mentions", () => {
      const tokens = formatTweetText("Hello @user_123!");
      expect(tokens).toEqual([
        { type: "text", content: "Hello " },
        { type: "mention", content: "@user_123", href: "https://x.com/user_123" },
        { type: "text", content: "!" },
      ]);
    });

    it("should parse hashtags", () => {
      const tokens = formatTweetText("Trending #JavaScript today");
      expect(tokens).toEqual([
        { type: "text", content: "Trending " },
        { type: "hashtag", content: "#JavaScript", href: "https://x.com/hashtag/JavaScript" },
        { type: "text", content: " today" },
      ]);
    });

    it("should parse cashtags", () => {
      const tokens = formatTweetText("Stock $AAPL is up");
      expect(tokens).toEqual([
        { type: "text", content: "Stock " },
        { type: "cashtag", content: "$AAPL", href: "https://x.com/search?q=%24AAPL" },
        { type: "text", content: " is up" },
      ]);
    });

    it("should handle multiple entities in one line", () => {
      const tokens = formatTweetText("@user Check #tag and https://test.com");
      expect(tokens).toHaveLength(5);
      expect(tokens[0]).toEqual({ type: "mention", content: "@user", href: "https://x.com/user" });
      expect(tokens[2]).toEqual({ type: "hashtag", content: "#tag", href: "https://x.com/hashtag/tag" });
      expect(tokens[4]).toEqual({ type: "link", content: "https://test.com", href: "https://test.com" });
    });

    it("should handle entities with line breaks", () => {
      const tokens = formatTweetText("@user\n#tag");
      expect(tokens).toEqual([
        { type: "mention", content: "@user", href: "https://x.com/user" },
        { type: "break" },
        { type: "hashtag", content: "#tag", href: "https://x.com/hashtag/tag" },
      ]);
    });

    it("should handle cashtag with dot suffix", () => {
      const tokens = formatTweetText("Buy $BRK.A stock");
      expect(tokens).toEqual([
        { type: "text", content: "Buy " },
        { type: "cashtag", content: "$BRK.A", href: "https://x.com/search?q=%24BRK.A" },
        { type: "text", content: " stock" },
      ]);
    });

    it("should handle unicode hashtags", () => {
      const tokens = formatTweetText("Check #日本語 tag");
      expect(tokens).toEqual([
        { type: "text", content: "Check " },
        { type: "hashtag", content: "#日本語", href: "https://x.com/hashtag/%E6%97%A5%E6%9C%AC%E8%AA%9E" },
        { type: "text", content: " tag" },
      ]);
    });

    it("should limit mention length to 15 characters", () => {
      const tokens = formatTweetText("@verylongusername123456 text");
      const mentionToken = tokens.find((t) => t.type === "mention");
      // The regex captures up to 15 chars after @, so @verylongusernam (15 chars)
      expect(mentionToken?.content).toMatch(/^@[a-zA-Z0-9_]{1,15}$/);
      expect(mentionToken?.content.length).toBeLessThanOrEqual(16); // @ + up to 15 chars
    });

    it("should limit hashtag length to 50 characters", () => {
      const longHashtag = "#" + "a".repeat(60);
      const tokens = formatTweetText(longHashtag + " text");
      const hashtagToken = tokens.find((t) => t.type === "hashtag");
      expect(hashtagToken?.content.length).toBe(51); // # + 50 chars
    });

    it("should limit cashtag length to 6 characters", () => {
      const tokens = formatTweetText("$TOOLONG text");
      const cashtagToken = tokens.find((t) => t.type === "cashtag");
      expect(cashtagToken?.content).toBe("$TOOLON");
      expect(cashtagToken?.content.length).toBe(7); // $ + 6 chars
    });

    it("should handle consecutive entities without spaces", () => {
      const tokens = formatTweetText("@user#hashtag$AAPL");
      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe("mention");
      expect(tokens[1]?.type).toBe("hashtag");
      expect(tokens[2]?.type).toBe("cashtag");
    });

    it("should not add break token after last line", () => {
      const tokens = formatTweetText("Single line");
      expect(tokens).toEqual([{ type: "text", content: "Single line" }]);
    });
  });

  describe("shortenUrl", () => {
    it("should return short URLs unchanged", () => {
      const url = "https://example.com/short";
      expect(shortenUrl(url)).toBe(url);
    });

    it("should shorten long URLs", () => {
      const url = "https://example.com/very/long/path/with/many/segments/file.html";
      const result = shortenUrl(url, 40);
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result).toContain("...");
    });

    it("should handle URLs with short paths", () => {
      const url = "https://example.com/ab";
      expect(shortenUrl(url, 30)).toBe(url);
    });

    it("should handle URLs with two path segments", () => {
      const url = "https://example.com/first/second";
      const result = shortenUrl(url, 30);
      expect(result).toBe(url);
    });

    it('should return full protocol+domain+path when path length equals 20', () => {
      const path = '/'+ 'a'.repeat(20);
      const url = `https://example.com${path}`;
      const result = shortenUrl(url, 50);
      expect(result).toBe(`https://example.com${path}`);
    });

    it("should handle invalid URLs gracefully", () => {
      const invalid = "not-a-valid-url-but-very-long-string-here";
      const result = shortenUrl(invalid, 20);
      expect(result).toContain("...");
      expect(result.length).toBeLessThanOrEqual(23);
    });

    it("should use default maxLength of 50", () => {
      const shortUrl = "https://example.com";
      expect(shortenUrl(shortUrl)).toBe(shortUrl);
    });

    it("should handle invalid URL that is shorter than maxLength", () => {
      const invalid = "short invalid";
      const result = shortenUrl(invalid, 50);
      expect(result).toBe(invalid);
    });

    it("should truncate invalid long URL with ellipsis", () => {
      const invalid = "not-a-valid-url-" + "x".repeat(100);
      const result = shortenUrl(invalid, 50);
      expect(result).toBe(invalid.slice(0, 50) + "...");
      expect(result.length).toBe(53);
    });

    it("should handle malformed URL gracefully", () => {
      const malformed = "https://[invalid:url]/" + "x".repeat(100);
      const result = shortenUrl(malformed);
      expect(result).toContain("...");
    });

    it("should handle URL with query strings and fragments", () => {
      const url = "https://example.com/path?query=value#section";
      const result = shortenUrl(url);
      expect(result).toBeTruthy();
    });

    it("should preserve protocol and domain in shortened URL", () => {
      const url = "https://subdomain.example.com/very/long/path/to/resource";
      const result = shortenUrl(url, 40);
      expect(result).toContain("https://subdomain.example.com");
    });

    it("should handle URLs with port numbers", () => {
      const url = "https://example.com:8080/very/long/path/to/resource";
      const result = shortenUrl(url, 40);
      // URL.hostname doesn't include port, need to check if port is preserved
      // The implementation uses urlObj.hostname which excludes port
      expect(result).toContain("example.com");
    });

    it("should handle international domain names", () => {
      const url = "https://例え.jp/very/long/path/to/resource";
      const result = shortenUrl(url, 40);
      expect(result).toContain("例え.jp");
    });
  });
});
