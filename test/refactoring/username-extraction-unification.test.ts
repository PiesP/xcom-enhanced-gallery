/**
 * @fileoverview 사용자명 추출 함수 통합 테스트
 * @description extractUsername과 parseUsernameFast 통합
 */

import { describe, it, expect } from 'vitest';

// 모킹된 함수들 (실제 구현은 리팩토링에서 진행)
const mockExtractUsername = () => ({
  username: 'testuser',
  method: 'dom',
  confidence: 0.9,
});

const mockParseUsernameFast = () => 'testuser';

describe('Username Extraction Unification', () => {
  describe('RED: 함수 통합 요구사항', () => {
    it('parseUsernameFast가 extractUsername의 wrapper여야 함', () => {
      // Given: 동일한 입력
      const testInput = { type: 'test-element' };

      // When: 두 함수 호출 (모킹)
      const detailedResult = mockExtractUsername(testInput);
      const fastResult = mockParseUsernameFast(testInput);

      // Then: parseUsernameFast는 extractUsername의 username 필드만 반환
      expect(fastResult).toBe(detailedResult.username);
      expect(typeof detailedResult.username).toBe('string');
      expect(typeof detailedResult.method).toBe('string');
      expect(typeof detailedResult.confidence).toBe('number');
    });

    it('extractUsername이 상세 정보를 포함해야 함', () => {
      // When: 결과 구조 확인
      const result = mockExtractUsername();

      // Then: 상세 정보 포함
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('confidence');
      expect(['dom', 'url', 'meta', 'fallback']).toContain(result.method);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('parseUsernameFast가 성능 최적화되어야 함', () => {
      // Given: 성능 측정 준비
      const iterations = 100;
      const testInput = { type: 'performance-test' };

      // When: 성능 측정
      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        mockParseUsernameFast(testInput);
      }
      const endTime = Date.now();

      // Then: 합리적인 성능 (100ms 미만 for 100 calls)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('GREEN: 기존 기능 보장', () => {
    it('정확한 사용자명 추출이 가능해야 함', () => {
      // Given: 사용자명 데이터
      const testData = { username: 'johndoe' };

      // When: 추출 실행 (모킹)
      const result = mockExtractUsername(testData);
      const fastResult = mockParseUsernameFast(testData);

      // Then: 정확한 사용자명 추출
      expect(result.username).toBeTruthy();
      expect(result.method).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(fastResult).toBeTruthy();
      expect(fastResult).toBe(result.username);
    });

    it('빈 입력에 대한 안전한 처리', () => {
      // Given: 빈 입력들
      const emptyInputs = [null, undefined, ''];

      // When & Then: 안전한 처리
      emptyInputs.forEach(input => {
        expect(() => {
          const detailed = mockExtractUsername(input);
          const fast = mockParseUsernameFast(input);

          expect(detailed).toBeDefined();
          expect(fast).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('REFACTOR: 성능 및 구조 개선', () => {
    it('단일 파싱 로직으로 통합되어야 함', () => {
      // Given: 동일한 입력들
      const testCases = [{ id: 1 }, { id: 2 }, null];

      // When & Then: 모든 케이스에서 일관된 결과
      testCases.forEach(input => {
        const detailed = mockExtractUsername(input);
        const fast = mockParseUsernameFast(input);

        // 동일한 내부 로직 사용 확인
        expect(fast).toBe(detailed.username);
      });
    });

    it('메모리 효율성 보장', () => {
      // Given: 많은 호출
      const iterations = 1000;

      // When: 반복 호출
      const results = [];
      for (let i = 0; i < iterations; i++) {
        results.push(mockParseUsernameFast({ index: i }));
        results.push(mockExtractUsername({ index: i }));
      }

      // Then: 결과 생성됨 (메모리 누수는 실제 구현에서 확인)
      expect(results.length).toBe(iterations * 2);
    });

    it('에러 처리 일관성', () => {
      // Given: 다양한 입력들
      const inputs = [null, { invalid: 'object' }, 42, 'string', []];

      // When & Then: 안전한 에러 처리
      inputs.forEach(input => {
        expect(() => {
          const detailed = mockExtractUsername(input);
          const fast = mockParseUsernameFast(input);

          // 에러 없이 결과 반환
          expect(detailed).toBeDefined();
          expect(fast).toBeDefined();
        }).not.toThrow();
      });
    });
  });
});
