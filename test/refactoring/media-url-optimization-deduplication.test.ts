/**
 * @fileoverview Media URL 최적화 중복 제거 테스트
 * @description TDD로 중복 메서드 제거 및 단일 책임 원칙 적용
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MediaService } from '@shared/services/MediaService';

describe('Media URL Optimization Deduplication', () => {
  let mediaService;

  beforeEach(() => {
    mediaService = new MediaService();
  });

  describe('RED: 중복 메서드 제거 요구사항', () => {
    it('optimizeWebP 메서드가 getOptimizedImageUrl을 위임해야 함', () => {
      // Given: WebP 지원 환경
      const originalUrl = 'https://pbs.twimg.com/media/test.jpg';

      // When: optimizeWebP 호출
      const optimizedUrl = mediaService.optimizeWebP(originalUrl);

      // Then: getOptimizedImageUrl과 동일한 결과 반환
      const expectedUrl = mediaService.getOptimizedImageUrl(originalUrl);
      expect(optimizedUrl).toBe(expectedUrl);
    });

    it('optimizeTwitterImageUrl 메서드가 getOptimizedImageUrl을 위임해야 함', () => {
      // Given: 트위터 이미지 URL
      const originalUrl = 'https://pbs.twimg.com/media/test.png';

      // When: optimizeTwitterImageUrl 호출
      const optimizedUrl = mediaService.optimizeTwitterImageUrl(originalUrl);

      // Then: getOptimizedImageUrl과 동일한 결과 반환
      const expectedUrl = mediaService.getOptimizedImageUrl(originalUrl);
      expect(optimizedUrl).toBe(expectedUrl);
    });

    it('중복 메서드들이 deprecated 마킹되어야 함', () => {
      // Given: MediaService 인스턴스
      const service = mediaService;

      // When: 메서드 존재 확인
      // Then: deprecated 메서드들이 여전히 존재하지만 주석으로 표시됨
      expect(typeof service.optimizeWebP).toBe('function');
      expect(typeof service.optimizeTwitterImageUrl).toBe('function');

      // 실제 로직은 getOptimizedImageUrl과 동일해야 함
      const testUrl = 'https://pbs.twimg.com/media/test.jpg';
      expect(service.optimizeWebP(testUrl)).toBe(service.getOptimizedImageUrl(testUrl));
      expect(service.optimizeTwitterImageUrl(testUrl)).toBe(service.getOptimizedImageUrl(testUrl));
    });
  });

  describe('GREEN: 기존 기능 보장', () => {
    it('getOptimizedImageUrl이 WebP 최적화를 정확히 수행해야 함', () => {
      // Given: 트위터 이미지 URL (WebP 파라미터 없음)
      const originalUrl = 'https://pbs.twimg.com/media/test.jpg';

      // When: 최적화 수행
      const optimizedUrl = mediaService.getOptimizedImageUrl(originalUrl);

      // Then: WebP 파라미터 추가됨
      expect(optimizedUrl).toBe('https://pbs.twimg.com/media/test.jpg?format=webp');
    });

    it('이미 WebP 파라미터가 있는 URL은 변경하지 않아야 함', () => {
      // Given: 이미 WebP 파라미터가 있는 URL
      const originalUrl = 'https://pbs.twimg.com/media/test.jpg?format=webp';

      // When: 최적화 수행
      const optimizedUrl = mediaService.getOptimizedImageUrl(originalUrl);

      // Then: 변경되지 않음
      expect(optimizedUrl).toBe(originalUrl);
    });

    it('비 트위터 이미지는 변경하지 않아야 함', () => {
      // Given: 외부 이미지 URL
      const originalUrl = 'https://example.com/image.jpg';

      // When: 최적화 수행
      const optimizedUrl = mediaService.getOptimizedImageUrl(originalUrl);

      // Then: 변경되지 않음
      expect(optimizedUrl).toBe(originalUrl);
    });
  });

  describe('REFACTOR: 코드 품질 개선', () => {
    it('단일 최적화 로직으로 통합되어야 함', () => {
      // Given: 다양한 URL 패턴들
      const testUrls = [
        'https://pbs.twimg.com/media/test1.jpg',
        'https://pbs.twimg.com/media/test2.png?quality=large',
        'https://pbs.twimg.com/media/test3.webp',
        'https://example.com/external.jpg',
      ];

      // When & Then: 모든 메서드가 동일한 결과 반환
      testUrls.forEach(url => {
        const optimized = mediaService.getOptimizedImageUrl(url);
        const webpOptimized = mediaService.optimizeWebP(url);
        const twitterOptimized = mediaService.optimizeTwitterImageUrl(url);

        expect(webpOptimized).toBe(optimized);
        expect(twitterOptimized).toBe(optimized);
      });
    });
  });
});
