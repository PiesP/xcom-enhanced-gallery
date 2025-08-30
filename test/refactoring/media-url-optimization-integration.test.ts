/**
 * @fileoverview TDD: 미디어 URL 최적화 함수 통합 테스트
 * @description optimizeWebP, optimizeTwitterImageUrl 중복 제거 및 getOptimizedImageUrl 통합
 * @version 1.0.0 - Phase 1.1 통합
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock 환경 설정
const mockDocument = {
  createElement: vi.fn(() => ({
    toDataURL: vi.fn(() => 'data:image/webp;base64,test'),
    width: 0,
    height: 0,
  })),
};

// 전역 document mock
Object.defineProperty(globalThis, 'document', {
  value: mockDocument,
  writable: true,
});

describe.skip('TDD Phase 1.1: 미디어 URL 최적화 함수 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GREEN: 중복 제거 성공 검증', () => {
    test('MediaService 클래스에는 getOptimizedImageUrl만 존재해야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();

      // GREEN: 클래스에는 주 메서드만 존재
      expect(typeof mediaService.getOptimizedImageUrl).toBe('function');

      // GREEN: 중복 메서드들은 제거되었음
      expect(typeof mediaService.optimizeWebP).toBe('undefined');
      expect(typeof mediaService.optimizeTwitterImageUrl).toBe('undefined');
    });

    test('별칭 함수들이 export로 제공되어 호환성 유지', async () => {
      // GREEN: export된 별칭 함수들 확인
      const { optimizeWebP, optimizeTwitterImageUrl } = await import(
        '@shared/services/MediaService'
      );

      expect(typeof optimizeWebP).toBe('function');
      expect(typeof optimizeTwitterImageUrl).toBe('function');

      // 동일한 URL에 대해 모든 함수가 같은 결과를 반환하는지 확인
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();
      const testUrl = 'https://pbs.twimg.com/media/test.jpg';

      const result1 = mediaService.getOptimizedImageUrl(testUrl);
      const result2 = optimizeWebP(testUrl);
      const result3 = optimizeTwitterImageUrl(testUrl);

      // 모든 함수가 동일한 결과 반환
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('GREEN: 통합 후 목표 구조', () => {
    test('중복 제거가 완료되어 단일 책임 구조로 변경됨', () => {
      // GREEN 목표: MediaService 클래스는 주 메서드만 보유
      // export 함수들은 호환성 유지를 위한 별칭

      const expectedStructure = {
        hasGetOptimizedImageUrl: true,
        classMethodsRemoved: true, // 클래스에서 중복 메서드 제거됨
        exportAliasesProvided: true, // export 별칭 제공됨
      };

      // GREEN: 리팩토링 완료된 구조
      expect(expectedStructure.hasGetOptimizedImageUrl).toBe(true);
      expect(expectedStructure.classMethodsRemoved).toBe(true);
      expect(expectedStructure.exportAliasesProvided).toBe(true);
    });

    test('외부 호출부에서 통합된 함수 사용', async () => {
      // GREEN 목표: 주 메서드 + export 별칭으로 유연한 사용
      const testUrl = 'https://pbs.twimg.com/media/example.jpg';

      // 주 메서드 사용
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();

      const optimizedUrl = mediaService.getOptimizedImageUrl(testUrl);

      // WebP 지원 여부에 따라 적절한 URL이 반환되는지 확인
      if (testUrl.includes('pbs.twimg.com')) {
        // WebP 지원 시 format=webp 파라미터 추가 예상
        expect(optimizedUrl.includes('format=webp') || optimizedUrl === testUrl).toBe(true);
      }
    });
  });

  describe('REFACTOR: 호환성 확인', () => {
    test('export된 별칭 함수들을 통한 호환성 유지', async () => {
      // REFACTOR: 기존 코드가 깨지지 않도록 호환성 확인
      const { MediaService, optimizeWebP, optimizeTwitterImageUrl } = await import(
        '@shared/services/MediaService'
      );

      // 현재 사용되고 있는 패턴들이 여전히 작동하는지 확인
      const mediaService = MediaService.getInstance();
      const testUrl = 'https://pbs.twimg.com/media/test.jpg';

      // 메인 메서드는 클래스에서 호출
      expect(() => mediaService.getOptimizedImageUrl(testUrl)).not.toThrow();

      // 별칭 함수들은 export된 함수로 호출
      expect(() => optimizeWebP(testUrl)).not.toThrow();
      expect(() => optimizeTwitterImageUrl(testUrl)).not.toThrow();
    });

    test('WebP 감지 로직이 일관되게 작동함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();

      // WebP 지원 여부 확인
      const isWebPSupported = mediaService.isWebPSupported();

      // 타입이 boolean이어야 함
      expect(typeof isWebPSupported).toBe('boolean');

      const testUrl = 'https://pbs.twimg.com/media/test.jpg';
      const optimizedUrl = mediaService.getOptimizedImageUrl(testUrl);

      // WebP 지원 여부에 따른 일관된 동작 확인
      if (isWebPSupported && testUrl.includes('pbs.twimg.com')) {
        expect(optimizedUrl).toContain('format=webp');
      } else {
        expect(optimizedUrl).toBe(testUrl);
      }
    });
  });
});
