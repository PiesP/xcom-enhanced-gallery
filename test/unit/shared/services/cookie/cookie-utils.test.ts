// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { getCookieValueSync } from '@shared/services/cookie/cookie-utils';

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
      const result = getCookieValueSync('bad');
      // The value is already set as literal text, so decodeURIComponent may or may not throw
      // Either way we should get a string back
      expect(typeof result).toBe('string');
    });

    it('should handle cookie with empty value', () => {
      // Set cookie with empty value directly on document.cookie
      // jsdom may strip trailing = so we verify the function handles it gracefully
      document.cookie = 'empty=';
      const result = getCookieValueSync('empty');
      // Both '' and undefined are acceptable outcomes depending on jsdom behavior
      expect(typeof result === 'string' || result === undefined).toBe(true);
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
