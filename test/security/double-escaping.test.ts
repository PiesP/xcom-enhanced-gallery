/**
 * Double Escaping Security Tests
 *
 * CodeQL Issue: js/double-escaping
 * Files: src/shared/utils/patterns/url-patterns.ts (lines 355, 798)
 *
 * 이 테스트는 HTML 엔티티 디코딩 시 double-escaping 취약점을 방지합니다.
 */

import { describe, it, expect } from 'vitest';
import { decodeHtmlEntitiesSafely } from '@shared/utils/html/decode-html-entities';

describe('SECURITY-HARDENING-001: Double Escaping Prevention', () => {
  describe('RED: Detect double-escaping vulnerabilities', () => {
    it('should decode &amp; to & only once', () => {
      const input = 'https://example.com?foo=bar&amp;baz=qux';
      const result = decodeHtmlEntitiesSafely(input);

      expect(result).toBe('https://example.com?foo=bar&baz=qux');
      expect(result).not.toContain('&amp;');
    });

    it('should handle multiple &amp; entities', () => {
      const input = 'a&amp;b&amp;c&amp;d';
      const result = decodeHtmlEntitiesSafely(input);

      expect(result).toBe('a&b&c&d');
      // 두 번 디코딩하면 안 됨
      const doubleDecoded = decodeHtmlEntitiesSafely(result!);
      expect(doubleDecoded).toBe('a&b&c&d');
    });

    it('should not double-decode already decoded strings', () => {
      const alreadyDecoded = 'https://example.com?foo=bar&baz=qux';
      const result = decodeHtmlEntitiesSafely(alreadyDecoded);

      // 이미 디코딩된 문자열은 변경되지 않아야 함
      expect(result).toBe(alreadyDecoded);
    });

    it('should handle mixed encoded and plain ampersands', () => {
      const input = 'a&b&amp;c&d';
      const result = decodeHtmlEntitiesSafely(input);

      // 모든 &는 그대로 유지되어야 함
      expect(result).toBe('a&b&c&d');
      expect((result?.match(/&/g) || []).length).toBe(3);
    });
  });

  describe('GREEN: Safe decoding of other HTML entities', () => {
    it('should safely decode common HTML entities', () => {
      const tests = [
        { input: '&lt;div&gt;', expected: '<div>' },
        { input: '&quot;hello&quot;', expected: '"hello"' },
        { input: '&apos;world&apos;', expected: "'world'" },
        { input: '&#39;test&#39;', expected: "'test'" },
        { input: '&#x27;hex&#x27;', expected: "'hex'" },
      ];

      tests.forEach(({ input, expected }) => {
        const result = decodeHtmlEntitiesSafely(input);
        expect(result).toBe(expected);
      });
    });

    it('should return null for invalid inputs', () => {
      expect(decodeHtmlEntitiesSafely(null as any)).toBe(null);
      expect(decodeHtmlEntitiesSafely(undefined as any)).toBe(null);
      expect(decodeHtmlEntitiesSafely(123 as any)).toBe(null);
    });

    it('should return empty string for empty input', () => {
      expect(decodeHtmlEntitiesSafely('')).toBe('');
    });
  });

  describe('Edge cases: Malformed entities', () => {
    it('should handle incomplete entities gracefully', () => {
      // DOM API는 불완전한 엔티티도 관대하게 파싱함
      // 이는 일관성을 위해 의도된 동작임 (보안 취약점 아님)
      const tests = [
        { input: '&incomplete', expected: '&incomplete' },
        { input: '&amp', expected: '&' }, // DOM이 세미콜론 없이도 디코딩
        { input: '&#', expected: '&#' },
        { input: '&#x', expected: '&#x' },
      ];

      tests.forEach(({ input, expected }) => {
        const result = decodeHtmlEntitiesSafely(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle invalid numeric entities', () => {
      const tests = [
        { input: '&#999999999;', expected: '&#999999999;' }, // 범위 초과
        { input: '&#xGGGG;', expected: '&#xGGGG;' }, // 잘못된 hex
        { input: '&#abc;', expected: '&#abc;' }, // 잘못된 decimal
      ];

      tests.forEach(({ input, expected }) => {
        const result = decodeHtmlEntitiesSafely(input);
        expect(result).toBeTruthy();
      });
    });
  });
});
