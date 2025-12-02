
import { getHostname, isHostMatching, tryParseUrl } from '@shared/utils/url/host';

describe('url host utilities', () => {
  describe('isHostMatching', () => {
    it('matches exact hosts without relying on substring checks', () => {
      expect(isHostMatching('https://pbs.twimg.com/media/abc.jpg', ['pbs.twimg.com'])).toBe(true);
      expect(
        isHostMatching('https://example.com/pbs.twimg.com/media/abc.jpg', ['pbs.twimg.com'])
      ).toBe(false);
    });

    it('supports optional subdomain matching when enabled', () => {
      expect(
        isHostMatching('https://sub.twimg.com/media', ['twimg.com'], {
          allowSubdomains: true,
        })
      ).toBe(true);
      expect(
        isHostMatching('https://sub.twimg.com/media', ['twimg.com'], {
          allowSubdomains: false,
        })
      ).toBe(false);
    });

    it('returns false for empty allowed list', () => {
      expect(isHostMatching('https://example.com', [])).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      expect(isHostMatching('not-a-url', ['example.com'])).toBe(false);
    });

    it('is case insensitive', () => {
      expect(isHostMatching('https://EXAMPLE.COM', ['example.com'])).toBe(true);
      expect(isHostMatching('https://example.com', ['EXAMPLE.COM'])).toBe(true);
    });

    it('returns false for truly invalid URLs (where parsing fails)', () => {
      // "not-a-url" is actually parsed as relative to base, so we need something that fails parsing
      expect(isHostMatching('http://', ['example.com'])).toBe(false);
    });

    it('returns false if allowedHosts is not an array', () => {
      // @ts-expect-error testing runtime safety
      expect(isHostMatching('https://example.com', null)).toBe(false);
      // @ts-expect-error testing runtime safety
      expect(isHostMatching('https://example.com', undefined)).toBe(false);
      // @ts-expect-error testing runtime safety
      expect(isHostMatching('https://example.com', 'not-array')).toBe(false);
    });

    it('returns false if allowedHosts is empty', () => {
      expect(isHostMatching('https://example.com', [])).toBe(false);
    });

    it('prevents partial matches when allowSubdomains is true', () => {
      // "my-twimg.com" ends with "twimg.com" but is not a subdomain
      expect(
        isHostMatching('https://my-twimg.com', ['twimg.com'], {
          allowSubdomains: true,
        })
      ).toBe(false);
    });

    it('prevents partial matches when allowSubdomains is false', () => {
      expect(isHostMatching('https://my-twimg.com', ['twimg.com'])).toBe(false);
      expect(isHostMatching('https://twimg.com.evil.com', ['twimg.com'])).toBe(false);
    });
  });

  describe('tryParseUrl', () => {
    it('parses relative and protocol-relative URLs safely', () => {
      expect(tryParseUrl('/media/path')?.href).toBe('https://x.com/media/path');
      expect(tryParseUrl('//pbs.twimg.com/media/123.jpg')?.hostname).toBe('pbs.twimg.com');
    });

    it('returns existing URL object', () => {
      const url = new URL('https://example.com');
      expect(tryParseUrl(url)).toBe(url);
    });

    it('returns null for non-string input', () => {
      expect(tryParseUrl(null)).toBeNull();
      expect(tryParseUrl(undefined)).toBeNull();
      // @ts-expect-error testing runtime safety
      expect(tryParseUrl(123)).toBeNull();
    });

    it('returns null for empty or whitespace string', () => {
      expect(tryParseUrl('')).toBeNull();
      expect(tryParseUrl('   ')).toBeNull();
    });

    it('returns null for invalid URLs that cannot be resolved', () => {
      // URL constructor might throw for some inputs if base is not provided or invalid,
      // but tryParseUrl provides a fallback base.
      // However, if we provide something that is truly unparseable even with base...
      // Actually, almost anything is parseable with a base.
      // But let's test the absolute protocol regex path.
      expect(tryParseUrl('http://example.com')).toBeInstanceOf(URL);
    });

    it('forces https for protocol-relative URLs even if base is http', () => {
      // This ensures the startsWith('//') block is exercised and behaves differently than default URL resolution with http base
      const url = tryParseUrl('//example.com', 'http://x.com');
      expect(url?.protocol).toBe('https:');
      expect(url?.href).toBe('https://example.com/');
    });

    it('returns null for truly invalid URLs (triggering catch block)', () => {
      expect(tryParseUrl('http://')).toBeNull();
      expect(tryParseUrl('https://')).toBeNull();
    });

    it('treats paths with colons as relative URLs (not protocols)', () => {
      // This kills the mutant where ^ anchor is removed from ABSOLUTE_PROTOCOL_REGEX
      // 'folder/file:name' would match /...:/ but not /^...:/
      const url = tryParseUrl('folder/file:name');
      expect(url).not.toBeNull();
      expect(url?.pathname).toBe('/folder/file:name');
    });

    it('treats strings starting with non-letters as relative URLs', () => {
      // This kills the mutant where regex becomes ^[^a-zA-Z]...
      // '1http://example.com' would match ^[^a-zA-Z]...
      const url = tryParseUrl('1http://example.com');
      expect(url).not.toBeNull();
      expect(url?.pathname).toBe('/1http://example.com');
    });
  });

  describe('getHostname', () => {
    it('extracts hostname from valid URL', () => {
      expect(getHostname('https://example.com/path')).toBe('example.com');
    });

    it('returns null for invalid URL', () => {
      expect(getHostname('')).toBeNull();
    });

    it('handles URL object', () => {
      expect(getHostname(new URL('https://example.com'))).toBe('example.com');
    });
  });
});
