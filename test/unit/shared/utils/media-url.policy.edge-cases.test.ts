/**
 * Phase 3 — 미디어 URL 정책 엔진 v2 (RED)
 * 엣지 케이스: 중복 name 파라미터, 확장자 보존, video_thumb ID 지원
 */

import { describe, it, expect } from 'vitest';
import {
  extractOriginalImageUrl,
  isValidMediaUrl,
  generateOriginalUrl,
} from '@shared/utils/media/media-url.util';

describe('Media URL Policy — Edge Cases', () => {
  describe('Duplicate query params', () => {
    it('should ensure single name=orig and preserve existing format', () => {
      const input = 'https://pbs.twimg.com/media/AbCdEf.jpg?format=png&name=large&name=small';
      const result = extractOriginalImageUrl(input);

      // 하나의 name=orig만 존재
      const nameCount = (result.match(/name=orig/g) || []).length;
      expect(nameCount).toBe(1);

      // format=png 유지 및 확장자 보존
      expect(result).toContain('format=png');
      expect(result).toContain('/media/AbCdEf.jpg');
    });
  });

  describe('Video thumbnail support', () => {
    it('should treat ext_tw_video_thumb as valid media URL', () => {
      const url = 'https://pbs.twimg.com/ext_tw_video_thumb/123456789/pu/img/abcdef.jpg?name=small';
      expect(isValidMediaUrl(url)).toBe(true);
    });

    it('should treat tweet_video_thumb as valid media URL', () => {
      const url = 'https://pbs.twimg.com/tweet_video_thumb/abcdef.jpg?name=small';
      expect(isValidMediaUrl(url)).toBe(true);
    });

    it('should generate original media URL from video_thumb URL with jpg default', () => {
      const thumbUrl = 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/ZZYYXX.jpg?name=small';
      const orig = generateOriginalUrl(thumbUrl);
      expect(orig).toBe('https://pbs.twimg.com/media/ZZYYXX?format=jpg&name=orig');
    });
  });
});
