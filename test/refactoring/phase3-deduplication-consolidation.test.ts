/**
 * @fileoverview Phase 3: 중복제거 유틸리티 통합 테스트
 * @description TDD 기반 중복 함수 제거 및 통합 작업
 *
 * TDD 접근:
 * 1. Red: 통합된 함수가 기존 특화 함수와 동일하게 작동하는지 테스트
 * 2. Green: 통합 구현
 * 3. Refactor: 기존 특화 함수들을 제거하고 통합 함수로 대체
 */

import { describe, it, expect } from 'vitest';

describe('Phase 3: Deduplication Utilities Consolidation', () => {
  // 테스트 데이터
  const testStrings = ['apple', 'banana', 'apple', 'cherry', 'banana', 'date'];
  const expectedUniqueStrings = ['apple', 'banana', 'cherry', 'date'];

  const testMediaItems = [
    { url: 'http://example.com/image1.jpg', type: 'image' },
    { url: 'http://example.com/image2.jpg', type: 'image' },
    { url: 'http://example.com/image1.jpg', type: 'image' }, // 중복
    { url: 'http://example.com/video1.mp4', type: 'video' },
    { url: 'http://example.com/image2.jpg', type: 'image' }, // 중복
  ];

  const expectedUniqueMediaItems = [
    { url: 'http://example.com/image1.jpg', type: 'image' },
    { url: 'http://example.com/image2.jpg', type: 'image' },
    { url: 'http://example.com/video1.mp4', type: 'video' },
  ];

  describe('기존 특화 함수들이 제거되고 통합 함수로 대체되었는지 확인', () => {
    it('removeDuplicateStrings가 제거되어 import할 수 없어야 함', async () => {
      try {
        await import('@shared/utils/core-utils');
        // core-utils 모듈은 여전히 존재하지만 removeDuplicateStrings는 export되지 않아야 함
        const coreUtils = await import('@shared/utils/core-utils');
        expect(coreUtils).not.toHaveProperty('removeDuplicateStrings');
      } catch {
        expect.fail('core-utils module should be importable');
      }
    });

    it('removeDuplicateMediaItems가 제거되어 import할 수 없어야 함', async () => {
      try {
        const deduplicationUtils = await import('@shared/utils/deduplication');
        // deduplication 모듈은 여전히 존재하지만 removeDuplicateMediaItems는 export되지 않아야 함
        expect(deduplicationUtils).not.toHaveProperty('removeDuplicateMediaItems');
        expect(deduplicationUtils).toHaveProperty('removeDuplicates');
      } catch {
        expect.fail('deduplication module should be importable');
      }
    });

    it('removeDuplicates 범용 함수가 문자열 배열에 올바르게 작동해야 함', async () => {
      try {
        const { removeDuplicates } = await import('@shared/utils/deduplication');
        const result = removeDuplicates(testStrings);

        expect(result).toHaveLength(expectedUniqueStrings.length);
        expect(result).toEqual(expect.arrayContaining(expectedUniqueStrings));
      } catch {
        // removeDuplicates import failed
        expect.fail('removeDuplicates should be importable');
      }
    });

    it('removeDuplicates 범용 함수가 미디어 아이템에 올바르게 작동해야 함', async () => {
      try {
        const { removeDuplicates } = await import('@shared/utils/deduplication');
        const result = removeDuplicates(testMediaItems, item => item.url);

        expect(result).toHaveLength(expectedUniqueMediaItems.length);
        expect(result).toEqual(expect.arrayContaining(expectedUniqueMediaItems));
      } catch {
        // removeDuplicates import failed
        expect.fail('removeDuplicates should be importable');
      }
    });
  });

  describe('통합 후 동작 검증', () => {
    it('통합된 removeDuplicates가 모든 사용 사례를 커버해야 함', async () => {
      try {
        const { removeDuplicates } = await import('@shared/utils/deduplication');

        // 문자열 배열 중복 제거
        const stringResult = removeDuplicates(testStrings);
        expect(stringResult).toEqual(expect.arrayContaining(expectedUniqueStrings));

        // 미디어 아이템 중복 제거
        const mediaResult = removeDuplicates(testMediaItems, item => item.url);
        expect(mediaResult).toEqual(expect.arrayContaining(expectedUniqueMediaItems));

        // 숫자 배열 중복 제거
        const numbers = [1, 2, 2, 3, 1, 4];
        const numberResult = removeDuplicates(numbers);
        expect(numberResult).toEqual([1, 2, 3, 4]);

        // 객체 배열 중복 제거 (커스텀 키)
        const objects = [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 1, name: 'A' }, // 중복
          { id: 3, name: 'C' },
        ];
        const objectResult = removeDuplicates(objects, obj => obj.id);
        expect(objectResult).toHaveLength(3);
        expect(objectResult.map(obj => obj.id)).toEqual([1, 2, 3]);
      } catch {
        // Unified removeDuplicates test failed
        expect.fail('Unified removeDuplicates should handle all use cases');
      }
    });
  });

  describe('성능 및 메모리 효율성', () => {
    it('대용량 배열에서도 효율적으로 작동해야 함', async () => {
      try {
        const { removeDuplicates } = await import('@shared/utils/deduplication');

        // 대용량 문자열 배열 생성 (10,000개 항목, 50% 중복)
        const largeStringArray = Array.from(
          { length: 10000 },
          (_, i) => `item_${Math.floor(i / 2)}`
        );

        const startTime = Date.now();
        const result = removeDuplicates(largeStringArray);
        const endTime = Date.now();

        expect(result).toHaveLength(5000); // 50% 중복 제거
        expect(endTime - startTime).toBeLessThan(100); // 100ms 이하
      } catch {
        // Performance test failed
        expect.fail('removeDuplicates should be performant with large arrays');
      }
    });

    it('빈 배열과 단일 항목 배열을 올바르게 처리해야 함', async () => {
      try {
        const { removeDuplicates } = await import('@shared/utils/deduplication');

        // 빈 배열
        expect(removeDuplicates([])).toEqual([]);

        // 단일 항목
        expect(removeDuplicates(['single'])).toEqual(['single']);
        expect(removeDuplicates([42])).toEqual([42]);

        // 모든 항목이 동일
        expect(removeDuplicates(['same', 'same', 'same'])).toEqual(['same']);
      } catch {
        // Edge case test failed
        expect.fail('removeDuplicates should handle edge cases');
      }
    });
  });

  describe('타입 안전성 검증', () => {
    it('TypeScript 타입 시스템과 올바르게 작동해야 함', async () => {
      try {
        const { removeDuplicates } = await import('@shared/utils/deduplication');

        // 타입 추론 테스트
        const stringArray = ['a', 'b', 'a'];
        const stringResult = removeDuplicates(stringArray);
        expect(stringResult).toBeInstanceOf(Array);
        expect(typeof stringResult[0]).toBe('string');

        // 제네릭 타입 테스트
        const itemArray = [
          { id: 1, value: 'first' },
          { id: 2, value: 'second' },
          { id: 1, value: 'first' },
        ];

        const itemResult = removeDuplicates(itemArray, item => item.id);
        expect(itemResult).toHaveLength(2);
        expect(itemResult[0]).toHaveProperty('id');
        expect(itemResult[0]).toHaveProperty('value');
      } catch {
        // Type safety test failed
        expect.fail('removeDuplicates should maintain type safety');
      }
    });
  });
});
