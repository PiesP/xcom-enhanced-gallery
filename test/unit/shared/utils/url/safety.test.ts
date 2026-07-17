// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  isUrlAllowed,
  startsWithBlockedProtocolHint,
  MEDIA_URL_POLICY,
} from '@shared/utils/url/safety';

describe('url/safety', () => {
  // ── isUrlAllowed ──────────────────────────────────────────────────
  describe('isUrlAllowed', () => {
    it('should reject null/undefined/empty', () => {
      expect(isUrlAllowed(null, MEDIA_URL_POLICY)).toBe(false);
      expect(isUrlAllowed(undefined, MEDIA_URL_POLICY)).toBe(false);
      expect(isUrlAllowed('', MEDIA_URL_POLICY)).toBe(false);
    });

    it('should strip control characters and validate the remaining URL', () => {
      // CONTROL_CHARS_REGEX strips control chars, then the remaining URL is validated
      // 'https://example.com/\u0000image.jpg' → 'https://example.com/image.jpg' → allowed (https)
      expect(isUrlAllowed('https://example.com/\u0000image.jpg', MEDIA_URL_POLICY)).toBe(true);
      // 'https://example.com/\u001fimage.jpg' → 'https://example.com/image.jpg' → allowed
      expect(isUrlAllowed('https://example.com/\u001fimage.jpg', MEDIA_URL_POLICY)).toBe(true);
    });

    it('should reject URLs that become empty after control char stripping', () => {
      expect(isUrlAllowed('\u0000\u001f', MEDIA_URL_POLICY)).toBe(false);
    });

    it('should allow valid https URLs', () => {
      expect(isUrlAllowed('https://pbs.twimg.com/media/ABC?format=jpg', MEDIA_URL_POLICY)).toBe(true);
      expect(isUrlAllowed('https://video.twimg.com/ext_tw_video/123/pu/vid.mp4', MEDIA_URL_POLICY)).toBe(true);
    });

    it('should allow http URLs', () => {
      expect(isUrlAllowed('http://pbs.twimg.com/media/ABC?format=jpg', MEDIA_URL_POLICY)).toBe(true);
    });

    it('should reject non-http protocols', () => {
      expect(isUrlAllowed('ftp://example.com/image.jpg', MEDIA_URL_POLICY)).toBe(false);
    });

    it('should allow protocol-relative URLs', () => {
      expect(isUrlAllowed('//pbs.twimg.com/media/ABC?format=jpg', MEDIA_URL_POLICY)).toBe(true);
    });

    it('should allow relative URLs when policy permits', () => {
      expect(isUrlAllowed('/media/ABC?format=jpg', MEDIA_URL_POLICY)).toBe(true);
    });

    it('should reject relative URLs when policy forbids', () => {
      const strictPolicy = { ...MEDIA_URL_POLICY, allowRelative: false };
      expect(isUrlAllowed('/media/ABC?format=jpg', strictPolicy)).toBe(false);
    });

    it('should allow data URLs with image MIME (MEDIA_URL_POLICY defaults)', () => {
      // MEDIA_URL_POLICY has allowDataUrls: true and allowedDataMimePrefixes with image types
      expect(isUrlAllowed('data:image/png;base64,abc', MEDIA_URL_POLICY)).toBe(true);
      expect(isUrlAllowed('data:image/jpeg;base64,abc', MEDIA_URL_POLICY)).toBe(true);
    });

    it('should reject data URLs with non-image MIME', () => {
      expect(isUrlAllowed('data:text/html,<h1>hello</h1>', MEDIA_URL_POLICY)).toBe(false);
      expect(isUrlAllowed('data:application/json,{}', MEDIA_URL_POLICY)).toBe(false);
      expect(isUrlAllowed('data:video/mp4;base64,abc', MEDIA_URL_POLICY)).toBe(false);
    });

    it('should reject data URLs when allowDataUrls is false', () => {
      const noDataPolicy = { ...MEDIA_URL_POLICY, allowDataUrls: false };
      expect(isUrlAllowed('data:image/png;base64,abc', noDataPolicy)).toBe(false);
    });

    it('should treat fragments as relative URLs (allowed when allowRelative is true)', () => {
      // Fragment URLs like #section have no explicit scheme, so they fall through
      // to the allowRelative check. MEDIA_URL_POLICY has allowRelative: true.
      expect(isUrlAllowed('#section', MEDIA_URL_POLICY)).toBe(true);
    });

    it('should reject fragments when both allowFragments and allowRelative are false', () => {
      const strictPolicy = { ...MEDIA_URL_POLICY, allowFragments: false, allowRelative: false };
      expect(isUrlAllowed('#section', strictPolicy)).toBe(false);
    });

    it('should reject blocked protocol hints', () => {
      expect(isUrlAllowed('javascript:alert(1)', MEDIA_URL_POLICY)).toBe(false);
      expect(isUrlAllowed('vbscript:msgbox(1)', MEDIA_URL_POLICY)).toBe(false);
    });
  });

  // ── startsWithBlockedProtocolHint ─────────────────────────────────
  describe('startsWithBlockedProtocolHint', () => {
    const hints = ['javascript:', 'vbscript:', 'file:', 'data:text'] as const;

    it('should detect direct blocked protocols', () => {
      expect(startsWithBlockedProtocolHint('javascript:alert(1)', hints)).toBe(true);
      expect(startsWithBlockedProtocolHint('vbscript:msgbox(1)', hints)).toBe(true);
      expect(startsWithBlockedProtocolHint('file:///etc/passwd', hints)).toBe(true);
    });

    it('should detect URL-encoded obfuscation', () => {
      expect(startsWithBlockedProtocolHint('jav%61script:alert(1)', hints)).toBe(true);
    });

    it('should detect whitespace in scheme', () => {
      expect(startsWithBlockedProtocolHint('java script:alert(1)', hints)).toBe(true);
    });

    it('should reject incomplete percent-encoding', () => {
      expect(startsWithBlockedProtocolHint('test%GGvalue', hints)).toBe(true);
    });

    it('should allow safe protocols', () => {
      expect(startsWithBlockedProtocolHint('https://example.com', hints)).toBe(false);
      expect(startsWithBlockedProtocolHint('http://example.com', hints)).toBe(false);
    });

    it('should handle empty hints array', () => {
      expect(startsWithBlockedProtocolHint('javascript:alert(1)', [])).toBe(false);
    });
  });
});
