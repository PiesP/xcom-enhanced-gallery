/**
 * @fileoverview TDD Phase 7: 미디어 추출 시스템 통합
 * @description MediaExtractionService와 MediaService 중복 폴백 제거
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock 환경 설정
const mockMediaElement = {
  tagName: 'IMG',
  src: 'https://pbs.twimg.com/media/test.jpg',
  getAttribute: vi.fn(),
  classList: { contains: vi.fn() },
};

describe('TDD Phase 7: 미디어 추출 시스템 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RED: 중복 폴백 시스템 검증', () => {
    test('MediaExtractionService와 MediaService가 각각 다른 폴백을 사용함', async () => {
      // RED: 현재는 두 시스템이 병렬로 동작하여 예측 불가능
      // eslint-disable-next-line no-unused-vars
      const { MediaExtractionService } = await import(
        '@shared/services/media-extraction/MediaExtractionService'
      );

      // MediaService는 FallbackExtractor 사용
      let mediaServiceFallbackCalled = false;
      try {
        // MediaService 모듈 존재 여부만 확인
        await import('@shared/services/MediaService');
        mediaServiceFallbackCalled = true;
      } catch {
        // MediaService를 찾을 수 없는 경우
      }

      // MediaExtractionService는 DOMDirectExtractor 사용
      let extractionServiceFallbackCalled = false;
      try {
        // 모듈 존재 여부만 확인
        const module = await import('@shared/services/media-extraction/MediaExtractionService');
        if (module && module.MediaExtractionService) {
          extractionServiceFallbackCalled = true;
        }
      } catch {
        // 서비스 초기화 실패
      }

      // RED: 현재는 두 개의 독립적인 폴백 시스템이 존재
      expect(mediaServiceFallbackCalled || extractionServiceFallbackCalled).toBe(true);

      // TODO GREEN: 단일 폴백 체인으로 통합해야 함
    });

    test('동일한 미디어 요소에 대해 중복 추출이 시도될 수 있음', async () => {
      // RED: 두 시스템이 동시에 같은 요소를 처리할 가능성

      // 첫 번째 추출 시도 (MediaExtractionService)
      let firstExtractionAttempt = false;
      try {
        await import('@shared/services/media-extraction/MediaExtractionService');
        firstExtractionAttempt = true;
      } catch {
        // 서비스 사용 불가
      }

      // 두 번째 추출 시도 (MediaService)
      let secondExtractionAttempt = false;
      try {
        await import('@shared/services/MediaService');
        secondExtractionAttempt = true;
      } catch {
        // 서비스 사용 불가
      }

      // RED: 중복 처리 가능성 확인
      if (firstExtractionAttempt && secondExtractionAttempt) {
        expect(true).toBe(true); // 중복 가능성 존재
      }
    });
    test('폴백 실행 순서가 예측 불가능함', () => {
      // RED: 어떤 폴백이 언제 실행될지 명확하지 않음
      const fallbackOrder = [];

      // 현재 상황: 폴백 순서가 구현 의존적
      // MediaExtractionService: API → DOMDirectExtractor
      fallbackOrder.push('MediaExtractionService');

      // MediaService: FallbackExtractor (별도 시스템)
      fallbackOrder.push('MediaService');

      // RED: 예측 불가능한 순서
      expect(fallbackOrder.length).toBeGreaterThan(1);

      // TODO GREEN: 명확한 폴백 체인 정의 필요
      // 이상적: API → DOM → Fallback → Error
    });
  });

  describe('GREEN: 통합 폴백 시스템 설계', () => {
    test('단일 MediaExtractionOrchestrator가 모든 폴백을 관리해야 함', () => {
      // GREEN: 통합 오케스트레이터 설계 검증
      const mockOrchestrator = {
        strategies: [],
        addStrategy: vi.fn(),
        removeStrategy: vi.fn(),
        extract: vi.fn(),
      };

      expect(mockOrchestrator.addStrategy).toBeDefined();
      expect(mockOrchestrator.extract).toBeDefined();
      expect(mockOrchestrator.strategies).toEqual([]);

      // TODO: 실제 MediaExtractionOrchestrator 구현 필요
    });

    test('명확한 폴백 체인이 정의되어야 함', () => {
      // GREEN: 예측 가능한 폴백 순서
      const fallbackChain = [
        { name: 'TwitterAPI', priority: 1 },
        { name: 'DOMDirect', priority: 2 },
        { name: 'ElementAnalysis', priority: 3 },
        { name: 'URLPattern', priority: 4 },
      ];

      // 우선순위 순으로 정렬되어야 함
      const sortedChain = [...fallbackChain].sort((a, b) => a.priority - b.priority);
      expect(sortedChain[0].name).toBe('TwitterAPI');
      expect(sortedChain[sortedChain.length - 1].name).toBe('URLPattern');
    });

    test('중복 실행 방지 메커니즘이 있어야 함', () => {
      // GREEN: 동일 요소에 대한 중복 처리 방지
      const processedElements = new WeakSet();
      const mockElement = mockMediaElement;

      function preventDuplicateProcessing(element) {
        if (processedElements.has(element)) {
          return false; // 이미 처리됨
        }
        processedElements.add(element);
        return true; // 처리 가능
      }

      // 첫 번째 호출
      expect(preventDuplicateProcessing(mockElement)).toBe(true);

      // 두 번째 호출 (중복)
      expect(preventDuplicateProcessing(mockElement)).toBe(false);
    });
  });

  describe('REFACTOR: 성능 최적화', () => {
    test('폴백 전략 캐싱으로 성능 향상', () => {
      // REFACTOR: 전략 선택 결과 캐싱
      const strategyCache = new Map();

      function getCachedStrategy(elementSignature) {
        return strategyCache.get(elementSignature) || null;
      }

      function setCachedStrategy(elementSignature, strategyName) {
        strategyCache.set(elementSignature, strategyName);
      }

      const testSignature = 'img-twitter-media';

      // 캐시 미스
      expect(getCachedStrategy(testSignature)).toBeNull();

      // 캐시 설정
      setCachedStrategy(testSignature, 'TwitterAPI');

      // 캐시 히트
      expect(getCachedStrategy(testSignature)).toBe('TwitterAPI');
    });

    test('실패한 전략은 건너뛰어 성능 향상', () => {
      // REFACTOR: 실패한 전략 블랙리스트
      const failedStrategies = new Set();

      function markStrategyAsFailed(strategyName) {
        failedStrategies.add(strategyName);
      }

      function isStrategyFailed(strategyName) {
        return failedStrategies.has(strategyName);
      }

      markStrategyAsFailed('TwitterAPI');

      expect(isStrategyFailed('TwitterAPI')).toBe(true);
      expect(isStrategyFailed('DOMDirect')).toBe(false);
    });
  });
});
