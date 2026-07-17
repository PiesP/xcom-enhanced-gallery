// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  isValidMediaUrl,
} from '@shared/utils/url/validator';

describe('url/validator', () => {
  // ── isValidMediaUrl ───────────────────────────────────────────────
  describe('isValidMediaUrl', () => {
    it('should accept valid pbs.twimg.com media URLs', () => {
      expect(isValidMediaUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')).toBe(true);
      expect(isValidMediaUrl('https://pbs.twimg.com/media/XYZ?format=png&name=large')).toBe(true);
    });

    it('should accept valid video.twimg.com URLs', () => {
      expect(isValidMediaUrl('https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/abc.mp4')).toBe(true);
      expect(isValidMediaUrl('https://video.twimg.com/tweet_video/ABC123.mp4')).toBe(true);
      expect(isValidMediaUrl('https://video.twimg.com/amplify_video/1234567890/vid/1280x720/abc.mp4')).toBe(true);
    });

    it('should accept thumbnail paths', () => {
      expect(isValidMediaUrl('https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/abc.jpg')).toBe(true);
      expect(isValidMediaUrl('https://pbs.twimg.com/tweet_video_thumb/ABC123.jpg')).toBe(true);
      expect(isValidMediaUrl('https://pbs.twimg.com/video_thumb/123/img/abc.jpg')).toBe(true);
      expect(isValidMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg')).toBe(true);
    });

    it('should accept card image paths', () => {
      expect(isValidMediaUrl('https://pbs.twimg.com/card_img/1234567890/abc?format=jpg')).toBe(true);
    });

    it('should accept DM video paths', () => {
      expect(isValidMediaUrl('https://video.twimg.com/dm_video/123/abc.mp4')).toBe(true);
    });

    it('should reject non-http protocols', () => {
      expect(isValidMediaUrl('ftp://pbs.twimg.com/media/ABC')).toBe(false);
      expect(isValidMediaUrl('file:///etc/passwd')).toBe(false);
    });

    it('should reject wrong hosts', () => {
      expect(isValidMediaUrl('https://evil.com/media/ABC')).toBe(false);
      expect(isValidMediaUrl('https://cdn.example.com/media/ABC')).toBe(false);
    });

    it('should reject profile image paths', () => {
      expect(isValidMediaUrl('https://pbs.twimg.com/profile_images/123/abc.jpg')).toBe(false);
    });

    it('should reject URLs exceeding max length', () => {
      const longUrl = 'https://pbs.twimg.com/media/' + 'A'.repeat(2040);
      expect(isValidMediaUrl(longUrl)).toBe(false);
    });

    it('should reject null/empty/invalid', () => {
      expect(isValidMediaUrl('')).toBe(false);
      expect(isValidMediaUrl('not-a-url')).toBe(false);
    });
  });
});
