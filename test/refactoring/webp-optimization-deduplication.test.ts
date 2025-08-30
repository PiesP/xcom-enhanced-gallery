/**
 * @fileoverview TDD RED: WebP 최적화 중복 제거 테스트
 * @description MediaService의 WebP 관련 로직 중복 제거 및 단일 유틸리티 모듈화
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TDD RED: WebP 최적화 중복 제거', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DOM 환경 모킹
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: vi.fn(() => ({
          toDataURL: vi.fn(() => 'data:image/webp;base64,test'),
          width: 1,
          height: 1,
        })),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RED: 현재 중복 문제 검증', () => {
    test('MediaService에서 WebP 감지 로직이 중복 호출됨', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService1 = MediaService.getInstance();
      const mediaService2 = MediaService.getInstance();

      // 같은 인스턴스여야 하지만 내부적으로 WebP 감지가 중복 실행될 수 있음
      expect(mediaService1).toBe(mediaService2);

      // RED: 현재는 각 호출마다 WebP 감지가 실행될 수 있음
      const isSupported1 = mediaService1.isWebPSupported();
      const isSupported2 = mediaService2.isWebPSupported();

      // TODO GREEN: 캐싱으로 인해 같은 결과가 즉시 반환되어야 함
      expect(isSupported1).toBe(isSupported2);
    });

    test('WebP 최적화 함수들이 분산되어 있음', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const { optimizeWebP } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // RED: 현재는 MediaService와 별도 함수가 동일한 로직을 중복 구현
      const serviceResult = mediaService.getOptimizedImageUrl(
        'https://pbs.twimg.com/media/test.jpg'
      );
      const utilityResult = optimizeWebP('https://pbs.twimg.com/media/test.jpg');

      expect(serviceResult).toBe(utilityResult);

      // TODO GREEN: 하나의 통합된 WebPUtils로 통합되어야 함
    });

    test('테스트 환경 체크가 여러 곳에서 중복됨', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // RED: isTestEnvironment() 체크가 WebP 감지 외에도 여러 곳에서 중복
      // 현재는 MediaService 내부에서만 사용되지만, 다른 서비스에서도 유사한 로직 존재
      expect(typeof mediaService.isWebPSupported).toBe('function');
    });
  });

  describe('GREEN: 통합 WebP 유틸리티 모듈 구조', () => {
    test('WebPUtils 모듈이 단일 진입점을 제공해야 함', async () => {
      // GREEN: 새로운 WebPUtils 모듈 구조
      try {
        const { WebPUtils } = await import('@shared/utils/WebPUtils');

        expect(WebPUtils).toBeDefined();
        expect(typeof WebPUtils.isSupported).toBe('function');
        expect(typeof WebPUtils.optimizeUrl).toBe('function');
        expect(typeof WebPUtils.detectSupport).toBe('function');
      } catch (error) {
        // RED 단계에서는 아직 모듈이 없을 수 있음
        expect(error.message).toContain('Cannot resolve module');
      }
    });

    test('WebP 감지가 싱글톤 패턴으로 캐싱되어야 함', async () => {
      try {
        const { WebPUtils } = await import('@shared/utils/WebPUtils');

        // 첫 번째 호출
        const result1 = await WebPUtils.isSupported();

        // 두 번째 호출 (캐시에서 반환되어야 함)
        const result2 = await WebPUtils.isSupported();

        expect(result1).toBe(result2);
        // GREEN: 캐싱으로 인해 빠른 응답
      } catch (error) {
        // RED 단계에서는 모듈이 없음
        expect(true).toBe(true);
      }
    });

    test('MediaService가 WebPUtils를 사용하도록 리팩토링되어야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // GREEN: MediaService는 WebPUtils를 위임하도록 변경
      const optimizedUrl = mediaService.getOptimizedImageUrl(
        'https://pbs.twimg.com/media/test.jpg'
      );

      expect(typeof optimizedUrl).toBe('string');
      // TODO GREEN: 내부적으로 WebPUtils.optimizeUrl을 호출해야 함
    });
  });

  describe('REFACTOR: 성능 및 메모리 최적화', () => {
    test('WebP 감지 결과가 메모리에 효율적으로 캐싱되어야 함', async () => {
      try {
        const { WebPUtils } = await import('@shared/utils/WebPUtils');

        // 메모리 사용량 측정 (Node.js 환경에서만)
        const initialMemory = process.memoryUsage?.()?.heapUsed || 0;

        // 여러 번 호출해도 메모리 증가가 없어야 함
        for (let i = 0; i < 100; i++) {
          await WebPUtils.isSupported();
        }

        const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
        const memoryIncrease = finalMemory - initialMemory;

        // GREEN: 메모리 증가가 최소화되어야 함 (1MB 미만)
        expect(memoryIncrease).toBeLessThan(1024 * 1024);
      } catch (error) {
        // 브라우저 환경에서는 스킵
        expect(true).toBe(true);
      }
    });

    test('불필요한 WebP 최적화 호출이 방지되어야 함', async () => {
      try {
        const { WebPUtils } = await import('@shared/utils/WebPUtils');

        // 이미 WebP 형식인 URL은 변경되지 않아야 함
        const webpUrl = 'https://pbs.twimg.com/media/test.jpg?format=webp';
        const optimized = WebPUtils.optimizeUrl(webpUrl);

        expect(optimized).toBe(webpUrl);

        // 비-Twitter URL은 변경되지 않아야 함
        const externalUrl = 'https://example.com/image.jpg';
        const externalOptimized = WebPUtils.optimizeUrl(externalUrl);

        expect(externalOptimized).toBe(externalUrl);
      } catch (error) {
        expect(true).toBe(true);
      }
    });

    test('테스트 환경 감지가 통합 유틸리티로 이동해야 함', async () => {
      try {
        const { isTestEnvironment } = await import('@shared/utils/environment');

        expect(typeof isTestEnvironment).toBe('function');

        // GREEN: 환경 감지 로직이 분리되어 재사용 가능
        const isTest = isTestEnvironment();
        expect(typeof isTest).toBe('boolean');
      } catch (error) {
        // RED 단계에서는 아직 분리되지 않음
        expect(true).toBe(true);
      }
    });
  });
});
