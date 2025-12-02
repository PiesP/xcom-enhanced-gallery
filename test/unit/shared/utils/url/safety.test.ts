import {
  HTML_ATTRIBUTE_URL_POLICY,
  isUrlAllowed,
  MEDIA_URL_POLICY,
  type UrlSafetyPolicy,
} from '@shared/utils/url/safety';

describe('url-safety', () => {
  describe('isUrlAllowed', () => {
    const STRICT_POLICY: UrlSafetyPolicy = {
      allowedProtocols: new Set(['https:']),
      allowRelative: false,
      allowProtocolRelative: false,
      allowFragments: false,
      allowDataUrls: false,
    };

    it('should allow valid HTTPS URLs', () => {
      expect(isUrlAllowed('https://example.com', STRICT_POLICY)).toBe(true);
      expect(isUrlAllowed('https://example.com/path?query=1', STRICT_POLICY)).toBe(true);
    });

    it('should block HTTP if not allowed', () => {
      expect(isUrlAllowed('http://example.com', STRICT_POLICY)).toBe(false);
    });

    it('should block unknown protocols', () => {
      expect(isUrlAllowed('ftp://example.com', STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('smb://example.com', STRICT_POLICY)).toBe(false);
    });

    it('should block dangerous protocols', () => {
      expect(isUrlAllowed('javascript:alert(1)', STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('vbscript:alert(1)', STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('data:text/html,<script>alert(1)</script>', STRICT_POLICY)).toBe(false);
    });

    it('should block obfuscated dangerous protocols', () => {
      // Whitespace
      expect(isUrlAllowed('java script:alert(1)', STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('j a v a s c r i p t:alert(1)', STRICT_POLICY)).toBe(false);

      // Control characters
      expect(isUrlAllowed('java\0script:alert(1)', STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('java\tscript:alert(1)', STRICT_POLICY)).toBe(false);

      // URL encoding
      expect(isUrlAllowed('javascript%3Aalert(1)', STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('j%61vascript:alert(1)', STRICT_POLICY)).toBe(false);

      // Mixed
      expect(isUrlAllowed(' j a v a s c r i p t : alert(1)', STRICT_POLICY)).toBe(false);
    });

    it('should handle data URLs according to policy', () => {
      const DATA_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowDataUrls: true,
        allowedDataMimePrefixes: ['image/png'],
      };

      expect(isUrlAllowed('data:image/png;base64,abc', DATA_POLICY)).toBe(true);
      expect(isUrlAllowed('data:image/jpeg;base64,abc', DATA_POLICY)).toBe(false); // Not in allowed list
      expect(isUrlAllowed('data:text/html,bad', DATA_POLICY)).toBe(false);

      // Case insensitivity
      expect(isUrlAllowed('DATA:IMAGE/PNG;base64,abc', DATA_POLICY)).toBe(true);
    });

    it('should handle protocol-relative URLs', () => {
      const RELATIVE_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowProtocolRelative: true,
      };

      expect(isUrlAllowed('//example.com/image.png', RELATIVE_POLICY)).toBe(true);
      expect(isUrlAllowed('//example.com/image.png', STRICT_POLICY)).toBe(false);
    });

    it('should handle relative URLs', () => {
      const RELATIVE_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowRelative: true,
      };

      expect(isUrlAllowed('/path/to/resource', RELATIVE_POLICY)).toBe(true);
      expect(isUrlAllowed('path/to/resource', RELATIVE_POLICY)).toBe(true);
      expect(isUrlAllowed('/path/to/resource', STRICT_POLICY)).toBe(false);
    });

    it('should handle fragments', () => {
      const FRAGMENT_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowFragments: true,
      };

      expect(isUrlAllowed('#top', FRAGMENT_POLICY)).toBe(true);
      expect(isUrlAllowed('#top', STRICT_POLICY)).toBe(false);
    });

    it('should handle null/undefined/empty inputs', () => {
      expect(isUrlAllowed(null, STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed(undefined, STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('', STRICT_POLICY)).toBe(false);
      expect(isUrlAllowed('   ', STRICT_POLICY)).toBe(false);
    });

    it('should handle non-string inputs gracefully', () => {
      // @ts-expect-error Testing runtime safety
      expect(isUrlAllowed(123, STRICT_POLICY)).toBe(false);
      // @ts-expect-error Testing runtime safety
      expect(isUrlAllowed({}, STRICT_POLICY)).toBe(false);
    });

    it('should reject whitespace-only URLs even if relative URLs are allowed', () => {
      const RELATIVE_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowRelative: true,
      };
      expect(isUrlAllowed('   ', RELATIVE_POLICY)).toBe(false);
      expect(isUrlAllowed('\t\n', RELATIVE_POLICY)).toBe(false);
    });

    it('should respect allowDataUrls=false even if prefixes match', () => {
      const NO_DATA_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowDataUrls: false,
        allowedDataMimePrefixes: ['image/png'],
      };
      expect(isUrlAllowed('data:image/png;base64,abc', NO_DATA_POLICY)).toBe(false);
    });

    it('should detect blocked protocols even with invalid sequences far in the string', () => {
      // "javascript:" encoded is "javascript%3A"
      // We put an invalid sequence (%FF) after 64 chars.
      // If we slice, we decode "javascript%3A..." successfully.
      // If we don't slice, decodeURIComponent throws, and we miss the check.
      const padding = 'a'.repeat(100);
      const url = 'javascript%3A' + padding + '%FF';
      const RELATIVE_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowRelative: true,
      };
      expect(isUrlAllowed(url, RELATIVE_POLICY)).toBe(false);
    });

    it('should stop decoding after MAX_DECODE_ITERATIONS (3)', () => {
      // 4x encoded "javascript:"
      // 1: javascript%3A
      // 2: javascript%253A
      // 3: javascript%25253A
      // 4: javascript%2525253A
      const encoded4x = 'javascript%2525253Aalert(1)';
      // Should NOT be detected as javascript: because we only decode 3 times
      // So it remains "javascript%253A..." which is a relative URL (if allowed)
      // The mutant decodes 4 times, finds "javascript:", and blocks it (returns false).

      const RELATIVE_POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowRelative: true,
      };
      expect(isUrlAllowed(encoded4x, RELATIVE_POLICY)).toBe(true);
    });

    it('should handle undefined allowedDataMimePrefixes', () => {
      const POLICY: UrlSafetyPolicy = {
        ...STRICT_POLICY,
        allowDataUrls: true,
      };
      expect(isUrlAllowed('data:image/png;base64,abc', POLICY)).toBe(false);
    });

    it('should match mime type as prefix, not suffix', () => {
      const policyWithPng = {
        ...MEDIA_URL_POLICY,
        allowedDataMimePrefixes: ['image/png'],
      };
      // "text/image/png" ends with "image/png" but doesn't start with it.
      // If the code used endsWith instead of startsWith, this would return true (allowed).
      // We want it to return false (blocked).
      expect(isUrlAllowed('data:text/image/png;base64,DATA', policyWithPng)).toBe(false);
    });

    it('should match mime type as prefix (kill endsWith mutant)', () => {
      const policyWithGenericPrefix = {
        ...MEDIA_URL_POLICY,
        allowedDataMimePrefixes: ['image/'],
      };
      // "image/png" starts with "image/" but does not end with "image/"
      // startsWith -> true (Allowed)
      // endsWith -> false (Blocked)
      expect(isUrlAllowed('data:image/png;base64,DATA', policyWithGenericPrefix)).toBe(true);
    });
  });

  describe('HTML_ATTRIBUTE_URL_POLICY', () => {
    it('should validate HTML_ATTRIBUTE_URL_POLICY defaults', () => {
      expect(isUrlAllowed('https://example.com', HTML_ATTRIBUTE_URL_POLICY)).toBe(true);
      expect(isUrlAllowed('/local/path', HTML_ATTRIBUTE_URL_POLICY)).toBe(true);
      expect(isUrlAllowed('#anchor', HTML_ATTRIBUTE_URL_POLICY)).toBe(true);
      expect(isUrlAllowed('data:image/png;base64,abc', HTML_ATTRIBUTE_URL_POLICY)).toBe(false); // Data URLs blocked by default for attributes
    });
  });
});
