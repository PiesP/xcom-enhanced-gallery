// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  tryParseUrl,
  isHostMatching,
  extractUsernameFromUrl,
} from '@shared/utils/url/host';

describe('url/host', () => {
  // ── tryParseUrl ───────────────────────────────────────────────────
  describe('tryParseUrl', () => {
    it('should parse absolute URLs', () => {
      const result = tryParseUrl('https://x.com/user/status/123');
      expect(result).not.toBeNull();
      expect(result!.hostname).toBe('x.com');
      expect(result!.pathname).toBe('/user/status/123');
    });

    it('should parse protocol-relative URLs', () => {
      const result = tryParseUrl('//cdn.example.com/image.jpg');
      expect(result).not.toBeNull();
      expect(result!.protocol).toBe('https:');
      expect(result!.hostname).toBe('cdn.example.com');
    });

    it('should parse relative paths against base', () => {
      const result = tryParseUrl('/user/status/123');
      expect(result).not.toBeNull();
      expect(result!.pathname).toBe('/user/status/123');
    });

    it('should return null for invalid input', () => {
      expect(tryParseUrl(null)).toBeNull();
      expect(tryParseUrl(undefined)).toBeNull();
      expect(tryParseUrl('')).toBeNull();
      expect(tryParseUrl('   ')).toBeNull();
    });

    it('should pass through URL instances', () => {
      const url = new URL('https://x.com/test');
      const result = tryParseUrl(url);
      expect(result).toBe(url);
    });
  });

  // ── isHostMatching ────────────────────────────────────────────────
  describe('isHostMatching', () => {
    it('should match exact hostnames', () => {
      expect(isHostMatching('https://pbs.twimg.com/media/ABC', ['pbs.twimg.com'])).toBe(true);
      expect(isHostMatching('https://video.twimg.com/vid/123', ['video.twimg.com'])).toBe(true);
    });

    it('should reject non-matching hostnames', () => {
      expect(isHostMatching('https://evil.com/image.jpg', ['pbs.twimg.com'])).toBe(false);
    });

    it('should match subdomains when allowSubdomains is true', () => {
      expect(isHostMatching('https://cdn.pbs.twimg.com/media/ABC', ['pbs.twimg.com'], { allowSubdomains: true })).toBe(true);
    });

    it('should reject subdomains when allowSubdomains is false', () => {
      expect(isHostMatching('https://cdn.pbs.twimg.com/media/ABC', ['pbs.twimg.com'], { allowSubdomains: false })).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isHostMatching('https://PBS.TWIMG.COM/media/ABC', ['pbs.twimg.com'])).toBe(true);
    });

    it('should handle URL objects', () => {
      const url = new URL('https://pbs.twimg.com/media/ABC');
      expect(isHostMatching(url, ['pbs.twimg.com'])).toBe(true);
    });

    it('should reject null/undefined/invalid', () => {
      expect(isHostMatching(null, ['pbs.twimg.com'])).toBe(false);
      expect(isHostMatching(undefined, ['pbs.twimg.com'])).toBe(false);
      expect(isHostMatching('not-a-url', ['pbs.twimg.com'])).toBe(false);
    });

    it('should handle empty allowedHosts', () => {
      expect(isHostMatching('https://pbs.twimg.com/media/ABC', [])).toBe(false);
    });
  });

  // ── extractUsernameFromUrl ────────────────────────────────────────
  describe('extractUsernameFromUrl', () => {
    it('should extract username from twitter.com status URLs', () => {
      expect(extractUsernameFromUrl('https://twitter.com/john/status/123456')).toBe('john');
      expect(extractUsernameFromUrl('https://x.com/jane_doe/status/789')).toBe('jane_doe');
    });

    it('should extract username from relative paths', () => {
      expect(extractUsernameFromUrl('/username/status/123')).toBe('username');
    });

    it('should reject reserved paths', () => {
      expect(extractUsernameFromUrl('https://x.com/home/status/123')).toBeNull();
      expect(extractUsernameFromUrl('https://x.com/explore/status/123')).toBeNull();
      expect(extractUsernameFromUrl('https://x.com/notifications/status/123')).toBeNull();
      expect(extractUsernameFromUrl('https://x.com/i/status/123')).toBeNull();
    });

    it('should reject invalid username patterns', () => {
      expect(extractUsernameFromUrl('https://x.com/ab/status/123')).toBe('ab'); // 2 chars is valid
      expect(extractUsernameFromUrl('https://x.com/')).toBeNull();
    });

    it('should reject non-status paths', () => {
      expect(extractUsernameFromUrl('https://x.com/john')).toBeNull();
      expect(extractUsernameFromUrl('https://x.com/john/likes')).toBeNull();
    });

    it('should reject null/undefined/empty', () => {
      expect(extractUsernameFromUrl(null)).toBeNull();
      expect(extractUsernameFromUrl(undefined)).toBeNull();
      expect(extractUsernameFromUrl('')).toBeNull();
    });

    it('should enforce strict host validation', () => {
      expect(extractUsernameFromUrl('https://evil.com/john/status/123', { strictHost: true })).toBeNull();
      expect(extractUsernameFromUrl('https://twitter.com/john/status/123', { strictHost: true })).toBe('john');
      expect(extractUsernameFromUrl('https://x.com/john/status/123', { strictHost: true })).toBe('john');
    });

    it('should reject usernames longer than 15 characters', () => {
      const longName = 'a'.repeat(16);
      expect(extractUsernameFromUrl(`https://x.com/${longName}/status/123`)).toBeNull();
    });
  });
});
