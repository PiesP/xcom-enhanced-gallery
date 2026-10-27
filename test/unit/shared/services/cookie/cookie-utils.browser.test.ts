// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getCookieValueSync } from '@shared/services/cookie/cookie-utils';
import { describe, expect, it } from 'vite-plus/test';

describe('cookie-utils (pure functions)', () => {
  // ── getCookieValueSync ──────────────────────────────────────────

  describe('getCookieValueSync', () => {
    beforeEach(() => {
      // Clear all cookies before each test
      document.cookie.split(';').forEach((c) => {
        document.cookie = `${c.split('=')[0]!.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      });
    });

    it('should return undefined for empty name', () => {
      expect(getCookieValueSync('')).toBeUndefined();
    });

    it('should return undefined when no cookies exist', () => {
      expect(getCookieValueSync('nonexistent')).toBeUndefined();
    });

    it('should return value from a single cookie', () => {
      document.cookie = 'test_cookie=hello_world';
      expect(getCookieValueSync('test_cookie')).toBe('hello_world');
    });

    it('should return the correct value among multiple cookies', () => {
      document.cookie = 'first=alpha';
      document.cookie = 'second=beta';
      document.cookie = 'third=gamma';

      expect(getCookieValueSync('second')).toBe('beta');
      expect(getCookieValueSync('first')).toBe('alpha');
      expect(getCookieValueSync('third')).toBe('gamma');
    });

    it('should return undefined for a cookie that is not set', () => {
      document.cookie = 'existing=value';
      expect(getCookieValueSync('missing')).toBeUndefined();
    });

    it('should handle URL-encoded cookie values', () => {
      document.cookie = 'encoded=%7B%22key%22%3A%22value%22%7D';
      expect(getCookieValueSync('encoded')).toBe('{"key":"value"}');
    });

    it('should return raw value when decodeURIComponent fails', () => {
      // Set a cookie with an invalid percent-encoding
      document.cookie = 'bad=%E0%A4';
      expect(getCookieValueSync('bad')).toBe('%E0%A4');
    });

    it('should handle cookie with empty value', () => {
      // A real browser stores an empty cookie value, which this API treats as absent.
      document.cookie = 'empty=';
      expect(document.cookie).toContain('empty=');
      expect(getCookieValueSync('empty')).toBeUndefined();
    });

    it('should handle cookie name with special regex characters', () => {
      document.cookie = 'a.b+$c=special_regex';
      expect(getCookieValueSync('a.b+$c')).toBe('special_regex');
    });

    it('should not confuse similarly named cookies', () => {
      document.cookie = 'ct=short';
      document.cookie = 'ct0=longer';
      expect(getCookieValueSync('ct')).toBe('short');
      expect(getCookieValueSync('ct0')).toBe('longer');
    });
  });
});
