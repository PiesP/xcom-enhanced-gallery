/**
 * @fileoverview URL Sanitization Hardening Contract Tests (Phase 1: RED)
 * @description CodeQL js/incomplete-url-substring-sanitization 경고 재현
 *
 * Epic: CODEQL-SECURITY-HARDENING
 * Issue: js/incomplete-url-substring-sanitization (4건)
 * 목표: includes('twimg.com') 방식의 불완전한 URL 검증을 안전한 hostname 체크로 대체
 */

import { describe, it, expect } from 'vitest';
import {
  createMediaInfoFromVideo,
  createMediaInfoFromImage,
} from '@shared/utils/media/media-url.util';

describe('URL Sanitization Hardening (CodeQL)', () => {
  describe('Video URL Validation', () => {
    it('should reject malicious URL with twimg.com in path', () => {
      // 공격 벡터: 경로에 twimg.com이 포함된 악의적 URL
      const maliciousVideo = document.createElement('video');
      maliciousVideo.src = 'https://evil.com/twimg.com/malicious.js';
      maliciousVideo.poster = 'https://pbs.twimg.com/media/valid.jpg';

      const result = createMediaInfoFromVideo(maliciousVideo, 'test-tweet-1', 0);

      // 기대: 악의적 src는 거부되어야 함
      expect(result).toBeNull();
    });

    it('should reject malicious URL with twimg.com subdomain spoofing', () => {
      // 공격 벡터: 서브도메인 스푸핑 (twimg.com.evil.com)
      const maliciousVideo = document.createElement('video');
      maliciousVideo.src = 'https://twimg.com.evil.com/malicious.mp4';
      maliciousVideo.poster = '';

      const result = createMediaInfoFromVideo(maliciousVideo, 'test-tweet-2', 0);

      // 기대: 서브도메인 스푸핑은 거부되어야 함
      expect(result).toBeNull();
    });

    it('should reject malicious poster URL with path injection', () => {
      // 공격 벡터: poster URL 경로 주입
      const maliciousVideo = document.createElement('video');
      maliciousVideo.src = '';
      maliciousVideo.poster = 'https://attacker.com/pbs.twimg.com/fake.jpg';

      const result = createMediaInfoFromVideo(maliciousVideo, 'test-tweet-3', 0);

      // 기대: 악의적 poster는 거부되어야 함
      expect(result).toBeNull();
    });

    it('should accept legitimate Twitter media URLs', () => {
      // 정상 케이스: 실제 Twitter 미디어 URL
      const legitimateVideo = document.createElement('video');
      legitimateVideo.src = 'https://video.twimg.com/ext_tw_video/123/pu/vid/720x1280/abc.mp4';
      legitimateVideo.poster = 'https://pbs.twimg.com/media/xyz.jpg';

      const result = createMediaInfoFromVideo(legitimateVideo, 'test-tweet-4', 0);

      // 기대: 정상 URL은 허용되어야 함
      expect(result).not.toBeNull();
      expect(result?.url).toContain('video.twimg.com');
    });
  });

  describe('Image URL Validation', () => {
    it('should reject malicious image URL with hostname spoofing', () => {
      // 공격 벡터: 이미지 URL 호스트명 스푸핑
      const maliciousImage = document.createElement('img');
      maliciousImage.src = 'https://pbs-twimg-com.evil.com/media/fake.jpg';
      maliciousImage.alt = 'Malicious Image';
      maliciousImage.width = 1200;
      maliciousImage.height = 800;

      const result = createMediaInfoFromImage(maliciousImage, 'test-tweet-5', 0);

      // 기대: 호스트명 스푸핑은 거부되어야 함
      expect(result).toBeNull();
    });

    it('should reject image URL with query parameter injection', () => {
      // 공격 벡터: 쿼리 파라미터를 통한 주입
      const maliciousImage = document.createElement('img');
      maliciousImage.src =
        'https://evil.com/image.jpg?redirect=https://pbs.twimg.com/media/real.jpg';
      maliciousImage.alt = 'Injected Image';
      maliciousImage.width = 1200;
      maliciousImage.height = 800;

      const result = createMediaInfoFromImage(maliciousImage, 'test-tweet-6', 0);

      // 기대: 쿼리 파라미터 주입은 거부되어야 함
      expect(result).toBeNull();
    });

    it('should accept legitimate Twitter image URLs', () => {
      // 정상 케이스: 실제 Twitter 이미지 URL
      const legitimateImage = document.createElement('img');
      legitimateImage.src = 'https://pbs.twimg.com/media/abc123.jpg?format=jpg&name=large';
      legitimateImage.alt = 'Legitimate Image';
      legitimateImage.width = 1200;
      legitimateImage.height = 800;

      const result = createMediaInfoFromImage(legitimateImage, 'test-tweet-7', 0);

      // 기대: 정상 URL은 허용되어야 함
      expect(result).not.toBeNull();
      expect(result?.url).toContain('pbs.twimg.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty URLs gracefully', () => {
      const emptyVideo = document.createElement('video');
      emptyVideo.src = '';
      emptyVideo.poster = '';

      const result = createMediaInfoFromVideo(emptyVideo, 'test-tweet-8', 0);

      // 현재 구현은 빈 URL을 기본 URL로 폴백하므로 null이 아닐 수 있음
      // 하지만 신뢰할 수 있는 호스트가 아닌 경우 거부되어야 함
      if (result !== null) {
        // 폴백 URL도 신뢰할 수 있는 호스트여야 함
        expect(result.url).toMatch(/twimg\.com|x\.com|twitter\.com/);
      }
    });

    it('should reject data URLs', () => {
      const dataUrlImage = document.createElement('img');
      dataUrlImage.src = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      dataUrlImage.alt = 'Data URL';
      dataUrlImage.width = 100;
      dataUrlImage.height = 100;

      const result = createMediaInfoFromImage(dataUrlImage, 'test-tweet-9', 0);

      expect(result).toBeNull();
    });

    it('should reject blob URLs', () => {
      const blobUrlImage = document.createElement('img');
      blobUrlImage.src = 'blob:https://x.com/abc-123-def-456';
      blobUrlImage.alt = 'Blob URL';
      blobUrlImage.width = 100;
      blobUrlImage.height = 100;

      const result = createMediaInfoFromImage(blobUrlImage, 'test-tweet-10', 0);

      expect(result).toBeNull();
    });
  });
});
