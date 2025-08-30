/**
 * @fileoverview 사용자명 추출 함수 통합 테스트
 * @description extractUsername과 parseUsernameFast 통합
 */

/* eslint-env browser */
/* global document window performance */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractUsername,
  parseUsernameFast,
} from '@shared/services/media/UsernameExtractionService';
import { URLPatterns } from '@shared/utils/patterns/url-patterns';

describe('Username Extraction Unification - Phase 3 TDD', () => {
  beforeEach(() => {
    // Reset DOM state
    document.body.innerHTML = '';
    // Reset URL
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: 'https://x.com/',
      },
    });
  });

  describe('RED: 통합 완료 확인', () => {
    it('should confirm URLPatterns.extractUsername is removed', () => {
      // URLPatterns.extractUsername should no longer exist
      expect(URLPatterns.extractUsername).toBeUndefined();

      // Only service version should exist
      expect(extractUsername).toBeDefined();
      expect(parseUsernameFast).toBeDefined();
    });

    it('should verify service now handles URL extraction', () => {
      const testUrl = 'https://x.com/testuser/status/123456';

      // Service should now handle direct URL extraction
      const result = extractUsername(testUrl);
      expect(result.username).toBe('testuser');
      expect(result.method).toBe('url');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should verify fast extraction works with URLs', () => {
      const testUrl = 'https://x.com/johndoe/status/123456';

      // parseUsernameFast should also handle URLs
      const result = parseUsernameFast(testUrl);
      expect(result).toBe('johndoe');
    });
  });

  describe('GREEN: 통합 후 성능 요구사항', () => {
    it('should maintain performance standards after URL integration', async () => {
      const testUrl = 'https://x.com/testuser/status/123456';
      window.location.href = testUrl;

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        extractUsername();
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      // Should remain fast even with URL pattern integration
      expect(avgTime).toBeLessThan(1); // Less than 1ms per call
    });

    it('should maintain parseUsernameFast performance', async () => {
      const testUrl = 'https://x.com/fastuser';
      window.location.href = testUrl;

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        parseUsernameFast();
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(0.5); // Less than 0.5ms per call
    });
  });

  describe('REFACTOR: 통합된 동작 검증', () => {
    it('should extract username from URL patterns within service', () => {
      const testUrl = 'https://x.com/unifieduser/status/789012';
      window.location.href = testUrl;

      const result = extractUsername();

      // After integration, service should extract from URL
      expect(result.username).toBe('unifieduser');
      expect(result.method).toBe('url');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should maintain consistent API between functions', () => {
      const testUrl = 'https://x.com/consistent/status/345678';
      window.location.href = testUrl;

      const detailedResult = extractUsername();
      const fastResult = parseUsernameFast();

      // Both should extract the same username
      expect(detailedResult.username).toBe('consistent');
      expect(fastResult).toBe('consistent');
      expect(detailedResult.username).toBe(fastResult);
    });

    it('should handle edge cases consistently', () => {
      const edgeCases = [
        'https://x.com/i/flow/login', // system page
        'https://x.com/home', // system page
        'https://x.com/search', // system page
        'https://x.com/validuser123_', // valid username
      ];

      edgeCases.forEach(testUrl => {
        window.location.href = testUrl;

        const serviceResult = extractUsername();
        const fastResult = parseUsernameFast();

        // System pages should return null
        if (testUrl.includes('/i/') || testUrl.includes('/home') || testUrl.includes('/search')) {
          expect(serviceResult.username).toBeNull();
          expect(fastResult).toBeNull();
        } else {
          // Valid usernames should be extracted
          expect(serviceResult.username).toBeTruthy();
          expect(fastResult).toBeTruthy();
        }

        // Results should always be consistent
        expect(serviceResult.username).toBe(fastResult);
      });
    });
  });
});
