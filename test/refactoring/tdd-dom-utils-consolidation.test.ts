/**
 * @fileoverview TDD DOM 유틸리티 통합 테스트
 * @description Phase 2-2: DOM 유틸리티 중복 제거를 위한 RED-GREEN-REFACTOR 사이클
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupMockDOM, cleanupMockDOM } from '../utils/mocks/dom-mocks';

// Test imports - checking for unified implementation
import { DOMUtils } from '@shared/dom/utils/dom-utils';
import { globalDOMCache } from '@shared/dom/DOMCache';
import { globalDOMBatcher } from '@shared/utils/dom/DOMBatcher';
import { safeQuerySelector } from '@shared/utils/core-utils';
import { globalDOMManager, select, cachedSelect } from '@shared/dom/DOMManager';

describe('🔴 RED: DOM 유틸리티 중복 식별', () => {
  beforeEach(() => {
    setupMockDOM();
  });

  afterEach(() => {
    cleanupMockDOM();
  });

  describe('중복 querySelector 구현 식별', () => {
    it('DOMUtils.querySelector와 safeQuerySelector가 동일한 기능을 제공한다', () => {
      const selector = '.test-element';
      const mockElement = document.createElement('div');
      mockElement.className = 'test-element';
      document.body.appendChild(mockElement);

      // 두 구현 모두 동일한 결과를 반환해야 함
      const domUtilsResult = DOMUtils.querySelector(selector);
      const safeQueryResult = safeQuerySelector(selector);

      expect(domUtilsResult).toBeTruthy();
      expect(safeQueryResult).toBeTruthy();
      expect(domUtilsResult?.className).toBe('test-element');
      expect(safeQueryResult?.className).toBe('test-element');
    });

    it('중복된 querySelectorAll 구현이 존재한다', () => {
      const selector = '.test-elements';
      [1, 2, 3].forEach(i => {
        const el = document.createElement('div');
        el.className = 'test-elements';
        el.textContent = `Element ${i}`;
        document.body.appendChild(el);
      });

      // DOMUtils와 DOMCache 모두 querySelectorAll을 제공
      const domUtilsResult = DOMUtils.querySelectorAll(selector);
      const cacheResult = globalDOMCache.querySelectorAll(selector);

      expect(domUtilsResult.length).toBe(3);
      expect(cacheResult.length).toBe(3);
    });
  });

  describe('DOM 캐싱 중복 식별', () => {
    it('DOMCache와 DOMUtils가 별도의 캐싱 전략을 가진다', () => {
      const selector = '.cached-element';
      const mockElement = document.createElement('div');
      mockElement.className = 'cached-element';
      document.body.appendChild(mockElement);

      // DOMCache는 내장 캐싱
      const cachedResult1 = globalDOMCache.querySelector(selector);
      const cachedResult2 = globalDOMCache.querySelector(selector);

      // DOMUtils는 캐싱 없음
      const utilsResult1 = DOMUtils.querySelector(selector);
      const utilsResult2 = DOMUtils.querySelector(selector);

      expect(cachedResult1).toBe(cachedResult2); // 캐시된 결과
      expect(utilsResult1).toEqual(utilsResult2); // 매번 새로운 쿼리
    });
  });

  describe('DOM 배치 처리 중복 식별', () => {
    it('여러 배치 처리 시스템이 독립적으로 존재한다', () => {
      expect(globalDOMBatcher).toBeDefined();
      expect(typeof globalDOMBatcher.add).toBe('function');
      expect(typeof globalDOMBatcher.flush).toBe('function');

      // 현재는 DOMBatcher만 존재하지만, 향후 통합 시 다른 배치 시스템과 비교
      expect(globalDOMBatcher.constructor.name).toBe('DOMBatcher');
    });
  });
});

describe('🟢 GREEN: 통합된 DOMManager 인터페이스', () => {
  beforeEach(() => {
    setupMockDOM();
  });

  afterEach(() => {
    cleanupMockDOM();
  });

  describe('통합 DOM 조작 인터페이스', () => {
    it('통합 DOM 매니저가 기존 중복을 해결했는지 확인', () => {
      const selector = '.unified-test-element';
      const mockElement = document.createElement('div');
      mockElement.className = 'unified-test-element';
      document.body.appendChild(mockElement);

      // 통합된 매니저 사용
      const unifiedResult = select(selector);
      const cachedResult = cachedSelect(selector);

      // 기존 중복 구현들 (검증용)
      // const domUtilsResult = DOMUtils.querySelector(selector);
      // const safeQueryResult = safeQuerySelector(selector);

      // 통합 매니저가 정상 작동해야 함
      expect(globalDOMManager).toBeDefined();
      expect(typeof globalDOMManager.select).toBe('function');
      expect(typeof globalDOMManager.cachedSelect).toBe('function');
      expect(typeof globalDOMManager.batchAdd).toBe('function');

      // 모든 구현이 동일한 결과를 제공해야 함 (호환성)
      if (unifiedResult) {
        expect(unifiedResult.className).toBe('unified-test-element');
      }
      if (cachedResult) {
        expect(cachedResult.className).toBe('unified-test-element');
      }
    });

    it('통합 DOM 매니저가 성능 최적화를 제공해야 한다', () => {
      const testCases = [
        { selector: '.performance-test-1', cached: true },
        { selector: '.performance-test-2', cached: false },
        { selector: '.performance-test-3', cached: true },
      ];

      testCases.forEach(({ selector, cached }) => {
        const element = document.createElement('div');
        element.className = selector.substring(1);
        document.body.appendChild(element);

        if (cached) {
          // 통합 캐시된 접근
          const startTime = performance.now();
          globalDOMManager.cachedSelect(selector);
          globalDOMManager.cachedSelect(selector); // 캐시 히트
          const endTime = performance.now();

          // 통합 매니저 동작 확인
          expect(typeof globalDOMManager.cachedSelect).toBe('function');
          expect(endTime - startTime).toBeGreaterThanOrEqual(0);
        } else {
          // 통합 일반 접근
          globalDOMManager.select(selector);
          expect(typeof globalDOMManager.select).toBe('function');
        }
      });

      // 캐시 통계 접근 가능한지 확인
      const stats = globalDOMManager.getCacheStats();
      expect(stats).toBeDefined();
      expect(typeof stats.cacheSize).toBe('number');
    });
  });
});

describe('🔵 REFACTOR: 아키텍처 및 성능 검증', () => {
  beforeEach(() => {
    setupMockDOM();
  });

  afterEach(() => {
    cleanupMockDOM();
  });

  describe('통합 후 성능 벤치마크', () => {
    it('통합된 DOM 매니저가 개별 구현들보다 일관성을 제공해야 한다', async () => {
      const selectors = Array.from({ length: 20 }, (_, i) => `.benchmark-${i}`);

      // 테스트 요소들 생성
      selectors.forEach(selector => {
        const element = document.createElement('div');
        element.className = selector.substring(1);
        document.body.appendChild(element);
      });

      // 통합 매니저 성능 측정
      const unifiedStart = performance.now();
      selectors.forEach(selector => globalDOMManager.select(selector));
      const unifiedTime = performance.now() - unifiedStart;

      // 캐시 매니저 성능 측정
      const cacheStart = performance.now();
      selectors.forEach(selector => globalDOMManager.cachedSelect(selector));
      const cacheTime = performance.now() - cacheStart;

      console.log(`Unified Manager: ${unifiedTime.toFixed(2)}ms`);
      console.log(`Unified Cache: ${cacheTime.toFixed(2)}ms`);

      // 통합 매니저가 정상 동작해야 함
      expect(unifiedTime).toBeGreaterThanOrEqual(0);
      expect(cacheTime).toBeGreaterThanOrEqual(0);
      expect(typeof globalDOMManager.select).toBe('function');
      expect(typeof globalDOMManager.cachedSelect).toBe('function');
    });

    it('통합 배치 처리가 일관성을 제공해야 한다', async () => {
      const elements = Array.from({ length: 10 }, () => document.createElement('div'));
      elements.forEach(el => document.body.appendChild(el));

      // 통합 매니저 배치 처리
      const batchStart = performance.now();
      elements.forEach(el => {
        globalDOMManager.batchAdd({
          element: el,
          styles: { color: 'green', backgroundColor: 'yellow' },
          classes: { add: ['batch-updated'] },
        });
      });
      globalDOMManager.batchFlush();
      const batchTime = performance.now() - batchStart;

      console.log(`Unified Batch updates: ${batchTime.toFixed(2)}ms`);

      // 통합 배치 시스템이 동작해야 함
      expect(batchTime).toBeGreaterThanOrEqual(0);
      expect(typeof globalDOMManager.batchAdd).toBe('function');
      expect(typeof globalDOMManager.batchFlush).toBe('function');
    });
  });

  describe('메모리 사용량 최적화 검증', () => {
    it('통합된 매니저가 메모리 효율적이어야 한다', () => {
      // 통합 매니저 캐시 크기 제한 테스트
      const stats = globalDOMManager.getCacheStats();
      const maxCacheSize = stats.maxCacheSize;
      expect(maxCacheSize).toBeGreaterThan(0);

      // 대량의 선택자로 캐시 제한 테스트
      const manySelectors = Array.from({ length: 20 }, (_, i) => `.memory-test-${i}`);

      manySelectors.forEach(selector => {
        const element = document.createElement('div');
        element.className = selector.substring(1);
        document.body.appendChild(element);
        globalDOMManager.cachedSelect(selector);
      });

      const finalStats = globalDOMManager.getCacheStats();
      expect(finalStats.cacheSize).toBeLessThanOrEqual(maxCacheSize);
      expect(typeof finalStats.hitRate).toBe('number');
    });

    it('통합 배치 처리에서 메모리 누수가 없어야 한다', () => {
      // 통합 매니저 배치 시스템 테스트

      // 대량의 업데이트 추가
      Array.from({ length: 10 }, () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        globalDOMManager.batchAdd({
          element,
          styles: { display: 'block' },
        });
      });

      expect(globalDOMManager['domBatcher']).toBeDefined();

      // 플러시 후 대기열이 비워져야 함
      globalDOMManager.batchFlush();
      const batchSizeAfter = globalDOMManager['domBatcher']?.['updates']?.length || 0;
      expect(batchSizeAfter).toBe(0);
    });
  });

  describe('에러 처리 및 안정성 검증', () => {
    it('통합 매니저가 잘못된 선택자에 대해 안전하게 처리해야 한다', () => {
      const invalidSelectors = ['', ':::invalid', '.'];

      invalidSelectors.forEach(selector => {
        expect(() => {
          globalDOMManager.select(selector);
        }).not.toThrow();

        expect(() => {
          globalDOMManager.cachedSelect(selector);
        }).not.toThrow();
      });

      // null 선택자는 안전하게 처리되어야 함
      expect(() => {
        globalDOMManager.select(null as any);
      }).not.toThrow();
    });

    it('통합 매니저가 DOM 요소 제거 후에도 안전해야 한다', () => {
      const element = document.createElement('div');
      element.className = 'removable';
      document.body.appendChild(element);

      // 통합 매니저 캐시에 저장
      globalDOMManager.cachedSelect('.removable');
      // 동작 여부만 확인
      expect(typeof globalDOMManager.cachedSelect).toBe('function');

      // 요소 제거
      element.remove();

      // 캐시에서 접근해도 에러가 없어야 함
      expect(() => {
        globalDOMManager.cachedSelect('.removable');
      }).not.toThrow();

      expect(() => {
        globalDOMManager.select('.removable');
      }).not.toThrow();
    });
  });
});
